<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;

class UserController extends Controller
{
    /**
     * Atualizar dados do usuário
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json(['message' => 'Usuário não encontrado'], 404);
        }

        $rules = [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'sometimes|nullable|string|max:20',
            'gender' => 'sometimes|nullable|in:masculino,feminino,outro,male,female,other',
            'blood_type' => 'sometimes|nullable|string|max:5',
            'birth_date' => 'sometimes|nullable|date',
            'password' => 'sometimes|nullable|string|min:6',
            'photo' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            // Campos de dados pessoais
            'last_name' => 'sometimes|nullable|string|max:255',
            'cpf' => 'sometimes|nullable|string|max:14',
            'address' => 'sometimes|nullable|string|max:255',
            'address_number' => 'sometimes|nullable|string|max:20',
            'address_complement' => 'sometimes|nullable|string|max:255',
            'city' => 'sometimes|nullable|string|max:100',
            'state' => 'sometimes|nullable|string|max:2',
            'zip_code' => 'sometimes|nullable|string|max:10',
            // Campos específicos de cuidador profissional
            'neighborhood' => 'sometimes|nullable|string|max:100',
            'formation_details' => 'sometimes|nullable|string',
            'hourly_rate' => 'sometimes|nullable|numeric|min:0',
            'availability' => 'sometimes|nullable|string',
            'is_available' => 'sometimes|nullable|boolean',
            'latitude' => 'sometimes|nullable|numeric',
            'longitude' => 'sometimes|nullable|numeric',
            // Campos específicos de médico
            'crm' => 'sometimes|nullable|string|max:20',
            'medical_specialty_id' => 'sometimes|nullable|exists:medical_specialties,id',
            'consultation_price' => 'sometimes|nullable|numeric|min:0',
        ];

        $request->validate($rules);

        // Construir array de dados condicionalmente baseado nas colunas existentes
        $data = [];
        
        // Campos sempre presentes
        $alwaysFields = ['name', 'email', 'phone', 'blood_type', 'birth_date'];
        foreach ($alwaysFields as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->input($field);
            }
        }
        
        // Processar gender separadamente para converter valores em inglês para português
        if ($request->has('gender')) {
            $gender = $request->input('gender');
            // Converter valores em inglês para português
            $genderMap = [
                'male' => 'masculino',
                'female' => 'feminino',
                'other' => 'outro',
            ];
            $data['gender'] = $genderMap[$gender] ?? $gender;
        }
        
        // Campos de dados pessoais (verificar se existem)
        $personalFields = [
            'last_name',
            'cpf',
            'address',
            'address_number',
            'address_complement',
            'city',
            'state',
            'zip_code',
        ];
        
        foreach ($personalFields as $field) {
            if ($request->has($field) && Schema::hasColumn('users', $field)) {
                $data[$field] = $request->input($field);
            }
        }
        
        // Campos específicos de cuidador profissional (verificar se existem)
        $caregiverFields = [
            'neighborhood',
            'formation_details',
            'hourly_rate',
            'availability',
            'is_available',
            'latitude',
            'longitude',
        ];
        
        foreach ($caregiverFields as $field) {
            if ($request->has($field) && Schema::hasColumn('users', $field)) {
                $data[$field] = $request->input($field);
            }
        }
        
        // Campos específicos de médico (verificar se existem)
        $doctorFields = [
            'crm',
            'medical_specialty_id',
            'consultation_price',
        ];
        
        foreach ($doctorFields as $field) {
            if ($request->has($field) && Schema::hasColumn('users', $field)) {
                $value = $request->input($field);
                // Para consultation_price, garantir que seja numérico ou null
                if ($field === 'consultation_price') {
                    $data[$field] = $value !== null && $value !== '' ? (float) $value : null;
                } else {
                    $data[$field] = $value;
                }
            }
        }

        // Processar cursos se fornecidos (para cuidador profissional e médico)
        // IMPORTANTE: Tentar múltiplas formas de acessar o array de cursos
        // porque o Laravel pode receber de diferentes formas dependendo do Content-Type
        $coursesData = null;
        
        // Tentar 1: Direto do request
        if ($request->has('courses')) {
            $coursesData = $request->input('courses');
        }
        // Tentar 2: Do JSON body direto
        elseif ($request->isJson() && $request->json()->has('courses')) {
            $coursesData = $request->json()->get('courses');
        }
        // Tentar 3: Do all() (último recurso)
        elseif (isset($request->all()['courses'])) {
            $coursesData = $request->all()['courses'];
        }
        
        Log::info('UserController::update - Verificando cursos', [
            'has_courses' => $request->has('courses'),
            'is_json' => $request->isJson(),
            'json_has_courses' => $request->isJson() ? $request->json()->has('courses') : false,
            'courses_type' => $coursesData ? gettype($coursesData) : 'null',
            'courses_is_array' => is_array($coursesData),
            'courses_count' => is_array($coursesData) ? count($coursesData) : 0,
            'courses_data' => $coursesData,
            'user_id' => $user->id,
            'user_profile' => $user->profile,
            'request_all_keys' => array_keys($request->all()),
        ]);
        
        // Processar cursos se encontrados
        if ($coursesData && is_array($coursesData) && count($coursesData) > 0) {
            Log::info('UserController::update - Processando cursos', [
                'courses_count' => count($coursesData),
                'courses' => $coursesData,
            ]);
            
            // Deletar cursos antigos
            $deletedCount = $user->caregiverCourses()->delete();
            Log::info('UserController::update - Cursos antigos deletados', ['count' => $deletedCount]);
            
            // Criar novos cursos
            $createdCount = 0;
            foreach ($coursesData as $index => $course) {
                // Garantir que course é um array
                if (is_object($course)) {
                    $course = (array) $course;
                }
                
                Log::info("UserController::update - Processando curso {$index}", [
                    'course' => $course,
                    'course_type' => gettype($course),
                    'has_name' => !empty($course['name'] ?? null),
                    'has_institution' => !empty($course['institution'] ?? null),
                ]);
                
                $courseName = $course['name'] ?? null;
                $courseInstitution = $course['institution'] ?? null;
                
                if (!empty($courseName) && !empty($courseInstitution)) {
                    try {
                        $created = $user->caregiverCourses()->create([
                            'name' => $courseName,
                            'institution' => $courseInstitution,
                            'year' => $course['year'] ?? null,
                            'description' => $course['description'] ?? null,
                            'certificate_url' => $course['certificate_url'] ?? null,
                        ]);
                        $createdCount++;
                        Log::info("UserController::update - Curso {$index} criado com sucesso", [
                            'id' => $created->id,
                            'name' => $created->name,
                            'institution' => $created->institution,
                        ]);
                    } catch (\Exception $e) {
                        Log::error("UserController::update - Erro ao criar curso {$index}", [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString(),
                            'course' => $course,
                        ]);
                    }
                } else {
                    Log::warning("UserController::update - Curso {$index} ignorado (campos obrigatórios vazios)", [
                        'course' => $course,
                        'name' => $courseName,
                        'institution' => $courseInstitution,
                    ]);
                }
            }
            
            Log::info('UserController::update - Cursos processados', [
                'created_count' => $createdCount,
                'total_received' => count($coursesData),
            ]);
        } else {
            Log::info('UserController::update - Nenhum curso fornecido ou formato inválido', [
                'has_courses' => $request->has('courses'),
                'is_json' => $request->isJson(),
                'courses_data' => $coursesData,
                'is_array' => is_array($coursesData),
                'is_null' => is_null($coursesData),
            ]);
        }

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($user->photo) {
                Storage::disk('public')->delete($user->photo);
            }
            
            // Store new photo
            $photo = $request->file('photo');
            $photoPath = $photo->store('users', 'public');
            $data['photo'] = $photoPath;
        }

        // Handle password
        if ($request->password) {
            $data['password'] = Hash::make($request->password);
        }

        // Converter is_available para boolean se for string
        if (isset($data['is_available']) && is_string($data['is_available'])) {
            $data['is_available'] = filter_var($data['is_available'], FILTER_VALIDATE_BOOLEAN);
        }

        $user->update($data);

        // Recarregar o usuário com relacionamentos para retornar dados completos
        $user->refresh();
        $user->load(['caregiverCourses', 'medicalSpecialty']);
        
        // Converter para array e garantir que os cursos sejam incluídos
        $userData = $user->toArray();
        
        // Adicionar cursos explicitamente (snake_case e camelCase para compatibilidade)
        $courses = $user->caregiverCourses->map(function($course) {
            return [
                'id' => $course->id,
                'name' => $course->name,
                'institution' => $course->institution,
                'year' => $course->year,
                'description' => $course->description,
                'certificate_url' => $course->certificate_url,
            ];
        })->toArray();
        
        $userData['caregiver_courses'] = $courses;
        $userData['caregiverCourses'] = $courses; // Para compatibilidade com frontend
        
        Log::info('UserController::update - Usuário atualizado com cursos', [
            'user_id' => $user->id,
            'courses_count' => count($courses),
            'courses' => $courses,
            'userData_keys' => array_keys($userData),
            'has_caregiver_courses' => isset($userData['caregiver_courses']),
            'has_caregiverCourses' => isset($userData['caregiverCourses']),
        ]);
        
        // Log adicional para debug
        Log::info('UserController::update - Resposta completa (primeiros 1000 chars)', [
            'response_preview' => substr(json_encode($userData), 0, 1000),
        ]);
        
        return response()->json($userData);
    }

    /**
     * Upload de arquivo .pfx com senha para assinatura digital
     * POST /api/users/{id}/certificate
     */
    public function uploadCertificate(Request $request, $id)
    {
        try {
            Log::info('📤 [UserController::uploadCertificate] Requisição recebida', [
                'user_id' => $id,
                'auth_id' => Auth::id(),
                'has_file' => $request->hasFile('certificate_file'),
                'has_password' => $request->has('certificate_password'),
                'all_data' => $request->except(['certificate_file', 'certificate_password']),
            ]);

            $user = User::find($id);
            
            if (!$user) {
                Log::warning('❌ [UserController::uploadCertificate] Usuário não encontrado', ['user_id' => $id]);
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não encontrado',
                ], 404);
            }

            // Verificar se o usuário autenticado pode atualizar este usuário
            if (Auth::id() != $id) {
                Log::warning('❌ [UserController::uploadCertificate] Não autorizado', [
                    'auth_id' => Auth::id(),
                    'requested_id' => $id,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Não autorizado',
                ], 403);
            }

            // Validação
            $validator = Validator::make($request->all(), [
                'certificate_file' => 'required|file|mimes:pfx,p12|max:5120', // 5MB max
                'certificate_password' => 'required|string|max:255',
                'certificate_type' => 'nullable|in:pfx,p12',
            ]);

            if ($validator->fails()) {
                Log::warning('❌ [UserController::uploadCertificate] Validação falhou', [
                    'errors' => $validator->errors()->toArray(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            Log::info('✅ [UserController::uploadCertificate] Validação passou');

            $file = $request->file('certificate_file');
            $extension = strtolower($file->getClientOriginalExtension());
            
            // Validar extensão
            if (!in_array($extension, ['pfx', 'p12'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Arquivo deve ser .pfx ou .p12',
                ], 422);
            }

            // Criar diretório para certificados se não existir
            $certDir = 'certificates/doctors/' . $user->id;
            Storage::disk('local')->makeDirectory($certDir);

            // Nome do arquivo
            $certificateFileName = 'certificate.' . $extension;
            
            // Deletar certificado antigo se existir
            $oldCertificatePath = $certDir . '/' . $certificateFileName;
            if (Storage::disk('local')->exists($oldCertificatePath)) {
                Storage::disk('local')->delete($oldCertificatePath);
            }
            
            // Salvar certificado
            $certificatePath = $file->storeAs($certDir, $certificateFileName, 'local');

            // Criptografar senha antes de salvar
            $encryptedPassword = Crypt::encryptString($request->certificate_password);

            // Atualizar usuário com o caminho do certificado e senha criptografada
            $user->update([
                'certificate_path' => $certificatePath,
                'certificate_type' => $request->certificate_type ?? 'pfx',
                'certificate_password_encrypted' => $encryptedPassword,
                'has_certificate' => true,
                'certificate_uploaded_at' => now(),
            ]);

            // Recarregar o usuário para garantir dados atualizados
            $user->refresh();

            Log::info('Certificado digital configurado com sucesso', [
                'user_id' => $user->id,
                'certificate_path' => $certificatePath,
                'certificate_type' => $request->certificate_type ?? 'pfx',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Certificado digital configurado com sucesso',
                'data' => [
                    'certificate_path' => $certificatePath,
                    'certificate_type' => $request->certificate_type ?? 'pfx',
                    'has_certificate' => true,
                    'certificate_uploaded_at' => $user->certificate_uploaded_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erro ao fazer upload do certificado: ' . $e->getMessage(), [
                'user_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao salvar certificado',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error',
            ], 500);
        }
    }
}

