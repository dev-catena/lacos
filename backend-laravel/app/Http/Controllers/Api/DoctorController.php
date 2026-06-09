<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use App\Models\Appointment;
use App\Models\User;
use App\Models\Doctor;
use Carbon\Carbon;

class DoctorController extends Controller
{
    /**
     * Listar médicos de um grupo
     * GET /api/doctors?group_id={groupId}
     */
    public function index(Request $request)
    {
        try {
            $groupId = $request->query('group_id');
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }
            
            // Verificar se o usuário tem acesso ao grupo
            if ($groupId) {
                $hasAccess = false;
                // Tentar group_members primeiro (tabela mais comum)
                if (Schema::hasTable('group_members')) {
                    $hasAccess = DB::table('group_members')
                        ->where('user_id', $user->id)
                        ->where('group_id', $groupId)
                        ->exists();
                } else if (Schema::hasTable('group_user')) {
                    $hasAccess = DB::table('group_user')
                        ->where('user_id', $user->id)
                        ->where('group_id', $groupId)
                        ->exists();
                } else {
                    // Fallback: verificar se é criador do grupo
                    $hasAccess = DB::table('groups')
                        ->where('id', $groupId)
                        ->where('created_by', $user->id)
                        ->exists();
                }
                
                if (!$hasAccess) {
                    Log::warning('DoctorController.index - Usuário sem acesso ao grupo', [
                        'user_id' => $user->id,
                        'group_id' => $groupId
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem acesso a este grupo',
                    ], 403);
                }
            }
            
            $doctors = [];
            
            if ($groupId) {
                // PRIMEIRO: Buscar médicos diretamente da tabela doctors do grupo
                $doctorsFromGroup = [];
                if (Schema::hasTable('doctors')) {
                    Log::info('DoctorController.index - Buscando médicos do grupo', [
                        'group_id' => $groupId
                    ]);
                    
                    $doctorsFromGroupRaw = DB::table('doctors')
                        ->where('group_id', $groupId)
                        ->get();

                    $genderByUserIdForGroup = [];
                    if (Schema::hasColumn('users', 'gender') && Schema::hasColumn('doctors', 'user_id')) {
                        $uids = $doctorsFromGroupRaw->pluck('user_id')->filter(fn ($id) => $id !== null && $id !== '')->unique()->values();
                        if ($uids->isNotEmpty()) {
                            $genderByUserIdForGroup = DB::table('users')->whereIn('id', $uids)->pluck('gender', 'id')->all();
                        }
                    }

                    Log::info('DoctorController.index - Médicos encontrados na tabela doctors', [
                        'count' => $doctorsFromGroupRaw->count(),
                        'doctors' => $doctorsFromGroupRaw->map(fn($d) => ['id' => $d->id, 'name' => $d->name, 'specialty' => $d->specialty])->toArray()
                    ]);

                    $doctorsFromGroup = $doctorsFromGroupRaw->map(function ($doctor) use ($genderByUserIdForGroup) {
                            // Buscar especialidade pelo nome (specialty é string na tabela doctors)
                            $specialty = null;
                            $specialtyId = null;
                            if ($doctor->specialty) {
                                // Tentar encontrar a especialidade pelo nome
                                $specialtyData = DB::table('medical_specialties')
                                    ->where('name', $doctor->specialty)
                                    ->select('id', 'name')
                                    ->first();
                                if ($specialtyData) {
                                    $specialty = [
                                        'id' => $specialtyData->id,
                                        'name' => $specialtyData->name,
                                    ];
                                    $specialtyId = $specialtyData->id;
                                } else {
                                    // Se não encontrar, usar o nome direto
                                    $specialty = [
                                        'id' => null,
                                        'name' => $doctor->specialty,
                                    ];
                                }
                            }

                            $gender = null;
                            if (isset($doctor->user_id) && isset($genderByUserIdForGroup[(int) $doctor->user_id])) {
                                $gender = $genderByUserIdForGroup[(int) $doctor->user_id];
                            }

                            $row = [
                                'id' => $doctor->id,
                                'name' => $doctor->name,
                                'crm' => $doctor->crm ?? null,
                                'medical_specialty' => $specialty,
                                'medical_specialty_id' => $specialtyId,
                                'phone' => $doctor->phone ?? null,
                                'email' => $doctor->email ?? null,
                                'address' => $doctor->address ?? null,
                                'notes' => $doctor->notes ?? null,
                                'is_primary' => (bool) ($doctor->is_primary ?? false),
                                'is_group_doctor' => true, // Marcar como médico do grupo
                                'gender' => $gender,
                            ];
                            if (Schema::hasColumn('doctors', 'user_id')) {
                                $row['user_id'] = isset($doctor->user_id) ? (int) $doctor->user_id : null;
                            }

                            return $row;
                        })
                        ->toArray();
                    
                    Log::info('DoctorController.index - Médicos processados do grupo', [
                        'count' => count($doctorsFromGroup)
                    ]);
                }
                
                // Buscar médicos associados ao grupo via relacionamentos:
                // 1. Médicos que têm medicamentos no grupo
                // 2. Médicos que têm documentos no grupo
                // 3. Médicos que têm consultas no grupo
                // 4. Médicos que são membros do grupo (role='doctor')
                // IMPORTANTE: Esta busca é opcional - se falhar, ainda retornamos os médicos da tabela doctors
                
                $doctorsFromRelations = [];
                
                try {
                    $doctorIds = collect();
                    
                    // Médicos via medicamentos (verificar se a coluna existe)
                    if (Schema::hasTable('medications') && Schema::hasColumn('medications', 'doctor_id')) {
                        try {
                            $medicationDoctors = DB::table('medications')
                                ->where('group_id', $groupId)
                                ->whereNotNull('doctor_id')
                                ->distinct()
                                ->pluck('doctor_id');
                            $doctorIds = $doctorIds->merge($medicationDoctors);
                        } catch (\Exception $e) {
                            Log::warning('DoctorController.index - Erro ao buscar médicos via medicamentos: ' . $e->getMessage());
                        }
                    }
                    
                    // Médicos via documentos (verificar se a coluna existe)
                    if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'doctor_id')) {
                        try {
                            $documentDoctors = DB::table('documents')
                                ->where('group_id', $groupId)
                                ->whereNotNull('doctor_id')
                                ->distinct()
                                ->pluck('doctor_id');
                            $doctorIds = $doctorIds->merge($documentDoctors);
                        } catch (\Exception $e) {
                            Log::warning('DoctorController.index - Erro ao buscar médicos via documentos: ' . $e->getMessage());
                        }
                    }
                    
                    // Médicos via consultas (verificar se a coluna existe)
                    if (Schema::hasTable('appointments') && Schema::hasColumn('appointments', 'doctor_id')) {
                        try {
                            $appointmentDoctors = DB::table('appointments')
                                ->where('group_id', $groupId)
                                ->whereNotNull('doctor_id')
                                ->distinct()
                                ->pluck('doctor_id');
                            $doctorIds = $doctorIds->merge($appointmentDoctors);
                        } catch (\Exception $e) {
                            Log::warning('DoctorController.index - Erro ao buscar médicos via consultas: ' . $e->getMessage());
                        }
                    }
                    
                    // Médicos que são membros do grupo
                    if (Schema::hasTable('group_user')) {
                        try {
                            $memberDoctors = DB::table('group_user')
                                ->where('group_id', $groupId)
                                ->join('users', 'group_user.user_id', '=', 'users.id')
                                ->where('users.profile', 'doctor')
                                ->pluck('users.id');
                            $doctorIds = $doctorIds->merge($memberDoctors);
                        } catch (\Exception $e) {
                            Log::warning('DoctorController.index - Erro ao buscar médicos membros do grupo: ' . $e->getMessage());
                        }
                    }
                    
                    // Remover duplicatas e buscar dados dos médicos
                    $uniqueDoctorIds = $doctorIds->unique()->values();
                    
                    if ($uniqueDoctorIds->isNotEmpty()) {
                        // Buscar médicos da tabela doctors
                        $doctorsFromTable = [];
                        if (Schema::hasTable('doctors')) {
                            $relationDoctorRows = DB::table('doctors')
                                ->whereIn('id', $uniqueDoctorIds)
                                ->get();

                            $relGenderByUserId = [];
                            if (Schema::hasColumn('doctors', 'user_id') && Schema::hasColumn('users', 'gender')) {
                                $rUids = $relationDoctorRows->pluck('user_id')->filter(fn ($id) => $id !== null && $id !== '')->unique()->values();
                                if ($rUids->isNotEmpty()) {
                                    $relGenderByUserId = DB::table('users')->whereIn('id', $rUids)->pluck('gender', 'id')->all();
                                }
                            }

                            $doctorsFromTable = $relationDoctorRows->map(function ($doctor) use ($relGenderByUserId) {
                                    // Buscar especialidade
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

                                    $g = null;
                                    if (! empty($doctor->user_id) && isset($relGenderByUserId[(int) $doctor->user_id])) {
                                        $g = $relGenderByUserId[(int) $doctor->user_id];
                                    }

                                    return [
                                        'id' => $doctor->id,
                                        'name' => $doctor->name,
                                        'crm' => $doctor->crm ?? null,
                                        'medical_specialty' => $specialty,
                                        'medical_specialty_id' => $doctor->medical_specialty_id,
                                        'is_primary' => (bool) ($doctor->is_primary ?? false),
                                        'is_group_doctor' => true, // linha na tabela doctors (editar/excluir no app)
                                        'gender' => $g,
                                    ];
                                })
                                ->toArray();
                        }
                        
                        // Buscar médicos da tabela users (se não encontrados na tabela doctors)
                        $foundIds = collect($doctorsFromTable)->pluck('id');
                        $missingIds = $uniqueDoctorIds->diff($foundIds);
                        
                        if ($missingIds->isNotEmpty()) {
                            $doctorsFromUsers = DB::table('users')
                                ->whereIn('id', $missingIds)
                                ->where('profile', 'doctor')
                                ->get()
                                ->map(function ($user) {
                                    // Buscar especialidade
                                    $specialty = null;
                                    if ($user->medical_specialty_id) {
                                        $specialtyData = DB::table('medical_specialties')
                                            ->where('id', $user->medical_specialty_id)
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
                                        'id' => $user->id,
                                        'name' => $user->name,
                                        'email' => $user->email,
                                        'crm' => $user->crm ?? null,
                                        'medical_specialty' => $specialty,
                                        'medical_specialty_id' => $user->medical_specialty_id,
                                        'is_primary' => false,
                                        'is_platform_doctor' => true,
                                        'gender' => $user->gender ?? null,
                                    ];
                                })
                                ->toArray();
                            
                            $doctorsFromRelations = array_merge($doctorsFromTable, $doctorsFromUsers);
                        } else {
                            $doctorsFromRelations = $doctorsFromTable;
                        }
                    }
                } catch (\Exception $e) {
                    // Se houver qualquer erro na busca de relacionamentos, apenas logar e continuar
                    // Os médicos da tabela doctors já foram buscados e serão retornados
                    Log::warning('DoctorController.index - Erro ao buscar médicos via relacionamentos: ' . $e->getMessage());
                    $doctorsFromRelations = [];
                }
                
                // Buscar médicos da plataforma (users com profile='doctor')
                $platformDoctors = [];
                try {
                    $query = DB::table('users')
                        ->where('profile', 'doctor');
                    
                    // Apenas médicos aprovados (podem fazer login e ter agenda)
                    if (Schema::hasColumn('users', 'doctor_approved_at')) {
                        $query->whereNotNull('doctor_approved_at')
                            ->where('doctor_approved_at', '!=', '0000-00-00 00:00:00');
                    }
                    
                    // Excluir médicos bloqueados
                    if (Schema::hasColumn('users', 'is_blocked')) {
                        $query->where(function ($q) {
                            $q->where('is_blocked', false)->orWhereNull('is_blocked');
                        });
                    }
                    
                    // Incluir médicos ativos (is_active=1) ou sem o campo definido (null = considerar ativo)
                    if (Schema::hasColumn('users', 'is_active')) {
                        $query->where(function ($q) {
                            $q->where('is_active', 1)->orWhereNull('is_active');
                        });
                    }
                    
                    // Selecionar colunas que existem na tabela users (profile_photo ou photo/photo_url)
                    $selectColumns = ['id', 'name', 'email', 'crm', 'phone', 'medical_specialty_id'];
                    if (Schema::hasColumn('users', 'professional_qualification_level')) {
                        $selectColumns[] = 'professional_qualification_level';
                    }
                    if (Schema::hasColumn('users', 'gender')) {
                        $selectColumns[] = 'gender';
                    }
                    if (Schema::hasColumn('users', 'profile_photo')) {
                        $selectColumns[] = 'profile_photo';
                    } elseif (Schema::hasColumn('users', 'photo')) {
                        $selectColumns[] = 'photo';
                    } elseif (Schema::hasColumn('users', 'photo_url')) {
                        $selectColumns[] = 'photo_url';
                    }
                    foreach (['city', 'state', 'neighborhood', 'latitude', 'longitude', 'availability', 'formation_details', 'formation_description'] as $locCol) {
                        if (Schema::hasColumn('users', $locCol)) {
                            $selectColumns[] = $locCol;
                        }
                    }

                    $platformUsers = $query->select($selectColumns)->get();

                    $timezone = 'America/Sao_Paulo';
                    $nowTz = Carbon::now($timezone);
                    $allPlatformUserIds = $platformUsers->pluck('id')->map(fn ($id) => (int) $id)->all();
                    $occupiedByPlatformUser = Appointment::occupiedCalendarSlotKeyMapsForPlatformUserIds($allPlatformUserIds, $timezone);

                    $jsonSlots = [];
                    foreach ($platformUsers as $user) {
                        $occ = $occupiedByPlatformUser[$user->id] ?? [];
                        $slot = $this->earliestFutureSlotFromUserAvailability($user, $timezone, $occ);
                        $jsonSlots[$user->id] = $slot;
                    }
                    $dbSlotByDoctor = ! empty($allPlatformUserIds)
                        ? $this->batchEarliestSlotsFromDoctorAvailabilityTable($allPlatformUserIds, $nowTz, $timezone, $occupiedByPlatformUser)
                        : [];

                    foreach ($platformUsers as $user) {
                        // Buscar especialidade
                        $specialty = null;
                        $specialtyId = $user->medical_specialty_id ?? null;
                        if ($specialtyId && Schema::hasTable('medical_specialties')) {
                            $specialtyData = DB::table('medical_specialties')
                                ->where('id', $specialtyId)
                                ->select('id', 'name')
                                ->first();
                            if ($specialtyData) {
                                $specialty = [
                                    'id' => $specialtyData->id,
                                    'name' => $specialtyData->name,
                                ];
                            }
                        }
                        
                        // Construir URL da foto se houver (profile_photo, photo ou photo_url)
                        $photoPath = $user->profile_photo ?? $user->photo ?? $user->photo_url ?? null;
                        $photoUrl = $photoPath ? url('storage/' . ltrim($photoPath, '/')) : null;

                        $jsonSlot = $jsonSlots[$user->id] ?? null;
                        $dbSlot = $dbSlotByDoctor[$user->id] ?? null;
                        $nextSlot = null;
                        if ($jsonSlot && $dbSlot) {
                            $nextSlot = $jsonSlot->lt($dbSlot) ? $jsonSlot : $dbSlot;
                        } else {
                            $nextSlot = $jsonSlot ?? $dbSlot;
                        }

                        $platformDoctors[] = [
                            'id' => $user->id,
                            'name' => $user->name,
                            'crm' => $user->crm ?? null,
                            'phone' => $user->phone ?? null,
                            'medical_specialty' => $specialty,
                            'medical_specialty_id' => $specialtyId,
                            'professional_qualification_level' => $user->professional_qualification_level ?? null,
                            'gender' => $user->gender ?? null,
                            'photo' => $photoPath,
                            'photo_url' => $photoUrl,
                            'city' => isset($user->city) ? $user->city : null,
                            'state' => isset($user->state) ? $user->state : null,
                            'neighborhood' => isset($user->neighborhood) ? $user->neighborhood : null,
                            'latitude' => isset($user->latitude) ? $user->latitude : null,
                            'longitude' => isset($user->longitude) ? $user->longitude : null,
                            'formation_details' => isset($user->formation_details) ? $user->formation_details : null,
                            'formation_description' => isset($user->formation_description) ? $user->formation_description : null,
                            'has_future_availability' => $nextSlot !== null,
                            'next_slot_at' => $nextSlot ? $nextSlot->toIso8601String() : null,
                            'is_available' => true, // Médicos da plataforma considerados disponíveis
                            'is_primary' => false, // Médicos da plataforma não são principais por padrão
                            'is_platform_doctor' => true, // Marcar como médico da plataforma
                        ];
                    }
                    
                    Log::info('DoctorController.index - Médicos da plataforma encontrados', [
                        'count' => count($platformDoctors),
                        'doctors' => array_map(fn($d) => ['id' => $d['id'], 'name' => $d['name'], 'crm' => $d['crm'] ?? null], $platformDoctors)
                    ]);
                } catch (\Exception $e) {
                    Log::warning('DoctorController.index - Erro ao buscar médicos da plataforma: ' . $e->getMessage());
                }
                
                // Combinar médicos do grupo (tabela doctors) com médicos de relacionamentos e médicos da plataforma
                // IMPORTANTE: Sempre retornar pelo menos os médicos da tabela doctors, mesmo se houver erro nas buscas de relacionamentos
                $doctors = array_merge($doctorsFromGroup, $doctorsFromRelations ?? [], $platformDoctors);
                
                // Remover duplicatas baseado no ID (priorizar médicos do grupo sobre médicos da plataforma)
                $doctorsMap = [];
                foreach ($doctors as $doctor) {
                    $doctorId = $doctor['id'] ?? null;
                    if (!$doctorId) {
                        continue; // Pular se não tiver ID
                    }
                    
                    if (!isset($doctorsMap[$doctorId])) {
                        // Primeira ocorrência, adicionar
                        $doctorsMap[$doctorId] = $doctor;
                    } else {
                        // Já existe, priorizar médico do grupo sobre médico da plataforma
                        $existing = $doctorsMap[$doctorId];
                        $existingIsGroup = $existing['is_group_doctor'] ?? false;
                        $newIsGroup = $doctor['is_group_doctor'] ?? false;

                        if ($newIsGroup && !$existingIsGroup) {
                            // Novo é do grupo e existente não é, substituir
                            $doctorsMap[$doctorId] = $doctor;
                        } elseif (!$newIsGroup && !$existingIsGroup) {
                            // Mesmo users.id: mesclar sem sobrescrever next_slot_at com null (array_merge faria isso).
                            $merged = array_merge($existing, $doctor);
                            $nextA = $existing['next_slot_at'] ?? null;
                            $nextB = $doctor['next_slot_at'] ?? null;
                            $merged['next_slot_at'] = ! empty($nextB) ? $nextB : $nextA;
                            $merged['has_future_availability'] = ! empty($merged['next_slot_at'])
                                || ($existing['has_future_availability'] ?? false)
                                || ($doctor['has_future_availability'] ?? false);
                            $doctorsMap[$doctorId] = $merged;
                        } elseif (! $newIsGroup && $existingIsGroup && ($doctor['is_platform_doctor'] ?? false)) {
                            // doctors.id na lista do grupo igual ao users.id do médico da plataforma (colisão numérica):
                            // enriquecer registro do grupo com agenda calculada na plataforma.
                            $uidGroup = (int) ($existing['user_id'] ?? 0);
                            $uidPlat = (int) ($doctor['id'] ?? 0);
                            if ($uidGroup > 0 && $uidGroup === $uidPlat) {
                                $merged = array_merge($existing, $doctor);
                                $merged['next_slot_at'] = $doctor['next_slot_at'] ?? $existing['next_slot_at'] ?? null;
                                $merged['has_future_availability'] = ! empty($merged['next_slot_at'])
                                    || ($doctor['has_future_availability'] ?? false);
                                $doctorsMap[$doctorId] = $merged;
                            }
                        }
                        // Caso contrário, manter o existente (ex.: já é do grupo)
                    }
                }
                $doctors = array_values($doctorsMap);

                // Garantir next_slot / has_future na lista a partir dos médicos da plataforma (users.id),
                // inclusive quando o card exibido é o registro do grupo (user_id) ou houve mesclagem incompleta.
                $slotHintByUserId = [];
                foreach ($platformDoctors as $pd) {
                    $puid = (int) ($pd['id'] ?? 0);
                    if ($puid <= 0 || empty($pd['next_slot_at'])) {
                        continue;
                    }
                    $slotHintByUserId[$puid] = [
                        'next_slot_at' => $pd['next_slot_at'],
                        'has_future_availability' => (bool) ($pd['has_future_availability'] ?? true),
                    ];
                }
                foreach ($doctors as $idx => $row) {
                    if (! empty($row['next_slot_at'])) {
                        continue;
                    }
                    $resolveUid = null;
                    if (! empty($row['is_platform_doctor'])) {
                        $resolveUid = (int) ($row['id'] ?? 0);
                    } elseif (! empty($row['user_id'])) {
                        $resolveUid = (int) $row['user_id'];
                    }
                    if ($resolveUid > 0 && isset($slotHintByUserId[$resolveUid])) {
                        $doctors[$idx] = array_merge($row, $slotHintByUserId[$resolveUid]);
                    }
                }

                $userIdsForExtras = [];
                foreach ($doctors as $d) {
                    if (! empty($d['is_platform_doctor'])) {
                        $userIdsForExtras[(int) ($d['id'] ?? 0)] = true;
                    }
                    if (! empty($d['user_id'])) {
                        $userIdsForExtras[(int) $d['user_id']] = true;
                    }
                }
                $coursesByUserId = $this->batchCaregiverCoursesByUserIds(array_keys(array_filter($userIdsForExtras)));

                foreach ($doctors as $idx => $d) {
                    $uid = null;
                    if (! empty($d['is_platform_doctor'])) {
                        $uid = (int) ($d['id'] ?? 0);
                    } elseif (! empty($d['user_id'])) {
                        $uid = (int) $d['user_id'];
                    }
                    if ($uid && isset($coursesByUserId[$uid])) {
                        $doctors[$idx]['courses'] = $coursesByUserId[$uid];
                    } else {
                        $doctors[$idx]['courses'] = [];
                    }
                    if (! empty($d['is_platform_doctor'])) {
                        unset($doctors[$idx]['email']);
                    }
                }

                Log::info('DoctorController.index - Após remoção de duplicatas', [
                    'total' => count($doctors),
                    'doctors_ids' => array_map(fn($d) => $d['id'], $doctors),
                    'doctors_names' => array_map(fn($d) => $d['name'], $doctors),
                ]);
                
                // Ordenar: médicos principais primeiro (is_primary=true), depois por nome
                usort($doctors, function($a, $b) {
                    $aPrimary = $a['is_primary'] ?? false;
                    $bPrimary = $b['is_primary'] ?? false;
                    if ($aPrimary && !$bPrimary) return -1;
                    if (!$aPrimary && $bPrimary) return 1;
                    $aName = $a['name'] ?? '';
                    $bName = $b['name'] ?? '';
                    return strcmp($aName, $bName);
                });
                
                Log::info('DoctorController.index - Total de médicos retornados', [
                    'total' => count($doctors),
                    'from_group' => count($doctorsFromGroup),
                    'from_relations' => count($doctorsFromRelations ?? []),
                    'from_platform' => count($platformDoctors),
                    'doctors_from_group' => array_map(fn($d) => ['id' => $d['id'], 'name' => $d['name'], 'is_primary' => $d['is_primary'] ?? false], $doctorsFromGroup),
                    'doctors_from_platform' => array_map(fn($d) => ['id' => $d['id'], 'name' => $d['name'], 'crm' => $d['crm'] ?? null], $platformDoctors),
                    'doctors_final' => array_map(fn($d) => ['id' => $d['id'], 'name' => $d['name'], 'is_platform_doctor' => $d['is_platform_doctor'] ?? false], $doctors),
                ]);
            } else {
                Log::info('DoctorController.index - Sem group_id, retornando array vazio');
            }
            
            Log::info('DoctorController.index - Resposta final', [
                'success' => true,
                'data_count' => count($doctors),
                'data' => array_map(fn($d) => ['id' => $d['id'] ?? 'N/A', 'name' => $d['name'] ?? 'N/A', 'is_primary' => $d['is_primary'] ?? false], $doctors)
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $doctors,
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar médicos: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar médicos',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Buscar agenda disponível de um médico
     * GET /api/doctors/{id}/availability
     */
    public function getAvailability(Request $request, $id)
    {
        try {
            $doctor = User::where("id", $id)->where("profile", "doctor")->firstOrFail();
            $availabilityRaw = $doctor->availability ?? "{}";
            $availability = json_decode($availabilityRaw, true);
            
            Log::info("DoctorController.getAvailability - Dados brutos", [
                'doctor_id' => $id,
                'availability_raw' => substr($availabilityRaw ?? '', 0, 200),
                'availability_decoded' => $availability,
                'is_array' => is_array($availability),
            ]);
            
            if (!$availability || !is_array($availability)) {
                $availability = ["availableDays" => [], "daySchedules" => []];
            }
            
            // Fallback: se users.availability está vazio, buscar de doctor_availability
            $availableDays = $availability["availableDays"] ?? [];
            if (empty($availableDays) && Schema::hasTable('doctor_availability') && Schema::hasTable('doctor_availability_times')) {
                $records = DB::table('doctor_availability')
                    ->where('doctor_id', $id)
                    ->orderBy('date')
                    ->get();
                foreach ($records as $r) {
                    $dateStr = $r->date instanceof \Carbon\Carbon ? $r->date->format('Y-m-d') : $r->date;
                    $availableDays[] = $dateStr;
                    $timesRaw = DB::table('doctor_availability_times')
                        ->where('availability_id', $r->id)
                        ->orderBy('time')
                        ->pluck('time');
                    $times = $timesRaw->map(function ($t) {
                        $str = is_string($t) ? $t : (string) $t;
                        return strlen($str) >= 5 ? substr($str, 0, 5) : $str;
                    })->values()->toArray();
                    $availability["daySchedules"][$dateStr] = $times;
                }
                $availability["availableDays"] = array_values(array_unique($availableDays));
                Log::info("DoctorController.getAvailability - Dados carregados de doctor_availability", [
                    'doctor_id' => $id,
                    'days_count' => count($availableDays),
                ]);
            }

            // Filtrar datas passadas - apenas retornar datas atuais e futuras
            // Usar timezone do Brasil (America/Sao_Paulo - GMT-3) para comparação de datas
            $timezone = 'America/Sao_Paulo'; // GMT-3
            $today = now()->setTimezone($timezone)->format('Y-m-d');
            $currentTime = now()->setTimezone($timezone)->format('H:i');
            $availableDays = $availability["availableDays"] ?? [];
            $daySchedules = $availability["daySchedules"] ?? [];

            Log::info("DoctorController.getAvailability - Antes do filtro", [
                'doctor_id' => $id,
                'timezone' => $timezone,
                'today' => $today,
                'currentTime' => $currentTime,
                'availableDays' => $availableDays,
                'daySchedules' => $daySchedules,
                'availableDays_count' => count($availableDays),
                'availability_raw' => $availabilityRaw,
            ]);

            // Filtrar apenas datas >= hoje
            // Se for hoje ou ontem, verificar se ainda há horários futuros disponíveis
            $yesterday = now()->setTimezone($timezone)->subDay()->format('Y-m-d');
            
            $filteredAvailableDays = array_filter($availableDays, function($date) use ($today, $yesterday, $daySchedules, $currentTime) {
                // Se a data é futura, incluir
                if ($date > $today) {
                    Log::info("DoctorController.getAvailability - Data futura incluída", [
                        'date' => $date,
                        'today' => $today,
                    ]);
                    return true;
                }
                
                // Se é hoje, incluir todos os horários (mesmo que já tenham passado)
                // Isso permite que horários sejam vistos mesmo se o médico salvou há pouco tempo
                if ($date === $today) {
                    $times = $daySchedules[$date] ?? [];
                    $hasTimes = count($times) > 0;
                    
                    // Incluir se houver horários, mesmo que já tenham passado
                    // (permite ver horários que foram salvos recentemente)
                    Log::info("DoctorController.getAvailability - Verificando dia atual", [
                        'date' => $date,
                        'today' => $today,
                        'all_times' => $times,
                        'currentTime' => $currentTime,
                        'hasTimes' => $hasTimes,
                    ]);
                    
                    return $hasTimes;
                }
                
                // Se é ontem, verificar se há horários futuros (pode ser que o servidor esteja em timezone diferente)
                if ($date === $yesterday) {
                    $times = $daySchedules[$date] ?? [];
                    $hasFutureTimes = false;
                    
                    // Para ontem, considerar todos os horários como válidos (pode ser diferença de timezone)
                    if (count($times) > 0) {
                        $hasFutureTimes = true;
                    }
                    
                    Log::info("DoctorController.getAvailability - Verificando dia anterior (possível diferença de timezone)", [
                        'date' => $date,
                        'today' => $today,
                        'yesterday' => $yesterday,
                        'all_times' => $times,
                        'hasFutureTimes' => $hasFutureTimes,
                    ]);
                    
                    return $hasFutureTimes;
                }
                
                // Se é passado (mais de 1 dia), excluir
                Log::info("DoctorController.getAvailability - Data passada excluída", [
                    'date' => $date,
                    'today' => $today,
                    'yesterday' => $yesterday,
                ]);
                return false;
            });

            // Reindexar array para manter índices sequenciais
            $filteredAvailableDays = array_values($filteredAvailableDays);

            // Filtrar daySchedules para manter apenas as datas futuras
            // Se for hoje, filtrar apenas horários futuros
            $filteredDaySchedules = [];
            $yesterday = now()->setTimezone($timezone)->subDay()->format('Y-m-d');
            foreach ($filteredAvailableDays as $date) {
                if (isset($daySchedules[$date])) {
                    if ($date === $today) {
                        // Se é hoje, incluir todos os horários (mesmo que já tenham passado)
                        // Filtrar apenas horários que passaram há mais de 2 horas
                        $times = $daySchedules[$date];
                        $currentHour = (int)substr($currentTime, 0, 2);
                        $currentMinute = (int)substr($currentTime, 3, 2);
                        $currentTotalMinutes = $currentHour * 60 + $currentMinute;
                        
                        $validTimes = array_filter($times, function($time) use ($currentTotalMinutes) {
                            $timeStr = is_string($time) ? $time : (string) $time;
                            $timeHour = (int)substr($timeStr, 0, 2);
                            $timeMinute = (int)substr($timeStr, 3, 2);
                            $timeTotalMinutes = $timeHour * 60 + $timeMinute;
                            
                            // Incluir se for futuro ou se passou há menos de 12 horas (cobre timezone)
                            $diffMinutes = $currentTotalMinutes - $timeTotalMinutes;
                            return $diffMinutes <= 720; // 12 horas = 720 minutos
                        });
                        
                        $filteredDaySchedules[$date] = array_values($validTimes);
                        
                        Log::info("DoctorController.getAvailability - Filtrando horários do dia atual", [
                            'date' => $date,
                            'all_times' => $times,
                            'currentTime' => $currentTime,
                            'validTimes' => $filteredDaySchedules[$date],
                        ]);
                    } elseif ($date === $yesterday) {
                        // Se é ontem (possível diferença de timezone), incluir todos os horários
                        $filteredDaySchedules[$date] = $daySchedules[$date];
                        
                        Log::info("DoctorController.getAvailability - Incluindo horários do dia anterior", [
                            'date' => $date,
                            'times' => $daySchedules[$date],
                        ]);
                    } else {
                        // Se é futuro, incluir todos os horários
                        $filteredDaySchedules[$date] = $daySchedules[$date];
                    }
                }
            }

            $filteredAvailability = [
                "availableDays" => $filteredAvailableDays,
                "daySchedules" => $filteredDaySchedules
            ];

            // Por padrão remove horários já ocupados por teleconsulta (evita dupla marcação).
            // Tela do médico (edição da grade) deve enviar exclude_booked=0 para ver o template completo.
            $excludeBookedParam = $request->query('exclude_booked');
            $shouldExcludeBooked = $request->has('exclude_booked')
                ? filter_var($excludeBookedParam, FILTER_VALIDATE_BOOL)
                : true;

            if ($shouldExcludeBooked) {
                $filteredAvailability = $this->excludeBookedTeleconsultSlots((int) $id, $filteredAvailability, $timezone);
            }

            Log::info("DoctorController.getAvailability - Agenda filtrada", [
                'doctor_id' => $id,
                'original_days_count' => count($availableDays),
                'filtered_days_count' => count($filteredAvailableDays),
                'today' => $today,
                'filteredAvailableDays' => $filteredAvailableDays,
                'filteredDaySchedules' => $filteredDaySchedules,
            ]);

            return response()->json(["success" => true, "data" => $filteredAvailability]);
        } catch (\Exception $e) {
            \Log::error("Erro ao buscar agenda: " . $e->getMessage());
            return response()->json(["success" => false, "message" => "Erro ao buscar agenda"], 500);
        }
    }

    /**
     * Salvar agenda disponível de um médico
     * POST /api/doctors/{id}/availability
     */
    public function saveAvailability(Request $request, $id)
    {
        try {
            Log::info("DoctorController.saveAvailability - Iniciando", ['doctor_id' => $id, 'request_data' => $request->all()]);
            
            // Verificar se o médico existe (pode ser da tabela users ou doctors)
            $doctor = null;
            
            // Primeiro, tentar buscar na tabela users com profile='doctor'
            if (Schema::hasTable('users')) {
                $doctor = User::where("id", $id)->where("profile", "doctor")->first();
            }
            
            // Se não encontrou em users, tentar na tabela doctors
            if (!$doctor && Schema::hasTable('doctors')) {
                $doctorFromTable = DB::table('doctors')->where('id', $id)->first();
                if ($doctorFromTable) {
                    // Se encontrou na tabela doctors, criar um objeto User temporário ou usar DB direto
                    // Por enquanto, vamos retornar erro informando que precisa ser um médico da plataforma
                    Log::warning("DoctorController.saveAvailability - Médico encontrado na tabela doctors, mas disponibilidade só pode ser salva para médicos da plataforma (users)", ['doctor_id' => $id]);
                    return response()->json([
                        "success" => false, 
                        "message" => "A disponibilidade só pode ser salva para médicos cadastrados na plataforma"
                    ], 400);
                }
            }
            
            if (!$doctor) {
                Log::error("DoctorController.saveAvailability - Médico não encontrado", ['doctor_id' => $id]);
                return response()->json([
                    "success" => false, 
                    "message" => "Médico não encontrado"
                ], 404);
            }
            
            // Validar dados
            $validated = $request->validate([
                "availableDays" => "nullable|array", 
                "daySchedules" => "nullable|array",
                "daySchedules.*" => "nullable|array",
                "daySchedules.*.*" => "nullable|string"
            ]);
            
            // Validar formato dos horários manualmente (evitar problema com regex no Laravel)
            if (isset($validated["daySchedules"]) && is_array($validated["daySchedules"])) {
                foreach ($validated["daySchedules"] as $date => $times) {
                    if (is_array($times)) {
                        foreach ($times as $time) {
                            if (!preg_match('/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/', $time)) {
                                return response()->json([
                                    "success" => false,
                                    "message" => "Formato de horário inválido: {$time}. Use o formato HH:MM (ex: 08:00, 14:30)"
                                ], 422);
                            }
                        }
                    }
                }
            }
            
            $availabilityData = [
                "availableDays" => $validated["availableDays"] ?? [], 
                "daySchedules" => $validated["daySchedules"] ?? []
            ];
            
            Log::info("DoctorController.saveAvailability - Dados validados", [
                'doctor_id' => $id,
                'availableDays_count' => count($availabilityData["availableDays"]),
                'daySchedules_count' => count($availabilityData["daySchedules"]),
                'daySchedules' => $availabilityData["daySchedules"],
            ]);
            
            // Verificar se a coluna availability existe
            if (!Schema::hasColumn('users', 'availability')) {
                Log::error("DoctorController.saveAvailability - Coluna 'availability' não existe na tabela users");
                return response()->json([
                    "success" => false, 
                    "message" => "Coluna de disponibilidade não configurada no banco de dados"
                ], 500);
            }
            
            // Salvar disponibilidade em users.availability (formato JSON)
            $doctor->availability = json_encode($availabilityData);
            $doctor->save();
            
            // Também salvar nas tabelas doctor_availability para garantir que horários apareçam ao agendar
            if (Schema::hasTable('doctor_availability') && Schema::hasTable('doctor_availability_times')) {
                try {
                    DB::table('doctor_availability')->where('doctor_id', $id)->delete();
                    $availableDays = $availabilityData['availableDays'] ?? [];
                    $daySchedules = $availabilityData['daySchedules'] ?? [];
                    foreach ($availableDays as $date) {
                        $times = $daySchedules[$date] ?? [];
                        if (!empty($times)) {
                            $availabilityId = DB::table('doctor_availability')->insertGetId([
                                'doctor_id' => $id,
                                'date' => $date,
                                'is_available' => true,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                            foreach ($times as $time) {
                                $timeFormatted = strlen($time) === 5 ? $time . ':00' : $time;
                                DB::table('doctor_availability_times')->insertOrIgnore([
                                    'availability_id' => $availabilityId,
                                    'time' => $timeFormatted,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                            }
                        }
                    }
                    Log::info("DoctorController.saveAvailability - Agenda também salva em doctor_availability", [
                        'doctor_id' => $id,
                        'days_saved' => count($availableDays),
                    ]);
                } catch (\Exception $e) {
                    Log::warning("DoctorController.saveAvailability - Erro ao salvar em doctor_availability (continuando): " . $e->getMessage());
                }
            }
            
            Log::info("DoctorController.saveAvailability - Agenda salva com sucesso", ['doctor_id' => $id]);
            
            return response()->json([
                "success" => true, 
                "message" => "Agenda salva", 
                "data" => $availabilityData
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error("DoctorController.saveAvailability - Erro de validação", ['errors' => $e->errors()]);
            return response()->json([
                "success" => false, 
                "message" => "Dados inválidos",
                "errors" => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("DoctorController.saveAvailability - Erro ao salvar agenda: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'doctor_id' => $id,
                'request_data' => $request->all()
            ]);
            return response()->json([
                "success" => false, 
                "message" => "Erro ao salvar agenda: " . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar um médico específico
     * GET /api/doctors/{id}
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            // Verificar se o médico existe na tabela doctors
            if (!Schema::hasTable('doctors')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tabela de médicos não configurada',
                ], 500);
            }

            $doctor = Doctor::find($id);
            
            if (!$doctor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Médico não encontrado',
                ], 404);
            }

            // Verificar se o usuário tem acesso ao grupo do médico
            $hasAccess = false;
            if (Schema::hasTable('group_members')) {
                $hasAccess = DB::table('group_members')
                    ->where('user_id', $user->id)
                    ->where('group_id', $doctor->group_id)
                    ->exists();
            } else {
                // Fallback: verificar se é criador do grupo
                $hasAccess = DB::table('groups')
                    ->where('id', $doctor->group_id)
                    ->where('created_by', $user->id)
                    ->exists();
            }
            
            if (!$hasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem acesso a este grupo',
                ], 403);
            }

            // Buscar especialidade
            $specialty = null;
            $specialtyId = null;
            if ($doctor->specialty) {
                $specialtyData = DB::table('medical_specialties')
                    ->where('name', $doctor->specialty)
                    ->select('id', 'name')
                    ->first();
                if ($specialtyData) {
                    $specialty = [
                        'id' => $specialtyData->id,
                        'name' => $specialtyData->name,
                    ];
                    $specialtyId = $specialtyData->id;
                } else {
                    $specialty = [
                        'id' => null,
                        'name' => $doctor->specialty,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'crm' => $doctor->crm ?? null,
                    'medical_specialty' => $specialty,
                    'medical_specialty_id' => $specialtyId,
                    'phone' => $doctor->phone ?? null,
                    'email' => $doctor->email ?? null,
                    'address' => $doctor->address ?? null,
                    'notes' => $doctor->notes ?? null,
                    'is_primary' => (bool) ($doctor->is_primary ?? false),
                    'group_id' => $doctor->group_id,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar médico: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar médico',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Criar um novo médico para um grupo
     * POST /api/doctors
     * Cria um médico simples na tabela doctors (não registra como usuário)
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            // Validação para médico simples de grupo
            $validated = $request->validate([
                'group_id' => 'required|integer|exists:groups,id',
                'name' => 'required|string|max:255',
                'medical_specialty_id' => 'nullable|integer|exists:medical_specialties,id',
                'crm' => 'nullable|string|max:20',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|string|email|max:255',
                'address' => 'nullable|string|max:1000',
                'notes' => 'nullable|string',
                'is_primary' => 'nullable|boolean',
            ], [
                'group_id.required' => 'O grupo é obrigatório.',
                'group_id.exists' => 'Grupo inválido ou inexistente.',
                'name.required' => 'O nome do médico é obrigatório.',
                'name.max' => 'O nome pode ter no máximo 255 caracteres.',
                'medical_specialty_id.exists' => 'A especialidade selecionada não é válida.',
                'crm.max' => 'O CRM pode ter no máximo 20 caracteres.',
                'phone.max' => 'O telefone pode ter no máximo 20 caracteres (use +55 e o número).',
                'email.email' => 'Informe um e-mail válido.',
                'address.max' => 'O endereço pode ter no máximo 1000 caracteres.',
                'is_primary.boolean' => 'O campo médico principal é inválido.',
            ]);

            // Verificar se o usuário tem acesso ao grupo
            $hasAccess = false;
            if (Schema::hasTable('group_members')) {
                $hasAccess = DB::table('group_members')
                    ->where('user_id', $user->id)
                    ->where('group_id', $validated['group_id'])
                    ->exists();
            } else {
                // Fallback: verificar se é criador do grupo
                $hasAccess = DB::table('groups')
                    ->where('id', $validated['group_id'])
                    ->where('created_by', $user->id)
                    ->exists();
            }
            
            if (!$hasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem acesso a este grupo',
                ], 403);
            }

            // Buscar nome da especialidade se medical_specialty_id foi informado
            $specialtyName = null;
            $specialtyId = null;
            if ($validated['medical_specialty_id']) {
                $specialtyData = DB::table('medical_specialties')
                    ->where('id', $validated['medical_specialty_id'])
                    ->select('id', 'name')
                    ->first();
                if ($specialtyData) {
                    $specialtyName = $specialtyData->name;
                    $specialtyId = $specialtyData->id;
                }
            }

            // Criar médico na tabela doctors
            $doctorData = [
                'group_id' => $validated['group_id'],
                'name' => $validated['name'],
                'specialty' => $specialtyName, // Usar specialty (string) ao invés de medical_specialty_id
                'crm' => $validated['crm'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? null,
                'address' => $validated['address'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'is_primary' => $validated['is_primary'] ?? false,
            ];

            // Verificar se a tabela doctors existe
            if (!Schema::hasTable('doctors')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tabela de médicos não configurada',
                ], 500);
            }

            $doctor = Doctor::create($doctorData);

            return response()->json([
                'success' => true,
                'message' => 'Médico cadastrado com sucesso',
                'data' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'crm' => $doctor->crm,
                    'medical_specialty' => $specialtyId ? [
                        'id' => $specialtyId,
                        'name' => $specialtyName,
                    ] : null,
                    'medical_specialty_id' => $specialtyId,
                    'phone' => $doctor->phone,
                    'email' => $doctor->email,
                    'address' => $doctor->address,
                    'notes' => $doctor->notes,
                    'is_primary' => (bool) $doctor->is_primary,
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erro ao criar médico: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao criar médico',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Atualizar um médico existente
     * PUT /api/doctors/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            // Validação
            $validated = $request->validate([
                'group_id' => 'sometimes|required|integer|exists:groups,id',
                'name' => 'sometimes|required|string|max:255',
                'medical_specialty_id' => 'nullable|integer|exists:medical_specialties,id',
                'crm' => 'nullable|string|max:20',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|string|email|max:255',
                'address' => 'nullable|string|max:1000',
                'notes' => 'nullable|string',
                'is_primary' => 'nullable|boolean',
            ], [
                'group_id.required' => 'O grupo é obrigatório.',
                'group_id.exists' => 'Grupo inválido ou inexistente.',
                'name.required' => 'O nome do médico é obrigatório.',
                'name.max' => 'O nome pode ter no máximo 255 caracteres.',
                'medical_specialty_id.exists' => 'A especialidade selecionada não é válida.',
                'crm.max' => 'O CRM pode ter no máximo 20 caracteres.',
                'phone.max' => 'O telefone pode ter no máximo 20 caracteres (use +55 e o número).',
                'email.email' => 'Informe um e-mail válido.',
                'address.max' => 'O endereço pode ter no máximo 1000 caracteres.',
                'is_primary.boolean' => 'O campo médico principal é inválido.',
            ]);

            // Verificar se o médico existe na tabela doctors
            if (!Schema::hasTable('doctors')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tabela de médicos não configurada',
                ], 500);
            }

            $doctor = Doctor::find($id);
            
            if (!$doctor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Médico não encontrado',
                ], 404);
            }

            // Verificar se o usuário tem acesso ao grupo do médico
            $hasAccess = false;
            if (Schema::hasTable('group_members')) {
                $hasAccess = DB::table('group_members')
                    ->where('user_id', $user->id)
                    ->where('group_id', $doctor->group_id)
                    ->exists();
            } else {
                // Fallback: verificar se é criador do grupo
                $hasAccess = DB::table('groups')
                    ->where('id', $doctor->group_id)
                    ->where('created_by', $user->id)
                    ->exists();
            }
            
            if (!$hasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem acesso a este grupo',
                ], 403);
            }

            // Se group_id foi fornecido e é diferente, verificar acesso ao novo grupo também
            if (isset($validated['group_id']) && $validated['group_id'] != $doctor->group_id) {
                $hasAccessToNewGroup = false;
                if (Schema::hasTable('group_members')) {
                    $hasAccessToNewGroup = DB::table('group_members')
                        ->where('user_id', $user->id)
                        ->where('group_id', $validated['group_id'])
                        ->exists();
                } else {
                    $hasAccessToNewGroup = DB::table('groups')
                        ->where('id', $validated['group_id'])
                        ->where('created_by', $user->id)
                        ->exists();
                }
                
                if (!$hasAccessToNewGroup) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem acesso ao grupo informado',
                    ], 403);
                }
            }

            // Buscar nome da especialidade se medical_specialty_id foi informado
            $specialtyName = null;
            $specialtyId = null;
            if (isset($validated['medical_specialty_id']) && $validated['medical_specialty_id']) {
                $specialtyData = DB::table('medical_specialties')
                    ->where('id', $validated['medical_specialty_id'])
                    ->select('id', 'name')
                    ->first();
                if ($specialtyData) {
                    $specialtyName = $specialtyData->name;
                    $specialtyId = $specialtyData->id;
                }
            } elseif (isset($validated['medical_specialty_id']) && $validated['medical_specialty_id'] === null) {
                // Se foi explicitamente passado null, limpar a especialidade
                $specialtyName = null;
                $specialtyId = null;
            }

            // Preparar dados para atualização
            $updateData = [];
            
            if (isset($validated['name'])) {
                $updateData['name'] = $validated['name'];
            }
            
            if (isset($validated['group_id'])) {
                $updateData['group_id'] = $validated['group_id'];
            }
            
            if (isset($validated['crm'])) {
                $updateData['crm'] = $validated['crm'];
            }
            
            if (isset($validated['phone'])) {
                $updateData['phone'] = $validated['phone'];
            }
            
            if (isset($validated['email'])) {
                $updateData['email'] = $validated['email'];
            }
            
            if (isset($validated['address'])) {
                $updateData['address'] = $validated['address'];
            }
            
            if (isset($validated['notes'])) {
                $updateData['notes'] = $validated['notes'];
            }
            
            if (isset($validated['is_primary'])) {
                $updateData['is_primary'] = $validated['is_primary'];
            }
            
            // Atualizar especialidade se foi informada
            if ($specialtyName !== null || (isset($validated['medical_specialty_id']) && $validated['medical_specialty_id'] === null)) {
                $updateData['specialty'] = $specialtyName;
            }

            // Atualizar médico
            $doctor->update($updateData);
            $doctor->refresh();

            // Buscar especialidade atualizada para resposta
            $responseSpecialty = null;
            $responseSpecialtyId = null;
            if ($doctor->specialty) {
                $specialtyData = DB::table('medical_specialties')
                    ->where('name', $doctor->specialty)
                    ->select('id', 'name')
                    ->first();
                if ($specialtyData) {
                    $responseSpecialty = [
                        'id' => $specialtyData->id,
                        'name' => $specialtyData->name,
                    ];
                    $responseSpecialtyId = $specialtyData->id;
                } else {
                    $responseSpecialty = [
                        'id' => null,
                        'name' => $doctor->specialty,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Médico atualizado com sucesso',
                'data' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'crm' => $doctor->crm,
                    'medical_specialty' => $responseSpecialty,
                    'medical_specialty_id' => $responseSpecialtyId,
                    'phone' => $doctor->phone,
                    'email' => $doctor->email,
                    'address' => $doctor->address,
                    'notes' => $doctor->notes,
                    'is_primary' => (bool) $doctor->is_primary,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar médico: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar médico',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Deletar um médico
     * DELETE /api/doctors/{id}
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado',
                ], 401);
            }

            // Verificar se o médico existe na tabela doctors
            if (!Schema::hasTable('doctors')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tabela de médicos não configurada',
                ], 500);
            }

            $doctor = Doctor::find($id);
            
            if (!$doctor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Médico não encontrado',
                ], 404);
            }

            // Verificar se o usuário tem acesso ao grupo do médico
            $hasAccess = false;
            if (Schema::hasTable('group_members')) {
                $hasAccess = DB::table('group_members')
                    ->where('user_id', $user->id)
                    ->where('group_id', $doctor->group_id)
                    ->exists();
            } else {
                // Fallback: verificar se é criador do grupo
                $hasAccess = DB::table('groups')
                    ->where('id', $doctor->group_id)
                    ->where('created_by', $user->id)
                    ->exists();
            }
            
            if (!$hasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem acesso a este grupo',
                ], 403);
            }

            // Deletar médico
            $doctor->delete();

            return response()->json([
                'success' => true,
                'message' => 'Médico deletado com sucesso',
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar médico: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao deletar médico',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cursos e certificações (tabela caregiver_courses) por users.id — mesmos dados do cadastro profissional.
     *
     * @param  array<int>  $userIds
     * @return array<int, array<int, array{name: string, institution: string, year: int|null, description: string|null, certificate_url: string|null}>>
     */
    private function batchCaregiverCoursesByUserIds(array $userIds): array
    {
        $userIds = array_values(array_unique(array_filter(array_map('intval', $userIds), fn ($id) => $id > 0)));
        if ($userIds === [] || ! Schema::hasTable('caregiver_courses')) {
            return [];
        }

        $rows = DB::table('caregiver_courses')
            ->whereIn('user_id', $userIds)
            ->orderByDesc('year')
            ->orderBy('name')
            ->get(['user_id', 'name', 'institution', 'year', 'description', 'certificate_url']);

        $map = [];
        foreach ($rows as $r) {
            $uid = (int) $r->user_id;
            if (! isset($map[$uid])) {
                $map[$uid] = [];
            }
            $map[$uid][] = [
                'name' => $r->name,
                'institution' => $r->institution,
                'year' => $r->year !== null ? (int) $r->year : null,
                'description' => $r->description,
                'certificate_url' => $r->certificate_url,
            ];
        }

        return $map;
    }

    /**
     * Próximo horário futuro a partir do JSON users.availability (telelista / filtros).
     */
    /**
     * @param  array<string, true>  $occupiedSlotKeyMap  chaves Y-m-d H:i já marcadas (outros pacientes / grupos)
     */
    private function earliestFutureSlotFromUserAvailability(object $user, string $timezone, array $occupiedSlotKeyMap = []): ?Carbon
    {
        $raw = $user->availability ?? null;
        $parsed = is_string($raw) ? json_decode($raw, true) : null;
        if (!is_array($parsed)) {
            $parsed = ['availableDays' => [], 'daySchedules' => []];
        }

        $days = $parsed['availableDays'] ?? [];
        $schedules = $parsed['daySchedules'] ?? [];

        return $this->minSlotFromDaysAndSchedules($days, $schedules, Carbon::now($timezone), $timezone, $occupiedSlotKeyMap);
    }

    /**
     * Normaliza chaves de data da agenda (Y-m-d) no fuso informado.
     */
    private function normalizeAvailabilityDateKey($raw, string $timezone): ?string
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        try {
            return Carbon::parse(trim((string) $raw), $timezone)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Próximo slot a partir do JSON: considera a união de availableDays com as chaves de daySchedules
     * (evita falso "sem horários" quando há horários hoje em daySchedules mas o dia faltou em availableDays).
     */
    /**
     * @param  array<string, true>  $occupiedSlotKeyMap
     */
    private function minSlotFromDaysAndSchedules(array $availableDays, array $daySchedules, Carbon $now, string $timezone, array $occupiedSlotKeyMap = []): ?Carbon
    {
        $today = $now->format('Y-m-d');
        $datesToScan = [];

        foreach ($availableDays as $d) {
            $n = $this->normalizeAvailabilityDateKey($d, $timezone);
            if ($n !== null) {
                $datesToScan[$n] = true;
            }
        }
        foreach (array_keys($daySchedules) as $k) {
            $n = $this->normalizeAvailabilityDateKey($k, $timezone);
            if ($n !== null) {
                $datesToScan[$n] = true;
            }
        }

        $sortedDates = array_keys($datesToScan);
        sort($sortedDates);

        $best = null;

        foreach ($sortedDates as $date) {
            if ($date < $today) {
                continue;
            }

            $timesForDate = [];
            foreach ($daySchedules as $rawKey => $times) {
                if (!is_array($times)) {
                    continue;
                }
                $nk = $this->normalizeAvailabilityDateKey($rawKey, $timezone);
                if ($nk !== $date) {
                    continue;
                }
                foreach ($times as $t) {
                    $timesForDate[] = $t;
                }
            }

            foreach ($timesForDate as $time) {
                $timeStr = is_string($time) ? $time : (string) $time;
                $timeStr = strlen($timeStr) >= 5 ? substr($timeStr, 0, 5) : $timeStr;
                try {
                    $slot = Carbon::parse($date.' '.$timeStr, $timezone);
                } catch (\Exception $e) {
                    continue;
                }
                if ($date === $today && $slot->lt($now)) {
                    continue;
                }
                $slotKey = $slot->copy()->timezone($timezone)->format('Y-m-d H:i');
                if (! empty($occupiedSlotKeyMap[$slotKey])) {
                    continue;
                }
                if ($best === null || $slot->lt($best)) {
                    $best = $slot;
                }
            }
        }

        return $best;
    }

    /**
     * @param  array<int, array<string, true>>  $occupiedByPlatformUserId
     * @return array<int, Carbon>
     */
    private function batchEarliestSlotsFromDoctorAvailabilityTable(array $doctorIds, Carbon $now, string $timezone, array $occupiedByPlatformUserId = []): array
    {
        $result = [];
        if ($doctorIds === [] || !Schema::hasTable('doctor_availability') || !Schema::hasTable('doctor_availability_times')) {
            return $result;
        }

        $today = $now->format('Y-m-d');
        $rows = DB::table('doctor_availability as da')
            ->join('doctor_availability_times as dat', 'dat.availability_id', '=', 'da.id')
            ->whereIn('da.doctor_id', $doctorIds)
            ->where('da.date', '>=', $today)
            ->orderBy('da.date')
            ->orderBy('dat.time')
            ->select('da.doctor_id', 'da.date', 'dat.time')
            ->get();

        foreach ($rows as $r) {
            $did = (int) $r->doctor_id;
            if (isset($result[$did])) {
                continue;
            }
            $dateStr = $r->date instanceof Carbon ? $r->date->format('Y-m-d') : (string) $r->date;
            $t = $r->time;
            if ($t instanceof Carbon) {
                $timeStr = $t->format('H:i');
            } else {
                $timeStr = is_string($t) ? substr($t, 0, 5) : substr((string) $t, 0, 5);
            }
            try {
                $slot = Carbon::parse($dateStr.' '.$timeStr, $timezone);
            } catch (\Exception $e) {
                continue;
            }
            if ($dateStr === $today && $slot->lt($now)) {
                continue;
            }
            $occ = $occupiedByPlatformUserId[$did] ?? [];
            $slotKey = $slot->copy()->timezone($timezone)->format('Y-m-d H:i');
            if (! empty($occ[$slotKey])) {
                continue;
            }
            $result[$did] = $slot;
        }

        return $result;
    }

    /**
     * Remove da agenda horários já ocupados por teleconsulta (mesma regra de AppointmentController).
     * Dias que ficarem sem horários são omitidos de availableDays.
     *
     * @param  array{availableDays: array<int, string>, daySchedules: array<string, array<int, mixed>>}  $filteredAvailability
     * @return array{availableDays: array<int, string>, daySchedules: array<string, array<int, mixed>>}
     */
    private function excludeBookedTeleconsultSlots(int $platformDoctorUserId, array $filteredAvailability, string $timezone): array
    {
        $days = $filteredAvailability['availableDays'] ?? [];
        $schedules = $filteredAvailability['daySchedules'] ?? [];
        $newDays = [];
        $newSchedules = [];

        $occupied = Appointment::teleconsultationOccupiedSlotKeyMap($platformDoctorUserId, $timezone);

        foreach ($days as $date) {
            $times = $schedules[$date] ?? [];
            $free = [];
            foreach ($times as $timeRaw) {
                $timeStr = is_string($timeRaw) ? $timeRaw : (string) $timeRaw;
                $timeStr = strlen($timeStr) >= 5 ? substr($timeStr, 0, 5) : $timeStr;
                try {
                    $slot = Carbon::parse($date.' '.$timeStr, $timezone);
                } catch (\Exception $e) {
                    continue;
                }
                $slotKey = $slot->copy()->timezone($timezone)->format('Y-m-d H:i');
                if (! empty($occupied[$slotKey])) {
                    continue;
                }
                $free[] = $timeRaw;
            }
            if (count($free) > 0) {
                $newDays[] = $date;
                $newSchedules[$date] = array_values($free);
            }
        }

        return [
            'availableDays' => array_values($newDays),
            'daySchedules' => $newSchedules,
        ];
    }
}
