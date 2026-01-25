<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class AdminDoctorController extends Controller
{
    /**
     * Listar médicos pendentes de aprovação
     * GET /api/admin/doctors/pending
     */
    public function getPending()
    {
        try {
            $doctors = User::where('profile', 'doctor')
                ->where(function($query) {
                    $query->whereNull('doctor_approved_at')
                          ->orWhere('doctor_approved_at', '=', '0000-00-00 00:00:00');
                })
                ->where('is_blocked', false)
                ->orderBy('users.created_at', 'desc')
                ->get()
                ->map(function($doctor) {
                    // Buscar especialidade diretamente do banco se houver medical_specialty_id
                    $specialty = null;
                    if (isset($doctor->medical_specialty_id) && $doctor->medical_specialty_id) {
                        $specialtyData = DB::table('medical_specialties')
                            ->where('id', $doctor->medical_specialty_id)
                            ->select('id', 'name')
                            ->first();
                        if ($specialtyData) {
                            $specialty = [
                                'id' => $specialtyData->id,
                                'name' => $specialtyData->name,
                            ];
                        }
                    }
                    
                    return [
                        'id' => $doctor->id,
                        'name' => $doctor->name,
                        'email' => $doctor->email,
                        'cpf' => $doctor->cpf ?? null,
                        'crm' => $doctor->crm ?? null,
                        'specialty' => $specialty,
                        'created_at' => $doctor->created_at,
                    ];
                });

            return response()->json($doctors);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar médicos pendentes',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar todos os médicos
     * GET /api/admin/doctors
     */
    public function index()
    {
        try {
            $doctors = User::where('profile', 'doctor')
                ->orderBy('doctor_approved_at', 'desc')
                ->orderBy('users.created_at', 'desc')
                ->get()
                ->map(function($doctor) {
                    // Buscar especialidade diretamente do banco se houver medical_specialty_id
                    $specialty = null;
                    if (isset($doctor->medical_specialty_id) && $doctor->medical_specialty_id) {
                        $specialtyData = DB::table('medical_specialties')
                            ->where('id', $doctor->medical_specialty_id)
                            ->select('id', 'name')
                            ->first();
                        if ($specialtyData) {
                            $specialty = [
                                'id' => $specialtyData->id,
                                'name' => $specialtyData->name,
                            ];
                        }
                    }
                    
                    // Verificar se está ativado (approved_at existe E token é NULL)
                    $isActivated = $doctor->doctor_approved_at && 
                                   ($doctor->doctor_activation_token === null || $doctor->doctor_activation_token === '');
                    
                    return [
                        'id' => $doctor->id,
                        'name' => $doctor->name,
                        'email' => $doctor->email,
                        'cpf' => $doctor->cpf ?? null,
                        'crm' => $doctor->crm ?? null,
                        'specialty' => $specialty,
                        'is_blocked' => (bool) $doctor->is_blocked,
                        'approved_at' => $doctor->doctor_approved_at,
                        'is_activated' => $isActivated, // Novo campo para indicar se está ativado
                        'created_at' => $doctor->created_at,
                    ];
                });

            return response()->json($doctors);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar médicos',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Aprovar médico
     * POST /api/admin/doctors/{id}/approve
     */
    public function approve($id)
    {
        try {
            $doctor = User::where('id', $id)
                ->where('profile', 'doctor')
                ->firstOrFail();

            // Gerar token de ativação (válido por 7 dias)
            $activationToken = bin2hex(random_bytes(32));
            $expiresAt = now()->addDays(7);

            // Usar update direto no banco para garantir que salva
            DB::table('users')
                ->where('id', $doctor->id)
                ->update([
                    'doctor_approved_at' => now(),
                    'is_blocked' => false,
                    'doctor_activation_token' => $activationToken,
                    'doctor_activation_token_expires_at' => $expiresAt,
                    'updated_at' => now()
                ]);
            
            // Recarregar o modelo
            $doctor->refresh();
            
            \Log::info('Médico aprovado', [
                'doctor_id' => $doctor->id,
                'email' => $doctor->email,
                'approved_at' => $doctor->doctor_approved_at,
                'has_token' => !empty($activationToken)
            ]);

            // Enviar email com link de ativação
            try {
                \Log::info('Tentando enviar email de ativação para: ' . $doctor->email);
                $this->sendActivationEmail($doctor, $activationToken);
                \Log::info('Email de ativação processado para: ' . $doctor->email);
            } catch (\Exception $emailError) {
                \Log::error('Erro ao enviar email de ativação: ' . $emailError->getMessage(), [
                    'doctor_id' => $doctor->id,
                    'doctor_email' => $doctor->email,
                    'trace' => $emailError->getTraceAsString()
                ]);
                // Continuar mesmo se falhar o email
            }

            return response()->json([
                'message' => 'Médico aprovado com sucesso. Email de ativação enviado.',
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                    'approved_at' => $doctor->doctor_approved_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao aprovar médico',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enviar email de ativação para o médico
     */
    private function sendActivationEmail($doctor, $token)
    {
        try {
            // Sempre usar URL da API diretamente (mais confiável)
            // Usar configuração do backend (pode ser sobrescrita via .env)
            $baseUrl = config('backend.base_url', config('app.url', 'http://10.102.0.103:8000'));
            // Usar urlencode para garantir que caracteres especiais no token sejam tratados corretamente
            $activationUrl = $baseUrl . '/api/doctors/activate?token=' . urlencode($token);
            
            \Log::info('URL de ativação gerada', [
                'url' => $activationUrl,
                'token_length' => strlen($token),
                'base_url' => $baseUrl
            ]);

            // Tentar usar Mail do Laravel (SMTP) primeiro
            $mailDriver = config('mail.default', 'smtp');
            
            \Log::info('Mail driver: ' . $mailDriver);
            \Log::info('Template path: emails.doctor-activation');
            
            if ($mailDriver !== 'log' && class_exists('\Illuminate\Support\Facades\Mail')) {
                try {
                    \Log::info('Tentando enviar via Mail::send() para: ' . $doctor->email);
                    
                    Mail::send('emails.doctor-activation', [
                        'doctor' => $doctor,
                        'activationUrl' => $activationUrl
                    ], function ($message) use ($doctor) {
                        $message->to($doctor->email, $doctor->name)
                                ->subject('Ative sua conta de médico - Laços');
                    });
                    
                    \Log::info('✅ Email de ativação enviado via SMTP para: ' . $doctor->email);
                    return;
                } catch (\Exception $mailException) {
                    \Log::error('Erro no Mail::send(): ' . $mailException->getMessage(), [
                        'trace' => $mailException->getTraceAsString()
                    ]);
                    // Continuar para fallback
                }
            }
            
            // Fallback: usar mail() nativo se SMTP não estiver configurado
            $subject = 'Ative sua conta de médico - Laços';
            $message = view('emails.doctor-activation', [
                'doctor' => $doctor,
                'activationUrl' => $activationUrl
            ])->render();

            $headers = "MIME-Version: 1.0" . "\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
            $headers .= "From: " . config('mail.from.name', 'Laços') . " <" . config('mail.from.address', 'noreply@lacos.com') . ">" . "\r\n";
            $headers .= "Reply-To: " . config('mail.from.address', 'noreply@lacos.com') . "\r\n";
            
            $sent = mail($doctor->email, $subject, $message, $headers);
            
            if (!$sent) {
                Log::warning('Falha ao enviar email de ativação para: ' . $doctor->email);
            } else {
                Log::info('Email de ativação enviado via mail() para: ' . $doctor->email);
            }
        } catch (\Exception $e) {
            Log::error('Erro ao enviar email de ativação: ' . $e->getMessage(), [
                'doctor_email' => $doctor->email,
                'error' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Rejeitar médico
     * POST /api/admin/doctors/{id}/reject
     */
    public function reject($id)
    {
        try {
            $doctor = User::where('id', $id)
                ->where('profile', 'doctor')
                ->firstOrFail();

            // Bloquear o médico (rejeição = bloqueio)
            $doctor->is_blocked = true;
            $doctor->doctor_approved_at = null;
            $doctor->save();

            // Revogar todos os tokens do médico
            $doctor->tokens()->delete();

            return response()->json([
                'message' => 'Médico rejeitado com sucesso',
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                    'is_blocked' => true,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao rejeitar médico',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bloquear médico
     * POST /api/admin/doctors/{id}/block
     */
    public function block($id)
    {
        try {
            $doctor = User::where('id', $id)
                ->where('profile', 'doctor')
                ->firstOrFail();

            $doctor->is_blocked = true;
            $doctor->save();

            // Revogar todos os tokens do médico
            $doctor->tokens()->delete();

            return response()->json([
                'message' => 'Médico bloqueado com sucesso',
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                    'is_blocked' => true,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao bloquear médico',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ativar conta de médico via token do email
     * GET /api/doctors/activate?token=xxx
     */
    public function activate(Request $request)
    {
        // Limpar todos os output buffers para evitar vazamento de texto
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        try {
            $token = $request->query('token');
            
            \Log::info('Tentativa de ativação recebida', [
                'token' => $token ? substr($token, 0, 10) . '...' : 'NULL',
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl()
            ]);

            if (!$token) {
                \Log::warning('Token de ativação não fornecido');
                return response()->json([
                    'success' => false,
                    'message' => 'Token de ativação não fornecido'
                ], 400);
            }

            // Buscar médico com o token
            $doctor = User::where('doctor_activation_token', $token)
                ->where('profile', 'doctor')
                ->first();
            
            \Log::info('Busca por médico com token', [
                'token_preview' => substr($token, 0, 10) . '...',
                'doctor_found' => $doctor ? 'SIM' : 'NÃO',
                'doctor_id' => $doctor ? $doctor->id : null,
                'doctor_email' => $doctor ? $doctor->email : null
            ]);

            if (!$doctor) {
                \Log::warning('Médico não encontrado com o token fornecido', [
                    'token_preview' => substr($token, 0, 10) . '...'
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Token inválido ou expirado'
                ], 400);
            }

            // Verificar se o token expirou
            if ($doctor->doctor_activation_token_expires_at) {
                $expiresAt = \Carbon\Carbon::parse($doctor->doctor_activation_token_expires_at);
                if (now()->greaterThan($expiresAt)) {
                    \Log::warning('Token de ativação expirado', [
                        'doctor_id' => $doctor->id,
                        'expires_at' => $doctor->doctor_activation_token_expires_at,
                        'now' => now()
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Token de ativação expirado. Entre em contato com o suporte.'
                    ], 400);
                }
            }

            \Log::info('Iniciando ativação do médico', [
                'doctor_id' => $doctor->id,
                'email' => $doctor->email,
                'current_token' => substr($doctor->doctor_activation_token, 0, 10) . '...'
            ]);

            // Ativar conta - usar update direto no banco para garantir que salva
            $updated = DB::table('users')
                ->where('id', $doctor->id)
                ->update([
                    'doctor_activation_token' => null,
                    'doctor_activation_token_expires_at' => null,
                    'updated_at' => now()
                ]);
            
            \Log::info('Update executado no banco', [
                'doctor_id' => $doctor->id,
                'rows_updated' => $updated
            ]);
            
            // Verificar se realmente foi atualizado
            $doctorCheck = DB::table('users')
                ->where('id', $doctor->id)
                ->select('doctor_activation_token', 'doctor_activation_token_expires_at')
                ->first();
            
            \Log::info('Verificação pós-update', [
                'doctor_id' => $doctor->id,
                'token_after_update' => $doctorCheck->doctor_activation_token ? 'EXISTS' : 'NULL',
                'expires_at_after_update' => $doctorCheck->doctor_activation_token_expires_at ? 'EXISTS' : 'NULL'
            ]);
            
            // Recarregar o modelo para garantir que está atualizado
            $doctor->refresh();
            
            \Log::info('Médico ativado com sucesso', [
                'doctor_id' => $doctor->id,
                'email' => $doctor->email,
                'token_removed' => $doctor->doctor_activation_token === null
            ]);

            // Verificar se é uma requisição AJAX/JSON ou navegador
            if ($request->wantsJson() || $request->expectsJson()) {
                // Retornar JSON para requisições AJAX
                return response()->json([
                    'success' => true,
                    'message' => 'Conta ativada com sucesso! Você já pode fazer login.',
                    'doctor' => [
                        'id' => $doctor->id,
                        'name' => $doctor->name,
                        'email' => $doctor->email,
                    ]
                ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            } else {
                // Limpar output buffer novamente antes de retornar a view
                while (ob_get_level()) {
                    ob_end_clean();
                }
                
                // Retornar view HTML para navegador
                return response()->view('doctor-activation-success', [
                    'doctor' => $doctor
                ])->header('Content-Type', 'text/html; charset=utf-8');
            }
        } catch (\Exception $e) {
            \Log::error('Erro ao ativar médico: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Retornar mensagem de erro amigável
            $errorMessage = 'Erro ao ativar conta. Por favor, entre em contato com o suporte.';
            if (config('app.debug')) {
                $errorMessage .= ' Detalhes: ' . $e->getMessage();
            }
            
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error'
            ], 500);
        }
    }

    /**
     * Atualizar informações do médico
     * PUT /api/admin/doctors/{id}
     */
    public function update(Request $request, $id)
    {
        // Limpar qualquer output buffer anterior
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        try {
            $doctor = User::where('id', $id)
                ->where('profile', 'doctor')
                ->firstOrFail();

            // Validação dos dados
            $validator = \Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|nullable|email|max:255|unique:users,email,' . $id . ',id,profile,doctor',
                'cpf' => 'sometimes|nullable|string|max:14',
                'crm' => 'sometimes|nullable|string|max:20',
                'medical_specialty_id' => 'sometimes|nullable|integer|exists:medical_specialties,id',
            ]);

            if ($validator->fails()) {
                while (ob_get_level()) {
                    ob_end_clean();
                }
                return response()->json([
                    'error' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }

            // Atualizar apenas os campos fornecidos
            $updateData = [];
            
            if ($request->has('name')) {
                $updateData['name'] = $request->name;
            }
            
            if ($request->has('email')) {
                $updateData['email'] = $request->email;
            }
            
            if ($request->has('cpf')) {
                // Validar CPF se fornecido
                $cpf = preg_replace('/[^0-9]/', '', $request->cpf);
                if (!empty($cpf) && strlen($cpf) === 11) {
                    // Verificar se CPF já existe para outro médico
                    $existingDoctor = User::where('cpf', $cpf)
                        ->where('profile', 'doctor')
                        ->where('id', '!=', $id)
                        ->first();
                    
                    if ($existingDoctor) {
                        while (ob_get_level()) {
                            ob_end_clean();
                        }
                        return response()->json([
                            'error' => 'CPF já cadastrado para outro médico',
                            'message' => 'Este CPF já está sendo usado por outro médico.'
                        ], 422, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    }
                    $updateData['cpf'] = $cpf;
                } else if (!empty($request->cpf)) {
                    while (ob_get_level()) {
                        ob_end_clean();
                    }
                    return response()->json([
                        'error' => 'CPF inválido',
                        'message' => 'O CPF deve conter 11 dígitos.'
                    ], 422, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }
            }
            
            if ($request->has('crm')) {
                $updateData['crm'] = $request->crm;
            }
            
            if ($request->has('medical_specialty_id')) {
                $updateData['medical_specialty_id'] = $request->medical_specialty_id;
            }

            // Atualizar o médico
            if (!empty($updateData)) {
                $updateData['updated_at'] = now();
                $doctor->update($updateData);
                $doctor->refresh();
            }

            // Buscar especialidade atualizada
            $specialty = null;
            if ($doctor->medical_specialty_id) {
                $specialtyData = DB::table('medical_specialties')
                    ->where('id', $doctor->medical_specialty_id)
                    ->select('id', 'name')
                    ->first();
                if ($specialtyData) {
                    $specialty = [
                        'id' => $specialtyData->id,
                        'name' => $specialtyData->name,
                    ];
                }
            }

            $isActivated = $doctor->doctor_approved_at && 
                           ($doctor->doctor_activation_token === null || $doctor->doctor_activation_token === '');

            while (ob_get_level()) {
                ob_end_clean();
            }

            return response()->json([
                'message' => 'Médico atualizado com sucesso',
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                    'cpf' => $doctor->cpf ?? null,
                    'crm' => $doctor->crm ?? null,
                    'specialty' => $specialty,
                    'is_blocked' => (bool) $doctor->is_blocked,
                    'approved_at' => $doctor->doctor_approved_at,
                    'is_activated' => $isActivated,
                    'created_at' => $doctor->created_at,
                ]
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            while (ob_get_level()) {
                ob_end_clean();
            }
            return response()->json([
                'error' => 'Médico não encontrado',
                'message' => 'O médico com o ID informado não existe'
            ], 404, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\Exception $e) {
            while (ob_get_level()) {
                ob_end_clean();
            }
            return response()->json([
                'error' => 'Erro ao atualizar médico',
                'message' => $e->getMessage()
            ], 500, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }

    /**
     * Excluir médico
     * DELETE /api/admin/doctors/{id}
     */
    public function destroy($id)
    {
        try {
            $doctor = User::where('id', $id)
                ->where('profile', 'doctor')
                ->firstOrFail();

            // Verificar se é o próprio usuário logado (não permitir auto-exclusão)
            $currentUser = auth()->user();
            if ($currentUser && $currentUser->id == $id) {
                return response()->json([
                    'error' => 'Você não pode excluir sua própria conta',
                    'message' => 'Use a opção de deletar conta no seu perfil'
                ], 403);
            }

            // Revogar todos os tokens do médico antes de excluir
            $doctor->tokens()->delete();

            // Excluir relacionamentos (se necessário)
            DB::table('user_plans')->where('user_id', $id)->delete();

            // Salvar informações antes de excluir
            $doctorEmail = $doctor->email;
            $doctorName = $doctor->name;
            $doctorCrm = $doctor->crm;

            // Excluir o médico
            $doctor->delete();

            return response()->json([
                'message' => 'Médico excluído com sucesso',
                'deleted_doctor' => [
                    'id' => $id,
                    'name' => $doctorName,
                    'email' => $doctorEmail,
                    'crm' => $doctorCrm,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Médico não encontrado',
                'message' => 'O médico com o ID informado não existe'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao excluir médico',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

