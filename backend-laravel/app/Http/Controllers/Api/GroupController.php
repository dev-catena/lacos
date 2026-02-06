<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class GroupController extends Controller
{
    /**
     * Construir URL completa da foto do grupo
     * Usa construção direta em vez de asset() para garantir URL correta
     */
    private function buildPhotoUrl($photoPath) {
        if (!$photoPath) {
            return null;
        }
        $baseUrl = config('app.url', 'http://10.102.0.103:8000');
        // Garantir que não tenha barra dupla
        $baseUrl = rtrim($baseUrl, '/');
        $photoPath = ltrim($photoPath, '/');
        return $baseUrl . '/storage/' . $photoPath;
    }
    /**
     * Listar grupos do usuário autenticado
     * GET /api/groups
     * 
     * Retorna todos os grupos onde o usuário está associado:
     * - Grupos que ele criou (created_by = user.id)
     * - Grupos onde ele é membro (via tabela group_members)
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            Log::info("Buscando grupos para usuário ID: {$user->id} ({$user->email})");

            // Buscar grupos de múltiplas formas:
            // 1. Grupos onde o usuário é admin (admin_user_id)
            // 2. Grupos onde o usuário é membro (via tabela group_members)
            // 3. Grupos onde o usuário tem atividades (group_activities)
            // 4. Grupos onde o usuário tem documentos (documents)
            // 5. Grupos onde o usuário tem medicamentos (medications)
            
            // Buscar grupos onde o usuário é admin
            $adminGroups = DB::table('groups')
                ->where('admin_user_id', $user->id)
                ->pluck('id')
                ->toArray();
            
            Log::info("Grupos onde usuário {$user->id} é admin: " . count($adminGroups) . " - IDs: " . implode(', ', $adminGroups));

            // Buscar grupos via tabela pivot group_members (se existir)
            $memberGroups = [];
            try {
                if (Schema::hasTable('group_members')) {
                    $memberGroups = DB::table('group_members')
                        ->where('user_id', $user->id)
                        ->pluck('group_id')
                        ->toArray();
                    Log::info("Grupos via group_members para usuário {$user->id}: " . count($memberGroups) . " - IDs: " . implode(', ', $memberGroups));
                } else {
                    Log::info("Tabela group_members não existe");
                }
            } catch (\Exception $e) {
                Log::warning("Erro ao buscar group_members: " . $e->getMessage());
            }

            // Buscar grupos via atividades
            $activityGroups = [];
            try {
                if (Schema::hasTable('group_activities')) {
                    $activityGroups = DB::table('group_activities')
                        ->where('user_id', $user->id)
                        ->distinct()
                        ->pluck('group_id')
                        ->toArray();
                    Log::info("Grupos via atividades para usuário {$user->id}: " . count($activityGroups) . " - IDs: " . implode(', ', $activityGroups));
                }
            } catch (\Exception $e) {
                Log::warning("Erro ao buscar grupos via atividades: " . $e->getMessage());
            }

            // Buscar grupos via documentos
            $documentGroups = [];
            try {
                if (Schema::hasTable('documents')) {
                    $documentGroups = DB::table('documents')
                        ->where('user_id', $user->id)
                        ->distinct()
                        ->pluck('group_id')
                        ->toArray();
                    Log::info("Grupos via documentos para usuário {$user->id}: " . count($documentGroups) . " - IDs: " . implode(', ', $documentGroups));
                }
            } catch (\Exception $e) {
                Log::warning("Erro ao buscar grupos via documentos: " . $e->getMessage());
            }

            // Buscar grupos via medicamentos (se o usuário é médico)
            $medicationGroups = [];
            try {
                if (Schema::hasTable('medications')) {
                    $medicationGroups = DB::table('medications')
                        ->where('doctor_id', $user->id)
                        ->distinct()
                        ->pluck('group_id')
                        ->toArray();
                    Log::info("Grupos via medicamentos para usuário {$user->id}: " . count($medicationGroups) . " - IDs: " . implode(', ', $medicationGroups));
                }
            } catch (\Exception $e) {
                Log::warning("Erro ao buscar grupos via medicamentos: " . $e->getMessage());
            }

            // Combinar todos os IDs únicos
            $allGroupIds = array_unique(array_merge(
                $adminGroups,
                $memberGroups,
                $activityGroups,
                $documentGroups,
                $medicationGroups
            ));

            Log::info("Total de grupos únicos encontrados para usuário {$user->id}: " . count($allGroupIds) . " - IDs: " . implode(', ', $allGroupIds));
            
            // Se não encontrou nenhum grupo, logar para debug e retornar vazio
            if (empty($allGroupIds)) {
                Log::warning("Nenhum grupo encontrado para usuário {$user->id} ({$user->email})");
                try {
                    $allGroups = DB::table('groups')->pluck('id')->toArray();
                    Log::info("Total de grupos no sistema: " . count($allGroups));
                    if (count($allGroups) > 0) {
                        Log::warning("Existem " . count($allGroups) . " grupos no sistema, mas nenhum associado ao usuário {$user->id}");
                    }
                } catch (\Exception $e) {
                    Log::error("Erro ao contar grupos: " . $e->getMessage());
                }
                return response()->json([]);
            }

            // Buscar grupos completos com relacionamentos
            try {
                // IMPORTANTE: Selecionar explicitamente o campo photo para garantir que seja retornado
                $groups = DB::table('groups')
                    ->whereIn('id', $allGroupIds)
                    ->select('*') // Selecionar todos os campos explicitamente
                    ->get();
                
                // DEBUG: Verificar o que está vindo do banco ANTES do map
                Log::info("GroupController::index - Grupos ANTES do map:", [
                    'count' => $groups->count(),
                    'first_group_raw' => $groups->first() ? [
                        'id' => $groups->first()->id,
                        'name' => $groups->first()->name,
                        'photo' => $groups->first()->photo ?? 'NULL',
                        'photo_type' => isset($groups->first()->photo) ? gettype($groups->first()->photo) : 'NULL',
                        'all_fields' => array_keys((array)$groups->first()),
                    ] : 'NONE',
                ]);
                
                $groups = $groups->map(function ($group) use ($user) {
                    // Buscar informações do membro na tabela pivot (se existir)
                    $memberInfo = null;
                    $members = [];
                    
                    if (Schema::hasTable('group_members')) {
                        try {
                            $memberInfo = DB::table('group_members')
                                ->where('group_id', $group->id)
                                ->where('user_id', $user->id)
                                ->first();

                            // Buscar membros do grupo
                            $userColumns = ['users.id as user_id', 'users.name', 'users.email', 'group_members.role'];
                            if (Schema::hasColumn('users', 'profile')) {
                                $userColumns[] = 'users.profile';
                            }
                            
                            $members = DB::table('group_members')
                                ->where('group_id', $group->id)
                                ->join('users', 'group_members.user_id', '=', 'users.id')
                                ->select($userColumns)
                                ->get()
                                ->map(function($m) {
                                    // Mapear 'priority_contact' para 'patient' (compatibilidade com frontend)
                                    $role = $m->role === 'priority_contact' ? 'patient' : $m->role;
                                    return [
                                        'user_id' => $m->user_id,
                                        'name' => $m->name,
                                        'email' => $m->email,
                                        'profile' => $m->profile ?? null,
                                        'role' => $role, // Retornar 'patient' se for 'priority_contact'
                                        'is_admin' => ($m->role === 'admin')
                                    ];
                                })
                                ->toArray();
                        } catch (\Exception $e) {
                            Log::warning("Erro ao buscar membros do grupo: " . $e->getMessage());
                        }
                    }

                    // Determinar se é admin/criador
                    // Verificar se é criador: usar created_by se existir, senão usar admin_user_id (compatibilidade)
                    $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
                    $isCreator = $createdBy && $createdBy == $user->id;
                    
                    // is_admin deve ser true se for criador OU se tiver role='admin' na tabela group_members
                    $isAdmin = $isCreator || ($memberInfo && $memberInfo->role === 'admin');

                    // DEBUG: Log do que está vindo do banco
                    Log::info("GroupController::index - Grupo {$group->id} ({$group->name}):", [
                        'photo_from_db' => $group->photo,
                        'photo_is_null' => is_null($group->photo),
                        'photo_is_empty' => empty($group->photo),
                        'photo_type' => gettype($group->photo),
                    ]);
                    
                    // Construir resposta
                    $groupData = [
                        'id' => $group->id,
                        'name' => $group->name,
                        'description' => $group->description,
                        'accompanied_name' => $group->accompanied_name ?? null,
                        'accompanied_age' => $group->accompanied_age ?? null,
                        'accompanied_gender' => $group->accompanied_gender ?? null,
                        'accompanied_photo' => $group->accompanied_photo ?? null,
                        'health_info' => isset($group->health_info) && $group->health_info ? json_decode($group->health_info, true) : null,
                        'photo' => $group->photo ?? null,
                        'photo_url' => $this->buildPhotoUrl($group->photo ?? null),
                        'code' => $group->code ?? null,
                'access_code' => $group->code ?? null,
                        'admin_user_id' => $group->admin_user_id ?? null,
                        'created_by' => $createdBy, // Usar created_by se existir, senão admin_user_id
                        'created_at' => $group->created_at,
                        'updated_at' => $group->updated_at,
                        // Informações do usuário atual no grupo
                        'is_creator' => $isCreator,
                        'is_admin' => $isAdmin, // Criador OU role='admin' na tabela group_members
                        'role' => $isAdmin ? 'admin' : ($memberInfo ? $memberInfo->role : null),
                        // Membros do grupo
                        'group_members' => $members,
                        // Sinais vitais
                        'monitor_blood_pressure' => (bool)($group->monitor_blood_pressure ?? false),
                        'monitor_heart_rate' => (bool)($group->monitor_heart_rate ?? false),
                        'monitor_oxygen_saturation' => (bool)($group->monitor_oxygen_saturation ?? false),
                        'monitor_blood_glucose' => (bool)($group->monitor_blood_glucose ?? false),
                        'monitor_temperature' => (bool)($group->monitor_temperature ?? false),
                        'monitor_respiratory_rate' => (bool)($group->monitor_respiratory_rate ?? false),
                        // Permissões do acompanhado
                        'accompanied_notify_medication' => (bool)($group->accompanied_notify_medication ?? true),
                        'accompanied_notify_appointment' => (bool)($group->accompanied_notify_appointment ?? true),
                        'accompanied_access_history' => (bool)($group->accompanied_access_history ?? true),
                        'accompanied_access_medication' => (bool)($group->accompanied_access_medication ?? true),
                        'accompanied_access_schedule' => (bool)($group->accompanied_access_schedule ?? true),
                        'accompanied_access_chat' => (bool)($group->accompanied_access_chat ?? false),
                    ];

                        return $groupData;
                    })
                    ->values()
                    ->toArray();

                Log::info("Retornando " . count($groups) . " grupo(s) para usuário {$user->id}");
                
                // DEBUG: Log do que está sendo retornado
                foreach ($groups as $g) {
                    Log::info("GroupController::index - Retornando grupo {$g['id']} ({$g['name']}):", [
                        'photo' => $g['photo'] ?? 'NULL',
                        'photo_url' => $g['photo_url'] ?? 'NULL',
                        'has_photo' => isset($g['photo']) && !empty($g['photo']),
                        'has_photo_url' => isset($g['photo_url']) && !empty($g['photo_url']),
                    ]);
                }

                return response()->json($groups);
            } catch (\Exception $e) {
                Log::error("Erro ao buscar grupos completos: " . $e->getMessage());
                Log::error("Stack trace: " . $e->getTraceAsString());
                
                // Retornar pelo menos os grupos admin mesmo se houver erro
                try {
                    $fallbackGroups = DB::table('groups')
                        ->whereIn('id', $adminGroups)
                        ->get()
                        ->map(function ($group) use ($user) {
                            return [
                                'id' => $group->id,
                                'name' => $group->name,
                                'description' => $group->description,
                                'is_creator' => true,
                                'is_admin' => false,
                                'admin_user_id' => $group->admin_user_id ?? null,
                                'created_by' => $group->admin_user_id ?? null, // Compatibilidade
                            ];
                        })
                        ->values()
                        ->toArray();
                    
                    Log::info("Retornando grupos criados como fallback: " . count($fallbackGroups));
                    return response()->json($fallbackGroups);
                } catch (\Exception $fallbackError) {
                    Log::error("Erro no fallback: " . $fallbackError->getMessage());
                    return response()->json([
                        'message' => 'Erro ao buscar grupos',
                        'error' => $e->getMessage()
                    ], 500);
                }
            }
        } catch (\Exception $e) {
            Log::error("Erro ao buscar grupos: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            
            return response()->json([
                'message' => 'Erro ao buscar grupos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Criar novo grupo
     * POST /api/groups
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Verificar se colunas existem
            $hasCodeColumn = Schema::hasColumn('groups', 'code');
            $hasPhotoColumn = Schema::hasColumn('groups', 'photo');

            // Validação base
            $validationRules = [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
            ];

            // Adicionar validação de foto se coluna existir
            if ($hasPhotoColumn) {
                $validationRules['photo'] = 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048';
            }

            // Adicionar validação de código se coluna existir
            if ($hasCodeColumn) {
                $validationRules['code'] = 'nullable|string|max:20|unique:groups,code';
            }

            $validated = $request->validate($validationRules);

            // Preparar dados para inserção
            $data = [
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'admin_user_id' => $user->id,
                'type' => 'care', // Padrão
                'is_active' => true,
            ];
            
            // Definir created_by se a coluna existir
            if (Schema::hasColumn('groups', 'created_by')) {
                $data['created_by'] = $user->id;
            }

            // Gerar código de acesso se coluna existir
            $generatedCode = null;
            if ($hasCodeColumn) {
                if (!empty($validated['code'] ?? null)) {
                    $data['code'] = $validated['code'];
                    $generatedCode = $validated['code'];
                } else {
                    // Gerar código único de 8 caracteres
                    do {
                        $code = strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
                        $exists = DB::table('groups')->where('code', $code)->exists();
                    } while ($exists);
                    $data['code'] = $code;
                    $generatedCode = $code;
                }
            }

            // Upload de foto se fornecida e se coluna existir
            $photoPath = null;
            if ($request->hasFile('photo') && $hasPhotoColumn) {
                $photo = $request->file('photo');
                // Gerar nome único para evitar conflitos
                $extension = $photo->getClientOriginalExtension();
                $uniqueName = uniqid('group_new_', true) . '.' . $extension;
                $photoPath = 'groups/' . $uniqueName;
                Storage::disk('public')->put($photoPath, file_get_contents($photo->getRealPath()));
                $data['photo'] = $photoPath;
            }

            // Inserir grupo
            $groupId = DB::table('groups')->insertGetId($data);

            // Buscar grupo criado
            $group = DB::table('groups')->where('id', $groupId)->first();

            // Adicionar criador como membro admin (se tabela group_members existir)
            if (Schema::hasTable('group_members')) {
                try {
                    DB::table('group_members')->insert([
                        'group_id' => $groupId,
                        'user_id' => $user->id,
                        'role' => 'admin',
                        'joined_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } catch (\Exception $e) {
                    Log::warning("Erro ao adicionar criador como membro: " . $e->getMessage());
                }
            }

            // Preparar resposta
            $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
            $response = [
                'id' => $group->id,
                'name' => $group->name,
                'description' => $group->description,
                'admin_user_id' => $group->admin_user_id ?? null,
                'created_by' => $createdBy, // Usar created_by se existir, senão admin_user_id
                'type' => $group->type ?? null,
                'is_active' => $group->is_active ?? true,
                'created_at' => $group->created_at,
                'updated_at' => $group->updated_at,
                'is_creator' => true,
                'is_admin' => true,
                'role' => 'admin',
            ];

            // Adicionar código se existir
            if ($hasCodeColumn) {
                $response['code'] = $group->code ?? $generatedCode;
                $response['access_code'] = $group->code ?? $generatedCode;
            }

            // Adicionar foto se existir
            if ($photoPath) {
                $response['photo'] = $photoPath;
                $response['photo_url'] = $this->buildPhotoUrl($photoPath);
            } elseif ($hasPhotoColumn && isset($group->photo) && $group->photo) {
                $response['photo'] = $group->photo;
                $response['photo_url'] = $this->buildPhotoUrl($group->photo);
            }

            Log::info("Grupo criado com sucesso", [
                'group_id' => $groupId,
                'user_id' => $user->id,
                'name' => $group->name,
            ]);

            return response()->json($response, 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("Erro ao criar grupo: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Erro ao criar grupo',
                'error' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    /**
     * Obter detalhes de um grupo específico
     * GET /api/groups/{id}
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Log para debug
            Log::info("GroupController::show - Buscando grupo", [
                'requested_id' => $id,
                'user_id' => $user->id,
            ]);

            // Buscar o grupo
            $group = DB::table('groups')->where('id', $id)->first();
            
            if (!$group) {
                return response()->json([
                    'message' => 'Grupo não encontrado'
                ], 404);
            }
            
            // Log para verificar se o grupo foi encontrado e qual foto tem
            Log::info("GroupController::show - Grupo encontrado", [
                'group_id' => $group->id,
                'group_name' => $group->name,
                'photo' => $group->photo ?? null,
                'photo_url' => $group->photo ? $this->buildPhotoUrl($group->photo) : null,
            ]);

            // Verificar se o usuário tem acesso ao grupo
            $hasAccess = false;
            
            // 1. Verificar se é admin/criador (usar created_by se existir, senão admin_user_id)
            $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
            if ($createdBy && $createdBy == $user->id) {
                $hasAccess = true;
            }
            
            // 2. Verificar via group_members
            if (!$hasAccess && Schema::hasTable('group_members')) {
                $hasAccess = DB::table('group_members')
                    ->where('user_id', $user->id)
                    ->where('group_id', $id)
                    ->exists();
            }
            
            // 3. Verificar via atividades, documentos, medicamentos, etc.
            if (!$hasAccess) {
                $hasActivities = Schema::hasTable('group_activities') && 
                    DB::table('group_activities')
                        ->where('group_id', $id)
                        ->where('user_id', $user->id)
                        ->exists();
                
                $hasDocuments = Schema::hasTable('documents') && 
                    DB::table('documents')
                        ->where('group_id', $id)
                        ->where('user_id', $user->id)
                        ->exists();
                
                $hasMedications = false;
                if (Schema::hasTable('medications')) {
                    // A tabela medications não tem user_id, mas tem registered_by_user_id
                    if (Schema::hasColumn('medications', 'registered_by_user_id')) {
                        $hasMedications = DB::table('medications')
                            ->where('group_id', $id)
                            ->where('registered_by_user_id', $user->id)
                            ->exists();
                    } else {
                        // Fallback: verificar apenas se existe algum medication no grupo
                        $hasMedications = DB::table('medications')
                            ->where('group_id', $id)
                            ->exists();
                    }
                }
                
                $hasAppointments = false;
                if (Schema::hasTable('appointments')) {
                    // A tabela appointments não tem user_id, mas tem doctor_id e created_by_user_id
                    $hasAppointments = DB::table('appointments')
                        ->where('group_id', $id)
                        ->where(function($query) use ($user) {
                            $query->where('doctor_id', $user->id);
                            if (Schema::hasColumn('appointments', 'created_by_user_id')) {
                                $query->orWhere('created_by_user_id', $user->id);
                            }
                        })
                        ->exists();
                }
                
                $hasAccess = $hasActivities || $hasDocuments || $hasMedications || $hasAppointments;
            }
            
            if (!$hasAccess) {
                return response()->json([
                    'message' => 'Você não tem acesso a este grupo'
                ], 403);
            }

            // Buscar informações do membro
            $memberInfo = null;
            $members = [];
            
            if (Schema::hasTable('group_members')) {
                $memberInfo = DB::table('group_members')
                    ->where('group_id', $id)
                    ->where('user_id', $user->id)
                    ->first();

                // Construir select dinamicamente baseado nas colunas disponíveis
                $userColumns = ['users.id as user_id', 'users.name', 'users.email', 'group_members.role'];
                if (Schema::hasColumn('users', 'profile')) {
                    $userColumns[] = 'users.profile';
                }
                
                $members = DB::table('group_members')
                    ->where('group_id', $id)
                    ->join('users', 'group_members.user_id', '=', 'users.id')
                    ->select($userColumns)
                    ->get()
                    ->map(function($m) {
                        // Mapear 'priority_contact' para 'patient' (compatibilidade com frontend)
                        $role = $m->role === 'priority_contact' ? 'patient' : $m->role;
                        return [
                            'user_id' => $m->user_id,
                            'name' => $m->name,
                            'email' => $m->email,
                            'profile' => $m->profile ?? null,
                            'role' => $role, // Retornar 'patient' se for 'priority_contact'
                            'is_admin' => ($m->role === 'admin')
                        ];
                    })
                    ->toArray();
            }

            // Verificar se é criador: usar created_by se existir, senão usar admin_user_id (compatibilidade)
            $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
            $isCreator = $createdBy && (int)$createdBy == (int)$user->id;
            
            // is_admin deve ser true se for criador OU se tiver role='admin' na tabela group_members
            $hasAdminRole = $memberInfo && $memberInfo->role === 'admin';
            $isAdmin = $isCreator || $hasAdminRole;

            // Log para debug
            Log::info('GroupController::show - Verificação de admin', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'group_id' => $group->id,
                'group_name' => $group->name,
                'created_by' => $createdBy,
                'created_by_type' => gettype($createdBy),
                'user_id_type' => gettype($user->id),
                'isCreator' => $isCreator,
                'memberInfo' => $memberInfo ? [
                    'user_id' => $memberInfo->user_id,
                    'role' => $memberInfo->role
                ] : null,
                'hasAdminRole' => $hasAdminRole,
                'is_admin' => $isAdmin
            ]);

            $groupData = [
                'id' => $group->id,
                'name' => $group->name ?? null,
                'description' => $group->description ?? null,
                'accompanied_name' => $group->accompanied_name ?? null,
                'accompanied_age' => $group->accompanied_age ?? null,
                'accompanied_gender' => $group->accompanied_gender ?? null,
                'accompanied_photo' => $group->accompanied_photo ?? null,
                'health_info' => isset($group->health_info) && $group->health_info ? json_decode($group->health_info, true) : null,
                'photo' => $group->photo ?? null,
                'photo_url' => $this->buildPhotoUrl($group->photo ?? null),
                'code' => $group->code ?? null,
                'access_code' => $group->code ?? null,
                'admin_user_id' => $group->admin_user_id ?? null,
                'created_by' => $createdBy, // Usar created_by se existir, senão admin_user_id
                'created_at' => $group->created_at ?? null,
                'updated_at' => $group->updated_at ?? null,
                'is_creator' => $isCreator,
                'is_admin' => $isAdmin, // Criador OU role='admin' na tabela group_members
                'role' => $isAdmin ? 'admin' : ($memberInfo ? $memberInfo->role : null),
                'group_members' => $members,
                // Sinais vitais
                'monitor_blood_pressure' => (bool)($group->monitor_blood_pressure ?? false),
                'monitor_heart_rate' => (bool)($group->monitor_heart_rate ?? false),
                'monitor_oxygen_saturation' => (bool)($group->monitor_oxygen_saturation ?? false),
                'monitor_blood_glucose' => (bool)($group->monitor_blood_glucose ?? false),
                'monitor_temperature' => (bool)($group->monitor_temperature ?? false),
                'monitor_respiratory_rate' => (bool)($group->monitor_respiratory_rate ?? false),
                // Permissões do acompanhado
                'accompanied_notify_medication' => (bool)($group->accompanied_notify_medication ?? true),
                'accompanied_notify_appointment' => (bool)($group->accompanied_notify_appointment ?? true),
                'accompanied_access_history' => (bool)($group->accompanied_access_history ?? true),
                'accompanied_access_medication' => (bool)($group->accompanied_access_medication ?? true),
                'accompanied_access_schedule' => (bool)($group->accompanied_access_schedule ?? true),
                'accompanied_access_chat' => (bool)($group->accompanied_access_chat ?? false),
            ];

            return response()->json($groupData);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar grupo: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erro ao buscar grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Atualizar grupo
     * PUT /api/groups/{id}
     */
    public function update(Request $request, $id)
    {
        // Log CRÍTICO no início - usar error para garantir que aparece
        \Log::error("===========================================");
        \Log::error("GroupController::update - MÉTODO CHAMADO");
        \Log::error("Group ID: " . $id);
        \Log::error("Method: " . $request->method());
        \Log::error("Content-Type: " . $request->header('Content-Type'));
        \Log::error("===========================================");
        
        // Log no início para garantir que o método está sendo chamado
        Log::info("GroupController::update - MÉTODO CHAMADO", [
            'group_id' => $id,
            'method' => $request->method(),
            'content_type' => $request->header('Content-Type'),
            'hasFile_photo' => $request->hasFile('photo'),
            'allFiles' => array_keys($request->allFiles()),
            'allInput' => array_keys($request->all()),
            'input_photo' => $request->input('photo'),
            'file_photo' => $request->file('photo') ? 'EXISTS' : 'NULL',
        ]);
        
        try {
            $user = Auth::user();
            
            if (!$user) {
                Log::warning("GroupController::update - Usuário não autenticado", ['group_id' => $id]);
                return response()->json([
                    'message' => 'Usuário não autenticado'
                ], 401);
            }
            
            Log::info("GroupController::update - Usuário autenticado", [
                'group_id' => $id,
                'user_id' => $user->id,
            ]);

            // Buscar o grupo
            $group = DB::table('groups')->where('id', $id)->first();
            
            if (!$group) {
                return response()->json([
                    'message' => 'Grupo não encontrado'
                ], 404);
            }

            // Verificar se o usuário tem permissão (admin/criador)
            $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
            $isCreator = $createdBy && $createdBy == $user->id;
            
            $isAdmin = $isCreator;
            if (!$isAdmin && Schema::hasTable('group_members')) {
                $memberInfo = DB::table('group_members')
                    ->where('group_id', $id)
                    ->where('user_id', $user->id)
                    ->first();
                $isAdmin = $isAdmin || ($memberInfo && $memberInfo->role === 'admin');
            }

            if (!$isAdmin) {
                return response()->json([
                    'message' => 'Você não tem permissão para atualizar este grupo'
                ], 403);
            }

            // Verificar se colunas existem
            $hasPhotoColumn = Schema::hasColumn('groups', 'photo');

            // Validação
            $validationRules = [
                'name' => 'sometimes|string|max:255',
                'description' => 'sometimes|nullable|string',
                'accompanied_name' => 'sometimes|nullable|string|max:255',
                'accompanied_age' => 'sometimes|nullable|integer',
                'accompanied_gender' => 'sometimes|nullable|in:male,female,other',
                'accompanied_photo' => 'sometimes|nullable|string',
                'health_info' => 'sometimes|nullable|array',
                // Sinais vitais (aceitar boolean ou string '1'/'0' do FormData)
                'monitor_blood_pressure' => 'sometimes',
                'monitor_heart_rate' => 'sometimes',
                'monitor_oxygen_saturation' => 'sometimes',
                'monitor_blood_glucose' => 'sometimes',
                'monitor_temperature' => 'sometimes',
                'monitor_respiratory_rate' => 'sometimes',
                // Permissões do acompanhado (aceitar boolean ou string '1'/'0' do FormData)
                'accompanied_notify_medication' => 'sometimes',
                'accompanied_notify_appointment' => 'sometimes',
                'accompanied_access_history' => 'sometimes',
                'accompanied_access_medication' => 'sometimes',
                'accompanied_access_schedule' => 'sometimes',
                'accompanied_access_chat' => 'sometimes',
            ];

            if ($hasPhotoColumn) {
                $validationRules['photo'] = 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048';
            }

            $validated = $request->validate($validationRules);

            // Preparar dados para atualização
            $data = [];
            
            if (isset($validated['name'])) {
                $data['name'] = $validated['name'];
            }
            if (isset($validated['description'])) {
                $data['description'] = $validated['description'];
            }
            if (isset($validated['accompanied_name'])) {
                $data['accompanied_name'] = $validated['accompanied_name'];
            }
            if (isset($validated['accompanied_age'])) {
                $data['accompanied_age'] = $validated['accompanied_age'];
            }
            if (isset($validated['accompanied_gender'])) {
                $data['accompanied_gender'] = $validated['accompanied_gender'];
            }
            if (isset($validated['accompanied_photo'])) {
                $data['accompanied_photo'] = $validated['accompanied_photo'];
            }
            if (isset($validated['health_info'])) {
                $data['health_info'] = json_encode($validated['health_info']);
            }
            
            // Helper para converter valores booleanos (FormData envia como string '1' ou '0')
            $toBool = function($value) {
                if (is_bool($value)) return $value;
                if (is_string($value)) {
                    return in_array(strtolower($value), ['1', 'true', 'yes', 'on']);
                }
                return (bool)$value;
            };
            
            // Sinais vitais
            if (isset($validated['monitor_blood_pressure'])) {
                $data['monitor_blood_pressure'] = $toBool($validated['monitor_blood_pressure']);
            }
            if (isset($validated['monitor_heart_rate'])) {
                $data['monitor_heart_rate'] = $toBool($validated['monitor_heart_rate']);
            }
            if (isset($validated['monitor_oxygen_saturation'])) {
                $data['monitor_oxygen_saturation'] = $toBool($validated['monitor_oxygen_saturation']);
            }
            if (isset($validated['monitor_blood_glucose'])) {
                $data['monitor_blood_glucose'] = $toBool($validated['monitor_blood_glucose']);
            }
            if (isset($validated['monitor_temperature'])) {
                $data['monitor_temperature'] = $toBool($validated['monitor_temperature']);
            }
            if (isset($validated['monitor_respiratory_rate'])) {
                $data['monitor_respiratory_rate'] = $toBool($validated['monitor_respiratory_rate']);
            }
            
            // Permissões do acompanhado
            if (isset($validated['accompanied_notify_medication'])) {
                $data['accompanied_notify_medication'] = $toBool($validated['accompanied_notify_medication']);
            }
            if (isset($validated['accompanied_notify_appointment'])) {
                $data['accompanied_notify_appointment'] = $toBool($validated['accompanied_notify_appointment']);
            }
            if (isset($validated['accompanied_access_history'])) {
                $data['accompanied_access_history'] = $toBool($validated['accompanied_access_history']);
            }
            if (isset($validated['accompanied_access_medication'])) {
                $data['accompanied_access_medication'] = $toBool($validated['accompanied_access_medication']);
            }
            if (isset($validated['accompanied_access_schedule'])) {
                $data['accompanied_access_schedule'] = $toBool($validated['accompanied_access_schedule']);
            }
            if (isset($validated['accompanied_access_chat'])) {
                $data['accompanied_access_chat'] = $toBool($validated['accompanied_access_chat']);
            }

            // Upload de foto se fornecida
            Log::info("GroupController::update - Verificando upload de foto", [
                'hasFile_photo' => $request->hasFile('photo'),
                'hasPhotoColumn' => $hasPhotoColumn,
                'content_type' => $request->header('Content-Type'),
                'allFiles' => array_keys($request->allFiles()),
                'allInput' => array_keys($request->all()),
                'file_photo_exists' => $request->file('photo') ? 'YES' : 'NO',
            ]);
            
            // Tentar receber o arquivo
            $photoFile = $request->file('photo');
            
            if ($photoFile && $hasPhotoColumn) {
                // Deletar foto antiga se existir
                if ($group->photo && Storage::disk('public')->exists($group->photo)) {
                    Storage::disk('public')->delete($group->photo);
                    Log::info("Foto antiga deletada do grupo {$id}: {$group->photo}");
                }
                
                // Store new photo
                $photo = $photoFile;
                Log::info("GroupController::update - Arquivo recebido", [
                    'originalName' => $photo->getClientOriginalName(),
                    'mimeType' => $photo->getMimeType(),
                    'size' => $photo->getSize(),
                    'isValid' => $photo->isValid(),
                    'groupId' => $id,
                    'realPath' => $photo->getRealPath(),
                ]);
                
                // Gerar nome único para evitar conflitos entre grupos
                $extension = $photo->getClientOriginalExtension() ?: 'jpg';
                $uniqueName = uniqid('group_' . $id . '_', true) . '.' . $extension;
                $photoPath = 'groups/' . $uniqueName;
                
                // Salvar arquivo com nome único
                $saved = Storage::disk('public')->put($photoPath, file_get_contents($photo->getRealPath()));
                if ($saved) {
                    $data['photo'] = $photoPath;
                    Log::info("GroupController::update - Arquivo salvo com sucesso: {$photoPath}");
                    
                    // Registrar atividade de atualização de foto
                    if (class_exists('App\Models\GroupActivity')) {
                        try {
                            \App\Models\GroupActivity::logGroupPhotoUpdated($id, $user->id, $user->name);
                        } catch (\Exception $e) {
                            Log::warning("Erro ao registrar atividade de atualização de foto: " . $e->getMessage());
                        }
                    }
                } else {
                    Log::error("GroupController::update - Falha ao salvar arquivo: {$photoPath}");
                }
                
                Log::info("Nova foto salva para o grupo {$id}: {$photoPath}", [
                    'photoPath' => $photoPath,
                    'uniqueName' => $uniqueName,
                    'fileExists' => Storage::disk('public')->exists($photoPath),
                    'fileSize' => Storage::disk('public')->size($photoPath),
                ]);
            } else {
                Log::warning("GroupController::update - Foto não foi enviada ou coluna não existe", [
                    'hasFile' => $request->hasFile('photo'),
                    'hasPhotoColumn' => $hasPhotoColumn,
                ]);
            }

            // Guardar dados antigos para comparar mudanças
            $oldGroup = (array) $group;
            
            // Atualizar grupo
            if (!empty($data)) {
                $data['updated_at'] = now();
                DB::table('groups')->where('id', $id)->update($data);
                Log::info("Grupo {$id} atualizado com sucesso", $data);
                
                // Enviar notificações para os membros sobre alterações no grupo
                try {
                    $notificationService = new NotificationService();
                    
                    // Verificar quais campos foram alterados (apenas campos importantes)
                    $importantFields = ['name', 'description', 'accompanied_name'];
                    $hasImportantChanges = false;
                    foreach ($importantFields as $field) {
                        if (isset($data[$field]) && isset($oldGroup[$field]) && $data[$field] != $oldGroup[$field]) {
                            $hasImportantChanges = true;
                            break;
                        }
                    }
                    
                    if ($hasImportantChanges) {
                        // Buscar todos os membros do grupo (exceto quem fez a alteração)
                        $groupMembers = [];
                        if (Schema::hasTable('group_members')) {
                            $groupMembers = DB::table('group_members')
                                ->where('group_id', $id)
                                ->where('user_id', '!=', $user->id)
                                ->where('is_active', true)
                                ->pluck('user_id')
                                ->toArray();
                        }

                        foreach ($groupMembers as $memberId) {
                            $member = \App\Models\User::find($memberId);
                            if (!$member) continue;

                            // Verificar se o membro tem preferência de notificação habilitada
                            if (!$notificationService->hasNotificationPreference($member, 'group_changes')) {
                                continue;
                            }

                            $title = 'Alterações no Grupo';
                            $message = "O grupo {$group->name} foi atualizado";
                            
                            $notificationService->sendNotification(
                                $member,
                                'group',
                                $title,
                                $message,
                                [
                                    'group_id' => $id,
                                    'group_name' => $group->name,
                                    'updated_by' => $user->id,
                                    'updated_by_name' => $user->name,
                                    'action_type' => 'group_updated',
                                    'changes' => array_keys($data),
                                ],
                                false,
                                $id
                            );
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning("Erro ao enviar notificações de alteração no grupo: " . $e->getMessage());
                }
            }

            // Buscar grupo atualizado
            $updatedGroup = DB::table('groups')->where('id', $id)->first();

            // Construir resposta
            $response = [
                'id' => $updatedGroup->id,
                'name' => $updatedGroup->name,
                'description' => $updatedGroup->description,
                'accompanied_name' => $updatedGroup->accompanied_name ?? null,
                'accompanied_age' => $updatedGroup->accompanied_age ?? null,
                'accompanied_gender' => $updatedGroup->accompanied_gender ?? null,
                'accompanied_photo' => $updatedGroup->accompanied_photo ?? null,
                'health_info' => isset($updatedGroup->health_info) && $updatedGroup->health_info ? json_decode($updatedGroup->health_info, true) : null,
                'photo' => $updatedGroup->photo ?? null,
                'photo_url' => $this->buildPhotoUrl($updatedGroup->photo ?? null),
                'code' => $updatedGroup->code ?? null,
                'access_code' => $updatedGroup->code ?? null,
                'admin_user_id' => $updatedGroup->admin_user_id ?? null,
                'created_by' => $createdBy,
                'created_at' => $updatedGroup->created_at,
                'updated_at' => $updatedGroup->updated_at,
                'is_creator' => $isCreator,
                'is_admin' => $isAdmin,
            ];

            return response()->json($response);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("Erro ao atualizar grupo {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Erro ao atualizar grupo',
                'error' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    /**
     * Deletar grupo
     * DELETE /api/groups/{id}
     */
    public function destroy($id)
    {
        // Implementação do destroy se necessário
        return response()->json([
            'message' => 'Método não implementado'
        ], 501);
    }

    public function members($id) {
        try {
            $user = Auth::user();
            if (!$user) return response()->json(["success" => false, "message" => "Usuário não autenticado"], 401);
            
            $group = DB::table("groups")->where("id", $id)->first();
            if (!$group) return response()->json(["success" => false, "message" => "Grupo não encontrado"], 404);
            
            // Verificar se o usuário tem acesso ao grupo (mesma lógica do método show)
            $hasAccess = false;
            
            // 1. Verificar se é admin/criador (usar created_by se existir, senão admin_user_id)
            $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
            if ($createdBy && $createdBy == $user->id) {
                $hasAccess = true;
            }
            
            // 2. Verificar via group_members
            if (!$hasAccess && Schema::hasTable("group_members")) {
                $hasAccess = DB::table("group_members")
                    ->where("user_id", $user->id)
                    ->where("group_id", $id)
                    ->exists();
            }
            
            // 3. Verificar via atividades, documentos, medicamentos, consultas, etc.
            if (!$hasAccess) {
                $hasActivities = Schema::hasTable('group_activities') && 
                    DB::table('group_activities')
                        ->where('group_id', $id)
                        ->where('user_id', $user->id)
                        ->exists();
                
                $hasDocuments = Schema::hasTable('documents') && 
                    DB::table('documents')
                        ->where('group_id', $id)
                        ->where('user_id', $user->id)
                        ->exists();
                
                $hasMedications = false;
                if (Schema::hasTable('medications')) {
                    // A tabela medications não tem user_id, mas tem registered_by_user_id
                    if (Schema::hasColumn('medications', 'registered_by_user_id')) {
                        $hasMedications = DB::table('medications')
                            ->where('group_id', $id)
                            ->where('registered_by_user_id', $user->id)
                            ->exists();
                    } else {
                        // Fallback: verificar apenas se existe algum medication no grupo
                        $hasMedications = DB::table('medications')
                            ->where('group_id', $id)
                            ->exists();
                    }
                }
                
                $hasAppointments = false;
                if (Schema::hasTable('appointments')) {
                    // A tabela appointments não tem user_id, mas tem doctor_id e created_by_user_id
                    $hasAppointments = DB::table('appointments')
                        ->where('group_id', $id)
                        ->where(function($query) use ($user) {
                            $query->where('doctor_id', $user->id);
                            if (Schema::hasColumn('appointments', 'created_by_user_id')) {
                                $query->orWhere('created_by_user_id', $user->id);
                            }
                        })
                        ->exists();
                }
                
                $hasAccess = $hasActivities || $hasDocuments || $hasMedications || $hasAppointments;
            }
            
            if (!$hasAccess) {
                Log::warning("GroupController::members - Acesso negado", [
                    'user_id' => $user->id,
                    'group_id' => $id,
                    'created_by' => $createdBy,
                ]);
                return response()->json(["success" => false, "message" => "Você não tem acesso"], 403);
            }
            $members = [];
            if (Schema::hasTable("group_members")) {
                $memberColumns = ["users.id", "users.name", "users.email", "users.phone", "group_members.role", "group_members.joined_at"];
                if (Schema::hasColumn('users', 'photo')) {
                    $memberColumns[] = "users.photo";
                }
                if (Schema::hasColumn('users', 'photo_url')) {
                    $memberColumns[] = "users.photo_url";
                }
                if (Schema::hasColumn('users', 'profile')) {
                    $memberColumns[] = "users.profile";
                }
                
                $hasPhotoColumn = Schema::hasColumn('users', 'photo');
                $hasPhotoUrlColumn = Schema::hasColumn('users', 'photo_url');
                
                $query = DB::table("group_members")
                    ->join("users", "group_members.user_id", "=", "users.id")
                    ->where("group_members.group_id", $id);
                
                // Adicionar filtro is_active apenas se a coluna existir
                if (Schema::hasColumn('users', 'is_active')) {
                    $query->where("users.is_active", 1);
                }
                
                $members = $query->select($memberColumns)
                    ->get()
                    ->map(function ($m) use ($hasPhotoColumn, $hasPhotoUrlColumn) {
                        $photo = $hasPhotoColumn ? ($m->photo ?? null) : null;
                        $photoUrl = $hasPhotoUrlColumn ? ($m->photo_url ?? null) : null;
                        
                        // Mapear 'priority_contact' para 'patient' (compatibilidade com frontend)
                        $role = $m->role === 'priority_contact' ? 'patient' : $m->role;
                        
                        return [
                            "id" => $m->id, 
                            "user_id" => $m->id, 
                            "name" => $m->name, 
                            "email" => $m->email, 
                            "phone" => $m->phone ?? null, 
                            "photo" => $photo, 
                            "photo_url" => $photoUrl ?: $this->buildPhotoUrl($photo), 
                            "role" => $role, // Retornar 'patient' se for 'priority_contact'
                            "is_admin" => ($m->role === "admin"), 
                            "profile" => $m->profile ?? null, 
                            "joined_at" => $m->joined_at,
                            "user" => [
                                "id" => $m->id,
                                "name" => $m->name,
                                "email" => $m->email,
                                "phone" => $m->phone ?? null,
                                "photo" => $photo,
                                "photo_url" => $photoUrl ?: $this->buildPhotoUrl($photo),
                                "profile" => $m->profile ?? null,
                            ]
                        ];
                    })
                    ->values()
                    ->toArray();
            }
            
            // Usar created_by se existir, senão admin_user_id (compatibilidade)
            $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
            if ($createdBy) {
                $found = false;
                foreach ($members as $m) {
                    if (($m["id"] ?? null) == $createdBy || ($m["user_id"] ?? null) == $createdBy) {
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    $creatorColumns = ["id", "name", "email", "phone"];
                    if (Schema::hasColumn('users', 'photo')) {
                        $creatorColumns[] = "photo";
                    }
                    if (Schema::hasColumn('users', 'photo_url')) {
                        $creatorColumns[] = "photo_url";
                    }
                    if (Schema::hasColumn('users', 'profile')) {
                        $creatorColumns[] = "profile";
                    }
                    
                    $creator = DB::table("users")->where("id", $createdBy)->select($creatorColumns)->first();
                    if ($creator) {
                        $hasPhotoColumn = Schema::hasColumn('users', 'photo');
                        $hasPhotoUrlColumn = Schema::hasColumn('users', 'photo_url');
                        $photo = $hasPhotoColumn ? ($creator->photo ?? null) : null;
                        $photoUrl = $hasPhotoUrlColumn ? ($creator->photo_url ?? null) : null;
                        
                        $members[] = [
                            "id" => $creator->id, 
                            "user_id" => $creator->id, 
                            "name" => $creator->name, 
                            "email" => $creator->email, 
                            "phone" => $creator->phone ?? null, 
                            "photo" => $photo, 
                            "photo_url" => $photoUrl ?: $this->buildPhotoUrl($photo), 
                            "role" => "admin", 
                            "is_admin" => true, 
                            "profile" => $creator->profile ?? null, 
                            "joined_at" => $group->created_at,
                            "user" => [
                                "id" => $creator->id,
                                "name" => $creator->name,
                                "email" => $creator->email,
                                "phone" => $creator->phone ?? null,
                                "photo" => $photo,
                                "photo_url" => $photoUrl ?: $this->buildPhotoUrl($photo),
                                "profile" => $creator->profile ?? null,
                            ]
                        ];
                    }
                }
            }
            return response()->json(["success" => true, "data" => $members]);
        } catch (\Exception $e) {
            Log::error("Erro ao buscar membros: " . $e->getMessage());
            return response()->json(["success" => false, "message" => "Erro ao buscar membros", "error" => $e->getMessage()], 500);
        }
    }

    /**
     * Upload de foto do grupo - ENDPOINT SIMPLES E DIRETO
     * POST /api/groups/{id}/photo
     */
    public function uploadPhoto(Request $request, $id)
    {
        \Log::error("===========================================");
        \Log::error("GroupController::uploadPhoto - MÉTODO CHAMADO");
        \Log::error("Group ID: " . $id);
        \Log::error("Method: " . $request->method());
        \Log::error("Content-Type: " . $request->header('Content-Type'));
        \Log::error("hasFile('photo'): " . ($request->hasFile('photo') ? 'YES' : 'NO'));
        \Log::error("===========================================");

        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['message' => 'Usuário não autenticado'], 401);
            }

            // Buscar o grupo
            $group = DB::table('groups')->where('id', $id)->first();
            
            if (!$group) {
                return response()->json(['message' => 'Grupo não encontrado'], 404);
            }

            // Verificar permissão
            $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
            $isCreator = $createdBy && $createdBy == $user->id;
            
            $isAdmin = $isCreator;
            if (!$isAdmin && Schema::hasTable('group_members')) {
                $memberInfo = DB::table('group_members')
                    ->where('group_id', $id)
                    ->where('user_id', $user->id)
                    ->first();
                $isAdmin = $isAdmin || ($memberInfo && $memberInfo->role === 'admin');
            }

            if (!$isAdmin) {
                return response()->json(['message' => 'Sem permissão'], 403);
            }

            // Verificar se tem arquivo
            if (!$request->hasFile('photo')) {
                \Log::error("GroupController::uploadPhoto - NÃO TEM ARQUIVO!");
                \Log::error("allFiles: " . json_encode(array_keys($request->allFiles())));
                \Log::error("allInput: " . json_encode(array_keys($request->all())));
                return response()->json(['message' => 'Nenhum arquivo enviado'], 400);
            }

            $photo = $request->file('photo');
            
            \Log::error("GroupController::uploadPhoto - ARQUIVO RECEBIDO!");
            \Log::error("Nome: " . $photo->getClientOriginalName());
            \Log::error("Tamanho: " . $photo->getSize());
            \Log::error("Tipo: " . $photo->getMimeType());

            // Deletar foto antiga
            if ($group->photo && Storage::disk('public')->exists($group->photo)) {
                Storage::disk('public')->delete($group->photo);
            }

            // Salvar nova foto
            $extension = $photo->getClientOriginalExtension() ?: 'jpg';
            $uniqueName = uniqid('group_' . $id . '_', true) . '.' . $extension;
            $photoPath = 'groups/' . $uniqueName;
            
            $saved = Storage::disk('public')->put($photoPath, file_get_contents($photo->getRealPath()));
            
            if (!$saved) {
                \Log::error("GroupController::uploadPhoto - FALHA AO SALVAR!");
                return response()->json(['message' => 'Erro ao salvar arquivo'], 500);
            }

            // Atualizar banco
            DB::table('groups')->where('id', $id)->update([
                'photo' => $photoPath,
                'updated_at' => now(),
            ]);

            \Log::error("GroupController::uploadPhoto - FOTO SALVA: " . $photoPath);

            // Retornar resposta
            $response = [
                'id' => $group->id,
                'name' => $group->name,
                'photo' => $photoPath,
                'photo_url' => $this->buildPhotoUrl($photoPath),
            ];

            return response()->json($response);

        } catch (\Exception $e) {
            \Log::error("GroupController::uploadPhoto - ERRO: " . $e->getMessage());
            \Log::error("Stack: " . $e->getTraceAsString());
            return response()->json(['message' => 'Erro ao fazer upload', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Entrar em grupo usando código de convite
     * POST /api/groups/join
     */
    public function join(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Validar código
            $validated = $request->validate([
                'code' => 'required|string|max:20'
            ]);

            $code = strtoupper(trim($validated['code']));

            // Buscar grupo pelo código (case-insensitive)
            $group = DB::table('groups')
                ->whereRaw('UPPER(code) = ?', [strtoupper($code)])
                ->first();

            if (!$group) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código não encontrado ou expirado'
                ], 404);
            }

            // Verificar se grupo está ativo
            if (isset($group->is_active) && !$group->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Este grupo está inativo'
                ], 403);
            }

            // Verificar se usuário já é membro do grupo
            $isAlreadyMember = false;
            if (Schema::hasTable('group_members')) {
                $existingMember = DB::table('group_members')
                    ->where('group_id', $group->id)
                    ->where('user_id', $user->id)
                    ->first();
                
                if ($existingMember) {
                    $isAlreadyMember = true;
                }
            }

            // Verificar se é o criador do grupo
            $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
            $isCreator = $createdBy && (int)$createdBy == (int)$user->id;

            if ($isCreator) {
                // Se for o criador, retornar sucesso (já é membro)
                return response()->json([
                    'success' => true,
                    'message' => 'Você já é o administrador deste grupo',
                    'data' => [
                        'group' => [
                            'id' => $group->id,
                            'name' => $group->name,
                            'code' => $group->code,
                        ],
                        'your_role' => 'admin'
                    ]
                ]);
            }

            if ($isAlreadyMember) {
                // Se já é membro, retornar sucesso
                $memberInfo = DB::table('group_members')
                    ->where('group_id', $group->id)
                    ->where('user_id', $user->id)
                    ->first();

                return response()->json([
                    'success' => true,
                    'message' => 'Você já é membro deste grupo',
                    'data' => [
                        'group' => [
                            'id' => $group->id,
                            'name' => $group->name,
                            'code' => $group->code,
                        ],
                        'your_role' => $memberInfo->role ?? 'caregiver'
                    ]
                ]);
            }

            // Determinar role do usuário
            // Valores válidos do ENUM: 'admin', 'caregiver', 'health_professional', 'priority_contact'
            $userProfile = Schema::hasColumn('users', 'profile') ? ($user->profile ?? 'caregiver') : 'caregiver';
            $role = 'caregiver'; // Padrão

            // Se o usuário tem perfil de paciente (accompanied), pode entrar como priority_contact
            if ($userProfile === 'accompanied') {
                // Verificar se já existe um priority_contact no grupo
                $hasPriorityContact = false;
                if (Schema::hasTable('group_members')) {
                    $hasPriorityContact = DB::table('group_members')
                        ->where('group_id', $group->id)
                        ->where('role', 'priority_contact')
                        ->exists();
                }

                if (!$hasPriorityContact) {
                    $role = 'priority_contact'; // Usar priority_contact para pacientes
                } else {
                    // Se já tem priority_contact, entrar como cuidador
                    $role = 'caregiver';
                }
            } elseif ($userProfile === 'doctor' || $userProfile === 'professional_caregiver') {
                // Médicos e cuidadores profissionais entram como health_professional
                $role = 'health_professional';
            }

            // Adicionar usuário ao grupo
            if (Schema::hasTable('group_members')) {
                DB::table('group_members')->insert([
                    'group_id' => $group->id,
                    'user_id' => $user->id,
                    'role' => $role,
                    'joined_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Registrar atividade
            if (class_exists('App\Models\GroupActivity')) {
                try {
                    // Se for cuidador profissional, registrar como contratação
                    if ($userProfile === 'professional_caregiver' && ($role === 'health_professional' || $role === 'caregiver')) {
                        \App\Models\GroupActivity::logCaregiverHired(
                            $group->id,
                            $user->id,
                            $user->name,
                            $user->name,
                            $user->id
                        );
                    }
                    
                    // Sempre registrar como membro entrando também
                    // Mapear 'priority_contact' para 'patient' na notificação (mas manter no banco como priority_contact)
                    $notificationRole = $role === 'priority_contact' ? 'patient' : $role;
                    \App\Models\GroupActivity::logMemberJoined($group->id, $user->id, $user->name, $notificationRole);
                } catch (\Exception $e) {
                    Log::warning("Erro ao registrar atividade de entrada no grupo: " . $e->getMessage());
                }
            }

            // Enviar notificações para os membros do grupo sobre o novo membro
            try {
                $notificationService = new NotificationService();
                
                // Buscar todos os membros do grupo (exceto o novo membro)
                $groupMembers = [];
                if (Schema::hasTable('group_members')) {
                    $groupMembers = DB::table('group_members')
                        ->where('group_id', $group->id)
                        ->where('user_id', '!=', $user->id)
                        ->where('is_active', true)
                        ->pluck('user_id')
                        ->toArray();
                }

                // Buscar informações do grupo
                $groupModel = \App\Models\Group::find($group->id);
                if (!$groupModel) {
                    $groupModel = DB::table('groups')->where('id', $group->id)->first();
                }

                foreach ($groupMembers as $memberId) {
                    $member = \App\Models\User::find($memberId);
                    if (!$member) continue;

                    // Verificar se o membro tem preferência de notificação habilitada
                    if (!$notificationService->hasNotificationPreference($member, 'group_member_added')) {
                        continue;
                    }

                    $title = 'Novo Membro no Grupo';
                    $message = "{$user->name} entrou no grupo {$group->name}";
                    
                    $notificationService->sendNotification(
                        $member,
                        'group',
                        $title,
                        $message,
                        [
                            'group_id' => $group->id,
                            'group_name' => $group->name,
                            'new_member_id' => $user->id,
                            'new_member_name' => $user->name,
                            'action_type' => 'member_joined',
                        ],
                        false,
                        $group->id
                    );
                }
            } catch (\Exception $e) {
                Log::warning("Erro ao enviar notificações de novo membro: " . $e->getMessage());
            }

            Log::info("Usuário entrou no grupo", [
                'user_id' => $user->id,
                'group_id' => $group->id,
                'code' => $code,
                'role' => $role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Você entrou no grupo com sucesso',
                'data' => [
                    'group' => [
                        'id' => $group->id,
                        'name' => $group->name,
                        'code' => $group->code,
                    ],
                    'your_role' => $role
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("Erro ao entrar no grupo: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erro ao entrar no grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Atualizar role de um membro do grupo
     * PUT /api/groups/{groupId}/members/{memberId}/role
     */
    public function updateMemberRole(Request $request, $groupId, $memberId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Validar role
            $validated = $request->validate([
                'role' => 'required|string|in:admin,caregiver,health_professional,priority_contact,patient'
            ]);

            $requestedRole = $validated['role'];

            // Mapear 'patient' para 'priority_contact' (ENUM não aceita 'patient')
            $dbRole = $requestedRole === 'patient' ? 'priority_contact' : $requestedRole;

            // Verificar se grupo existe
            $group = DB::table('groups')->where('id', $groupId)->first();
            if (!$group) {
                return response()->json([
                    'success' => false,
                    'message' => 'Grupo não encontrado'
                ], 404);
            }

            // Verificar se usuário tem permissão (deve ser admin do grupo)
            $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
            $isCreator = $createdBy && (int)$createdBy == (int)$user->id;
            
            $isAdmin = $isCreator;
            if (!$isAdmin && Schema::hasTable('group_members')) {
                $adminMember = DB::table('group_members')
                    ->where('group_id', $groupId)
                    ->where('user_id', $user->id)
                    ->where('role', 'admin')
                    ->first();
                $isAdmin = $isAdmin || ($adminMember !== null);
            }

            if (!$isAdmin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem permissão para alterar roles neste grupo'
                ], 403);
            }

            // Verificar se membro existe
            if (!Schema::hasTable('group_members')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tabela de membros não existe'
                ], 500);
            }

            $member = DB::table('group_members')
                ->where('group_id', $groupId)
                ->where('user_id', $memberId)
                ->first();

            if (!$member) {
                return response()->json([
                    'success' => false,
                    'message' => 'Membro não encontrado no grupo'
                ], 404);
            }

            // Não permitir alterar role do criador do grupo
            if ((int)$memberId == (int)$createdBy) {
                return response()->json([
                    'success' => false,
                    'message' => 'Não é possível alterar o role do administrador do grupo'
                ], 403);
            }

            // Se está tentando tornar alguém admin, verificar se já existe outro admin
            if ($dbRole === 'admin') {
                $existingAdmin = DB::table('group_members')
                    ->where('group_id', $groupId)
                    ->where('user_id', '!=', $memberId)
                    ->where('role', 'admin')
                    ->exists();
                
                // Permitir múltiplos admins, então não precisa bloquear
            }

            // Atualizar role
            DB::table('group_members')
                ->where('group_id', $groupId)
                ->where('user_id', $memberId)
                ->update([
                    'role' => $dbRole,
                    'updated_at' => now()
                ]);

            // Buscar membro atualizado
            $updatedMember = DB::table('group_members')
                ->where('group_id', $groupId)
                ->where('user_id', $memberId)
                ->first();

            // Buscar dados do usuário
            $userData = DB::table('users')
                ->where('id', $memberId)
                ->select('id', 'name', 'email', 'phone')
                ->first();

            Log::info("Role de membro atualizado", [
                'group_id' => $groupId,
                'member_id' => $memberId,
                'old_role' => $member->role,
                'new_role' => $dbRole,
                'requested_role' => $requestedRole
            ]);

            // Registrar atividade de mudança de role
            if (class_exists('App\Models\GroupActivity') && $userData) {
                try {
                    // Mapear 'priority_contact' para 'patient' na notificação
                    $notificationRole = $dbRole === 'priority_contact' ? 'patient' : $dbRole;
                    \App\Models\GroupActivity::logMemberPromoted($groupId, $memberId, $userData->name, $notificationRole);
                } catch (\Exception $e) {
                    Log::warning("Erro ao registrar atividade de mudança de role: " . $e->getMessage());
                }
            }

            // Retornar role como 'patient' se for 'priority_contact' (para compatibilidade com frontend)
            $responseRole = $dbRole === 'priority_contact' ? 'patient' : $dbRole;

            return response()->json([
                'success' => true,
                'message' => 'Role atualizado com sucesso',
                'data' => [
                    'id' => $updatedMember->user_id,
                    'user_id' => $updatedMember->user_id,
                    'name' => $userData->name ?? null,
                    'email' => $userData->email ?? null,
                    'phone' => $userData->phone ?? null,
                    'role' => $responseRole, // Retornar 'patient' se for 'priority_contact'
                    'is_admin' => $responseRole === 'admin'
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("Erro ao atualizar role de membro: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remover membro do grupo
     * DELETE /api/groups/{groupId}/members/{memberId}
     */
    public function removeMember($groupId, $memberId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Verificar se grupo existe
            $group = DB::table('groups')->where('id', $groupId)->first();
            if (!$group) {
                return response()->json([
                    'success' => false,
                    'message' => 'Grupo não encontrado'
                ], 404);
            }

            // Verificar se usuário tem permissão (deve ser admin do grupo)
            $createdBy = $group->created_by ?? $group->admin_user_id ?? null;
            $isCreator = $createdBy && (int)$createdBy == (int)$user->id;
            
            $isAdmin = $isCreator;
            if (!$isAdmin && Schema::hasTable('group_members')) {
                $adminMember = DB::table('group_members')
                    ->where('group_id', $groupId)
                    ->where('user_id', $user->id)
                    ->where('role', 'admin')
                    ->first();
                $isAdmin = $isAdmin || ($adminMember !== null);
            }

            if (!$isAdmin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem permissão para remover membros deste grupo'
                ], 403);
            }

            // Verificar se membro existe
            if (!Schema::hasTable('group_members')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tabela de membros não existe'
                ], 500);
            }

            $member = DB::table('group_members')
                ->where('group_id', $groupId)
                ->where('user_id', $memberId)
                ->first();

            if (!$member) {
                return response()->json([
                    'success' => false,
                    'message' => 'Membro não encontrado no grupo'
                ], 404);
            }

            // Não permitir remover o criador do grupo
            if ((int)$memberId == (int)$createdBy) {
                return response()->json([
                    'success' => false,
                    'message' => 'Não é possível remover o administrador do grupo'
                ], 403);
            }

            // Buscar nome do membro antes de remover
            $userData = DB::table('users')
                ->where('id', $memberId)
                ->select('name')
                ->first();
            
            $memberName = $userData->name ?? 'Membro';

            // Remover membro
            DB::table('group_members')
                ->where('group_id', $groupId)
                ->where('user_id', $memberId)
                ->delete();

            // Registrar atividade
            if (class_exists('App\Models\GroupActivity')) {
                try {
                    \App\Models\GroupActivity::logMemberRemoved($groupId, $memberId, $memberName);
                } catch (\Exception $e) {
                    Log::warning("Erro ao registrar atividade de remoção de membro: " . $e->getMessage());
                }
            }

            Log::info("Membro removido do grupo", [
                'group_id' => $groupId,
                'member_id' => $memberId,
                'removed_by' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Membro removido com sucesso'
            ]);

        } catch (\Exception $e) {
            Log::error("Erro ao remover membro do grupo: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erro ao remover membro',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
