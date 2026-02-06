<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Services\WhatsAppService;

class AuthController extends Controller
{
    /**
     * Validar CPF
     */
    private function validateCPF($cpf)
    {
        $cpf = preg_replace('/[^0-9]/', '', $cpf);
        
        if (strlen($cpf) != 11) {
            return false;
        }
        
        if (preg_match('/(\d)\1{10}/', $cpf)) {
            return false;
        }
        
        for ($t = 9; $t < 11; $t++) {
            for ($d = 0, $c = 0; $c < $t; $c++) {
                $d += $cpf[$c] * (($t + 1) - $c);
            }
            $d = ((10 * $d) % 11) % 10;
            if ($cpf[$c] != $d) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Detectar se é CPF ou Email
     */
    private function detectLoginType($login)
    {
        // Remove formatação do CPF
        $clean = preg_replace('/[^0-9]/', '', $login);
        
        // Se tiver 11 dígitos, provavelmente é CPF
        if (strlen($clean) == 11 && is_numeric($clean)) {
            return 'cpf';
        }
        
        // Se contém @, é email
        if (strpos($login, '@') !== false) {
            return 'email';
        }
        
        // Padrão: assumir email
        return 'email';
    }

    /**
     * Normalizar valor de gender para formato do banco (masculino, feminino, outro)
     */
    private function normalizeGender($gender)
    {
        if (!$gender) {
            return null;
        }
        
        $gender = trim($gender);
        $genderLower = strtolower($gender);
        
        // Mapear para os valores do ENUM do banco de dados
        if ($genderLower === 'masculino' || $genderLower === 'm' || $genderLower === 'male') {
            return 'masculino';
        }
        if ($genderLower === 'feminino' || $genderLower === 'f' || $genderLower === 'female') {
            return 'feminino';
        }
        if ($genderLower === 'other' || $genderLower === 'outro' || $genderLower === 'outros') {
            return 'outro';
        }
        
        // Se já estiver no formato correto, retornar como está
        if (in_array($genderLower, ['masculino', 'feminino', 'outro'])) {
            return $genderLower;
        }
        
        \Log::warning('Gender não reconhecido: ' . $gender . ', usando "masculino" como padrão');
        return 'masculino';
    }

    /**
     * Enviar email inicial quando médico se cadastra
     */
    private function sendRegistrationReceivedEmail($doctor)
    {
        try {
            $mailDriver = config('mail.default', 'smtp');
            $to = $doctor->email;
            
            if (!$to) {
                \Log::warning('Tentativa de enviar email para médico sem email: ' . $doctor->id);
                return;
            }
            
            \Log::info('Enviando email de registro recebido para: ' . $to);
            
            // Usar Mail do Laravel (funciona com qualquer driver: smtp, sendmail, log, etc)
            try {
                \Log::info('Tentando enviar via Mail::send() do Laravel para: ' . $to);
                \Log::info('Mail driver configurado: ' . $mailDriver);
                
                Mail::send('emails.doctor-registration-received', [
                    'doctor' => $doctor
                ], function ($message) use ($doctor) {
                    $message->to($doctor->email, $doctor->name)
                            ->subject('Cadastro Recebido - Laços');
                });
                
                \Log::info('✅ Email de registro recebido enviado via Laravel Mail para: ' . $to);
                return;
            } catch (\Exception $mailException) {
                \Log::error('Erro no Mail::send() do Laravel (registro recebido): ' . $mailException->getMessage(), [
                    'trace' => $mailException->getTraceAsString(),
                    'driver' => $mailDriver
                ]);
                // Continuar para fallback apenas se não for driver 'log'
                if ($mailDriver === 'log') {
                    \Log::warning('Driver "log" detectado - email não será enviado, apenas logado. Configure SMTP no .env para enviar emails reais.');
                    return;
                }
            }
            
            // Fallback: usar mail() nativo se SMTP não estiver configurado
            $subject = 'Cadastro Recebido - Laços';
            $message = view('emails.doctor-registration-received', [
                'doctor' => $doctor
            ])->render();

            $headers = "MIME-Version: 1.0" . "\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
            $headers .= "From: " . config('mail.from.name', 'Laços') . " <" . config('mail.from.address', 'noreply@lacos.com') . ">" . "\r\n";
            $headers .= "Reply-To: " . config('mail.from.address', 'noreply@lacos.com') . "\r\n";
            
            $sent = mail($to, $subject, $message, $headers);
            
            if (!$sent) {
                \Log::warning('Falha ao enviar email de registro recebido para: ' . $to);
            } else {
                \Log::info('Email de registro recebido enviado via mail() para: ' . $to);
            }
        } catch (\Exception $e) {
            \Log::error('Erro ao enviar email de registro recebido: ' . $e->getMessage(), [
                'doctor_email' => $doctor->email,
                'error' => $e->getTraceAsString()
            ]);
        }
    }

    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'login' => 'required|string', // CPF ou Email
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $login = $request->login;
            $loginType = $this->detectLoginType($login);

            // Buscar usuários baseado no tipo de login
            if ($loginType === 'cpf') {
                // Buscar médico por CPF
                $cpf = preg_replace('/[^0-9]/', '', $login);
                $query = User::where('cpf', $cpf);
                // Verificar se a coluna profile existe antes de usar
                if (Schema::hasColumn('users', 'profile')) {
                    $query->where('profile', 'doctor');
                }
                $users = $query->get();
            } else {
                // Buscar todos os perfis por email
                $users = User::where('email', $login)->get();
            }

            if ($users->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciais inválidas'
                ], 401);
            }

            // Se múltiplos perfis encontrados, retornar lista
            if ($users->count() > 1) {
                $profiles = $users->map(function ($user) {
                    $profile = Schema::hasColumn('users', 'profile') ? ($user->profile ?? 'caregiver') : 'caregiver';
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'profile' => $profile,
                        'profile_label' => $this->getProfileLabel($profile),
                    ];
                })->toArray();

                return response()->json([
                    'success' => false,
                    'requires_profile_selection' => true,
                    'profiles' => $profiles,
                    'message' => 'Selecione o perfil para fazer login'
                ], 200);
            }

            // Um único perfil encontrado
            $user = $users->first();

            // Verificar se está bloqueado
            $isBlocked = false;
            if ($user->is_blocked === true || $user->is_blocked === 1 || 
                $user->is_blocked === '1' || $user->is_blocked === 'true' ||
                (is_string($user->is_blocked) && strtolower($user->is_blocked) === 'true')) {
                $isBlocked = true;
            }
            
            if ($isBlocked) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Sua conta foi bloqueada.',
                    'error' => 'account_blocked'
                ], 403);
            }

            // Verificar senha
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciais inválidas'
                ], 401);
            }

            // Verificações específicas para médico
            $userProfile = Schema::hasColumn('users', 'profile') ? ($user->profile ?? 'caregiver') : 'caregiver';
            if ($userProfile === 'doctor') {
                if (!$user->doctor_approved_at) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sua conta ainda não foi aprovada. Aguarde a aprovação.',
                        'requires_approval' => true
                    ], 403);
                }

                if ($user->doctor_activation_token) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sua conta precisa ser ativada. Verifique seu email.',
                        'requires_activation' => true
                    ], 403);
                }
            }

            // Verificar 2FA se habilitado
            if ($user->two_factor_enabled && $user->two_factor_method) {
                // Gerar código 2FA
                $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
                $user->two_factor_code = $code;
                $user->two_factor_expires_at = now()->addMinutes(10);
                $user->save();

                // Enviar código via WhatsApp se configurado
                if ($user->two_factor_method === 'whatsapp' && $user->two_factor_phone) {
                    try {
                        $whatsappService = new WhatsAppService();
                        $whatsappService->sendMessage(
                            $user->two_factor_phone,
                            "Seu código de verificação Laços: {$code}"
                        );
                    } catch (\Exception $e) {
                        \Log::error('Erro ao enviar código 2FA via WhatsApp: ' . $e->getMessage());
                    }
                }

                return response()->json([
                    'success' => false,
                    'requires_2fa' => true,
                    'message' => 'Código enviado via ' . ($user->two_factor_method === 'whatsapp' ? 'WhatsApp' : 'SMS'),
                    'method' => $user->two_factor_method
                ], 200);
            }

            // Criar token
            $token = $user->createToken('mobile-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'token' => $token,
                'user' => $user
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erro no login: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erro ao fazer login',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error'
            ], 500);
        }
    }

    /**
     * Login com perfil selecionado (quando múltiplos perfis)
     */
    public function loginWithProfile(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'login' => 'required|string',
                'password' => 'required|string',
                'profile_id' => 'required|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::find($request->profile_id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Perfil não encontrado'
                ], 404);
            }

            // Verificar se o login corresponde
            $loginType = $this->detectLoginType($request->login);
            $loginMatches = false;

            if ($loginType === 'cpf') {
                $cpf = preg_replace('/[^0-9]/', '', $request->login);
                $userProfile = Schema::hasColumn('users', 'profile') ? ($user->profile ?? 'caregiver') : 'caregiver';
                $loginMatches = ($user->cpf === $cpf && $userProfile === 'doctor');
            } else {
                $loginMatches = ($user->email === $request->login);
            }

            if (!$loginMatches) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciais inválidas'
                ], 401);
            }

            // Verificar senha
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciais inválidas'
                ], 401);
            }

            // Verificar bloqueio
            $isBlocked = false;
            if ($user->is_blocked === true || $user->is_blocked === 1 || 
                $user->is_blocked === '1' || $user->is_blocked === 'true' ||
                (is_string($user->is_blocked) && strtolower($user->is_blocked) === 'true')) {
                $isBlocked = true;
            }
            
            if ($isBlocked) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Sua conta foi bloqueada.',
                    'error' => 'account_blocked'
                ], 403);
            }

            // Verificações específicas para médico
            $userProfile = Schema::hasColumn('users', 'profile') ? ($user->profile ?? 'caregiver') : 'caregiver';
            if ($userProfile === 'doctor') {
                if (!$user->doctor_approved_at) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sua conta ainda não foi aprovada. Aguarde a aprovação.',
                        'requires_approval' => true
                    ], 403);
                }

                if ($user->doctor_activation_token) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sua conta precisa ser ativada. Verifique seu email.',
                        'requires_activation' => true
                    ], 403);
                }
            }

            // Criar token
            $token = $user->createToken('mobile-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'token' => $token,
                'user' => $user
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erro no login com perfil: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao fazer login',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error'
            ], 500);
        }
    }

    public function register(Request $request)
    {
        try {
            $profile = $request->profile ?? 'caregiver';
            
            // Validação base
            $rules = [
                'name' => 'required|string|max:255',
                'password' => 'required|string|min:6|confirmed',
                'phone' => 'nullable|string|max:20',
                'birth_date' => 'nullable|date',
                'gender' => 'nullable|string|max:20',
                'profile' => 'nullable|in:caregiver,accompanied,professional_caregiver,doctor,patient',
            ];

            // Validação específica por perfil
            if ($profile === 'doctor') {
                // Médico: CPF obrigatório, email opcional
                $rules['cpf'] = [
                    'required',
                    'string',
                    'max:14',
                    function ($attribute, $value, $fail) {
                        $cpf = preg_replace('/[^0-9]/', '', $value);
                        if (!$this->validateCPF($cpf)) {
                            $fail('CPF inválido.');
                        }
                    },
                    function ($attribute, $value, $fail) {
                        $cpf = preg_replace('/[^0-9]/', '', $value);
                        $query = User::where('cpf', $cpf);
                        // Verificar se a coluna profile existe antes de usar
                        if (Schema::hasColumn('users', 'profile')) {
                            $query->where('profile', 'doctor');
                        }
                        $exists = $query->exists();
                        if ($exists) {
                            $fail('Já existe uma conta de médico com este CPF.');
                        }
                    }
                ];
                $rules['email'] = 'nullable|string|email|max:255';
            } else {
                // Outros perfis: Email obrigatório
                // Verificar se a coluna profile existe antes de usar na validação unique
                if (Schema::hasColumn('users', 'profile')) {
                    $rules['email'] = 'required|string|email|max:255|unique:users,email,NULL,id,profile,' . $profile;
                } else {
                    $rules['email'] = 'required|string|email|max:255|unique:users,email';
                }
            }

            // Validação específica para cuidador profissional
            if ($profile === 'professional_caregiver') {
                $rules = array_merge($rules, [
                    'gender' => 'required|string|in:male,female,other,M,F,Masculino,Feminino',
                    'city' => 'required|string|max:100',
                    'neighborhood' => 'required|string|max:100',
                    'formation_details' => 'required|string|in:Cuidador,Auxiliar de enfermagem',
                    'hourly_rate' => 'required|numeric|min:0',
                    'availability' => 'required|string|max:500',
                    'latitude' => 'nullable|numeric|between:-90,90',
                    'longitude' => 'nullable|numeric|between:-180,180',
                    'is_available' => 'nullable|boolean',
                ]);
            }

            // Validação específica para médico
            if ($profile === 'doctor') {
                $rules = array_merge($rules, [
                    'gender' => 'required|string|in:male,female,other,M,F,Masculino,Feminino',
                    'city' => 'required|string|max:100',
                    'neighborhood' => 'required|string|max:100',
                    'crm' => 'required|string|max:20',
                    'medical_specialty_id' => 'required|integer|exists:medical_specialties,id',
                    'availability' => 'nullable|string|max:500',
                    'latitude' => 'nullable|numeric|between:-90,90',
                    'longitude' => 'nullable|numeric|between:-180,180',
                    'is_available' => 'nullable|boolean',
                ]);
            }

            $validated = $request->validate($rules);

            // Normalizar gender
            $normalizedGender = $this->normalizeGender($validated['gender'] ?? null);

            // Criar usuário
            $userData = [
                'name' => $validated['name'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'birth_date' => $validated['birth_date'] ?? null,
                'gender' => $normalizedGender,
                'is_blocked' => false,
            ];
            
            // Adicionar last_name se a coluna existir
            if (Schema::hasColumn('users', 'last_name')) {
                $userData['last_name'] = $validated['last_name'] ?? null;
            }
            
            // Adicionar profile apenas se a coluna existir
            if (Schema::hasColumn('users', 'profile')) {
                $userData['profile'] = $profile;
            }

            // Adicionar CPF ou Email baseado no perfil
            if ($profile === 'doctor') {
                $userData['cpf'] = preg_replace('/[^0-9]/', '', $validated['cpf']);
                $userData['email'] = $validated['email'] ?? null;
            } else {
                $userData['email'] = $validated['email'];
            }

            // Campos específicos de cuidador profissional
            if ($profile === 'professional_caregiver') {
                if (Schema::hasColumn('users', 'city')) {
                    $userData['city'] = $validated['city'] ?? null;
                }
                if (Schema::hasColumn('users', 'neighborhood')) {
                    $userData['neighborhood'] = $validated['neighborhood'] ?? null;
                }
                if (Schema::hasColumn('users', 'formation_details')) {
                    $userData['formation_details'] = $validated['formation_details'] ?? null;
                }
                if (Schema::hasColumn('users', 'hourly_rate')) {
                    $userData['hourly_rate'] = $validated['hourly_rate'] ?? null;
                }
                if (Schema::hasColumn('users', 'availability')) {
                    $userData['availability'] = $validated['availability'] ?? null;
                }
                if (Schema::hasColumn('users', 'latitude')) {
                    $userData['latitude'] = $validated['latitude'] ?? null;
                }
                if (Schema::hasColumn('users', 'longitude')) {
                    $userData['longitude'] = $validated['longitude'] ?? null;
                }
                if (Schema::hasColumn('users', 'is_available')) {
                    $userData['is_available'] = $validated['is_available'] ?? true;
                }
            }

            // Campos específicos de médico
            if ($profile === 'doctor') {
                if (Schema::hasColumn('users', 'city')) {
                    $userData['city'] = $validated['city'] ?? null;
                }
                if (Schema::hasColumn('users', 'neighborhood')) {
                    $userData['neighborhood'] = $validated['neighborhood'] ?? null;
                }
                if (Schema::hasColumn('users', 'crm')) {
                    $userData['crm'] = $validated['crm'] ?? null;
                }
                if (Schema::hasColumn('users', 'medical_specialty_id')) {
                    $userData['medical_specialty_id'] = $validated['medical_specialty_id'] ?? null;
                }
                if (Schema::hasColumn('users', 'availability')) {
                    $userData['availability'] = $validated['availability'] ?? null;
                }
                if (Schema::hasColumn('users', 'latitude')) {
                    $userData['latitude'] = $validated['latitude'] ?? null;
                }
                if (Schema::hasColumn('users', 'longitude')) {
                    $userData['longitude'] = $validated['longitude'] ?? null;
                }
                if (Schema::hasColumn('users', 'is_available')) {
                    $userData['is_available'] = $validated['is_available'] ?? true;
                }
                if (Schema::hasColumn('users', 'doctor_approved_at')) {
                    $userData['doctor_approved_at'] = null;
                }
            }

            $user = User::create($userData);

            // Se for médico, não criar token (precisa aprovação e ativação)
            if ($profile === 'doctor') {
                try {
                    $this->sendRegistrationReceivedEmail($user);
                } catch (\Exception $emailError) {
                    \Log::error('Erro ao enviar email de registro recebido: ' . $emailError->getMessage());
                }

                return response()->json([
                    'success' => true,
                    'user' => $user,
                    'message' => 'Seu processo está em análise. Acompanhe pelo seu email.',
                    'requires_approval' => true,
                    'status' => 'pending_approval'
                ], 201);
            }

            // Criar token para outros perfis
            $token = $user->createToken('mobile-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'user' => $user,
                'token' => $token,
                'message' => 'Cadastro realizado com sucesso'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Erro no registro: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao criar conta',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error'
            ], 500);
        }
    }

    /**
     * Obter label do perfil
     */
    private function getProfileLabel($profile)
    {
        $labels = [
            'doctor' => 'Médico',
            'caregiver' => 'Cuidador/Amigo',
            'professional_caregiver' => 'Cuidador Profissional',
            'patient' => 'Paciente',
            'accompanied' => 'Acompanhado',
        ];
        return $labels[$profile] ?? $profile;
    }

    /**
     * Logout do usuário
     * POST /api/logout
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            
            if ($user) {
                // Revogar todos os tokens do usuário
                $user->tokens()->delete();
                
                Log::info('Logout realizado', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Logout realizado com sucesso'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erro no logout: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao fazer logout',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error'
            ], 500);
        }
    }
}

