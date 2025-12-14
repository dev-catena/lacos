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

class AuthController extends Controller
{
    /**
     * Normalizar valor de gender para formato do banco (male, female, other)
     * O banco usa ENUM('male','female','other')
     */
    private function normalizeGender($gender)
    {
        if (!$gender) {
            return null;
        }
        
        $gender = trim($gender);
        $genderLower = strtolower($gender);
        
        // Converter para valores do ENUM do banco
        if ($genderLower === 'masculino' || $genderLower === 'm' || $genderLower === 'male') {
            return 'male';
        }
        if ($genderLower === 'feminino' || $genderLower === 'f' || $genderLower === 'female') {
            return 'female';
        }
        if ($genderLower === 'other' || $genderLower === 'outro' || $genderLower === 'outros') {
            return 'other';
        }
        
        // Se já for um valor válido do ENUM, retorna como está
        if (in_array($genderLower, ['male', 'female', 'other'])) {
            return $genderLower;
        }
        
        // Log para debug se não reconhecer
        \Log::warning('Gender não reconhecido: ' . $gender . ', usando "male" como padrão');
        return 'male'; // Default para male se não reconhecer
    }

    /**
     * Enviar email inicial quando médico se cadastra
     */
    private function sendRegistrationReceivedEmail($doctor)
    {
        try {
            $mailDriver = config('mail.default', 'smtp');
            
            \Log::info('Enviando email de registro recebido para: ' . $doctor->email);
            
            if ($mailDriver !== 'log' && class_exists('\Illuminate\Support\Facades\Mail')) {
                try {
                    Mail::send('emails.doctor-registration-received', [
                        'doctor' => $doctor
                    ], function ($message) use ($doctor) {
                        $message->to($doctor->email, $doctor->name)
                                ->subject('Cadastro Recebido - Laços');
                    });
                    
                    \Log::info('✅ Email de registro recebido enviado via SMTP para: ' . $doctor->email);
                    return;
                } catch (\Exception $mailException) {
                    \Log::error('Erro no Mail::send() (registro recebido): ' . $mailException->getMessage());
                    // Continuar para fallback
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
            
            $sent = mail($doctor->email, $subject, $message, $headers);
            
            if (!$sent) {
                \Log::warning('Falha ao enviar email de registro recebido para: ' . $doctor->email);
            } else {
                \Log::info('Email de registro recebido enviado via mail() para: ' . $doctor->email);
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
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Carregar usuário com campos específicos para verificação de médico
            $user = User::where('email', $request->email)
                ->select('*') // Garantir que todos os campos são carregados
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciais inválidas'
                ], 401);
            }

            // Verificar se está bloqueado (verificação segura)
            if ($user) {
                $isBlocked = false;
                // Verificar se a propriedade existe e está bloqueada
                if (property_exists($user, 'is_blocked') || isset($user->is_blocked)) {
                    $blockedValue = $user->is_blocked;
                    if ($blockedValue === true || $blockedValue === 1 || 
                        $blockedValue === '1' || $blockedValue === 'true' ||
                        (is_string($blockedValue) && strtolower(trim($blockedValue)) === 'true')) {
                        $isBlocked = true;
                    }
                }
                
                if ($isBlocked) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Acesso negado. Sua conta foi bloqueada.',
                        'error' => 'account_blocked'
                    ], 403);
                }

                // Verificar se é médico e se foi aprovado e ativado
                if ($user->profile === 'doctor') {
                    // Verificar se foi aprovado pelo root
                    if (!$user->doctor_approved_at) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Seu processo está em análise. Acompanhe pelo seu email.',
                            'error' => 'doctor_pending_approval',
                            'status' => 'pending_approval'
                        ], 403);
                    }
                    
                    // Verificar se foi ativado via link do email
                    // Fazer query direta ao banco para garantir que temos o valor correto do token
                    $doctorData = DB::table('users')
                        ->where('id', $user->id)
                        ->select('doctor_activation_token', 'doctor_activation_token_expires_at')
                        ->first();
                    
                    // Verificar se tem token de ativação (se tem, ainda não foi ativado)
                    // Se o token for NULL ou string vazia, a conta está ativada
                    $hasActivationToken = false;
                    $activationToken = $doctorData->doctor_activation_token ?? null;
                    
                    // Log para debug
                    \Log::info('Verificando ativação do médico', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'token_value' => $activationToken ? 'EXISTS' : 'NULL',
                        'token_length' => $activationToken ? strlen($activationToken) : 0
                    ]);
                    
                    // Verificar se tem token válido (não NULL e não vazio)
                    if ($activationToken !== null && $activationToken !== '' && trim($activationToken) !== '') {
                        $hasActivationToken = true;
                        
                        \Log::info('Médico tentou login sem ativar conta', [
                            'user_id' => $user->id,
                            'email' => $user->email,
                            'has_token' => true,
                            'token_preview' => substr($activationToken, 0, 10) . '...'
                        ]);
                        
                        // Verificar também se o token não expirou (se expirou, precisa reenviar)
                        $tokenExpired = false;
                        if ($doctorData->doctor_activation_token_expires_at) {
                            try {
                                $expiresAt = \Carbon\Carbon::parse($doctorData->doctor_activation_token_expires_at);
                                if (now()->greaterThan($expiresAt)) {
                                    $tokenExpired = true;
                                }
                            } catch (\Exception $e) {
                                \Log::warning('Erro ao verificar expiração do token', [
                                    'error' => $e->getMessage()
                                ]);
                            }
                        }
                        
                        if ($tokenExpired) {
                            return response()->json([
                                'success' => false,
                                'message' => 'O link de ativação expirou. Entre em contato com o suporte para reenviar o link.',
                                'error' => 'doctor_activation_token_expired',
                                'status' => 'activation_token_expired'
                            ], 403);
                        }
                        
                        return response()->json([
                            'success' => false,
                            'message' => 'Por favor, ative sua conta clicando no link enviado por email.',
                            'error' => 'doctor_pending_activation',
                            'status' => 'pending_activation'
                        ], 403);
                    } else {
                        // Token é NULL ou vazio - conta está ativada, permitir login
                        \Log::info('Médico com conta ativada tentando login', [
                            'user_id' => $user->id,
                            'email' => $user->email,
                            'has_token' => false
                        ]);
                    }
                }
            }

            // Verificar senha
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciais inválidas'
                ], 401);
            }

            // Criar token
            $token = $user->createToken('mobile-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'user' => $user,
                'token' => $token,
                'message' => 'Login realizado com sucesso'
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro no login: ' . $e->getMessage());
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
            // Validação base
            $rules = [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:6|confirmed',
                'phone' => 'nullable|string|max:20',
                'birth_date' => 'nullable|date',
                'gender' => 'nullable|string|max:20',
                'profile' => 'nullable|in:caregiver,accompanied,professional_caregiver,doctor,patient',
            ];

            // Validação específica para cuidador profissional
            if ($request->profile === 'professional_caregiver') {
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
            if ($request->profile === 'doctor') {
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

            // Normalizar gender antes de criar usuário
            $normalizedGender = $this->normalizeGender($validated['gender'] ?? null);
            \Log::info('Gender normalizado: ' . ($validated['gender'] ?? 'null') . ' -> ' . ($normalizedGender ?? 'null'));

            // Criar usuário
            $userData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'birth_date' => $validated['birth_date'] ?? null,
                'gender' => $normalizedGender,
                'profile' => $validated['profile'] ?? 'caregiver',
                'is_blocked' => false, // Usuários novos não são bloqueados
            ];

            // Campos específicos de cuidador profissional
            if ($validated['profile'] === 'professional_caregiver') {
                $userData['city'] = $validated['city'] ?? null;
                $userData['neighborhood'] = $validated['neighborhood'] ?? null;
                $userData['formation_details'] = $validated['formation_details'] ?? null;
                $userData['hourly_rate'] = $validated['hourly_rate'] ?? null;
                $userData['availability'] = $validated['availability'] ?? null;
                $userData['latitude'] = $validated['latitude'] ?? null;
                $userData['longitude'] = $validated['longitude'] ?? null;
                $userData['is_available'] = $validated['is_available'] ?? true;
            }

            // Campos específicos de médico
            if ($validated['profile'] === 'doctor') {
                $userData['city'] = $validated['city'] ?? null;
                $userData['neighborhood'] = $validated['neighborhood'] ?? null;
                $userData['crm'] = $validated['crm'] ?? null;
                $userData['medical_specialty_id'] = $validated['medical_specialty_id'] ?? null;
                $userData['availability'] = $validated['availability'] ?? null;
                $userData['latitude'] = $validated['latitude'] ?? null;
                $userData['longitude'] = $validated['longitude'] ?? null;
                $userData['is_available'] = $validated['is_available'] ?? true;
                // Médicos precisam de aprovação
                $userData['doctor_approved_at'] = null;
            }

            $user = User::create($userData);

            // Se for médico, não criar token (precisa aprovação e ativação)
            if ($validated['profile'] === 'doctor') {
                // Enviar email inicial informando que o cadastro foi recebido
                try {
                    $this->sendRegistrationReceivedEmail($user);
                } catch (\Exception $emailError) {
                    \Log::error('Erro ao enviar email de registro recebido: ' . $emailError->getMessage());
                    // Continuar mesmo se falhar o email
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
}

