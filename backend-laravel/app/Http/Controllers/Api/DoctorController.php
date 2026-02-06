<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Doctor;

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
                    
                    $doctorsFromGroup = DB::table('doctors')
                        ->where('group_id', $groupId)
                        ->get();
                    
                    Log::info('DoctorController.index - Médicos encontrados na tabela doctors', [
                        'count' => $doctorsFromGroup->count(),
                        'doctors' => $doctorsFromGroup->map(fn($d) => ['id' => $d->id, 'name' => $d->name, 'specialty' => $d->specialty])->toArray()
                    ]);
                    
                    $doctorsFromGroup = $doctorsFromGroup->map(function ($doctor) {
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
                            
                            return [
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
                            ];
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
                            $doctorsFromTable = DB::table('doctors')
                                ->whereIn('id', $uniqueDoctorIds)
                                ->get()
                                ->map(function ($doctor) {
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
                                    
                                    return [
                                        'id' => $doctor->id,
                                        'name' => $doctor->name,
                                        'crm' => $doctor->crm ?? null,
                                        'medical_specialty' => $specialty,
                                        'medical_specialty_id' => $doctor->medical_specialty_id,
                                        'is_primary' => (bool) ($doctor->is_primary ?? false),
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
                    
                    // Verificar se a coluna is_active existe antes de filtrar
                    if (Schema::hasColumn('users', 'is_active')) {
                        $query->where('is_active', 1);
                    }
                    
                    // Selecionar colunas que existem na tabela users
                    $selectColumns = ['id', 'name', 'email', 'crm', 'phone', 'profile_photo'];
                    
                    $platformUsers = $query->select($selectColumns)->get();
                    
                    foreach ($platformUsers as $user) {
                        // Buscar especialidade (não há medical_specialty_id na tabela users)
                        $specialty = null;
                        $specialtyId = null;
                        
                        // Construir URL da foto se houver
                        $photoUrl = null;
                        if ($user->profile_photo) {
                            // Construir URL completa da foto
                            $photoUrl = url('storage/' . $user->profile_photo);
                        }
                        
                        $platformDoctors[] = [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'crm' => $user->crm ?? null,
                            'phone' => $user->phone ?? null,
                            'medical_specialty' => $specialty,
                            'medical_specialty_id' => $specialtyId,
                            'photo' => $user->profile_photo ?? null,
                            'photo_url' => $photoUrl,
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
                        $existingIsGroup = $doctorsMap[$doctorId]['is_group_doctor'] ?? false;
                        $newIsGroup = $doctor['is_group_doctor'] ?? false;
                        
                        if ($newIsGroup && !$existingIsGroup) {
                            // Novo é do grupo e existente não é, substituir
                            $doctorsMap[$doctorId] = $doctor;
                        }
                        // Caso contrário, manter o existente
                    }
                }
                $doctors = array_values($doctorsMap);
                
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
    public function getAvailability($id)
    {
        try {
            $doctor = User::where("id", $id)->where("profile", "doctor")->firstOrFail();
            $availabilityRaw = $doctor->availability ?? "{}";
            $availability = json_decode($availabilityRaw, true);
            
            Log::info("DoctorController.getAvailability - Dados brutos", [
                'doctor_id' => $id,
                'availability_raw' => $availabilityRaw,
                'availability_decoded' => $availability,
                'is_array' => is_array($availability),
            ]);
            
            if (!$availability || !is_array($availability)) {
                $availability = ["availableDays" => [], "daySchedules" => []];
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
                            $timeHour = (int)substr($time, 0, 2);
                            $timeMinute = (int)substr($time, 3, 2);
                            $timeTotalMinutes = $timeHour * 60 + $timeMinute;
                            
                            // Incluir se for futuro ou se passou há menos de 2 horas
                            $diffMinutes = $currentTotalMinutes - $timeTotalMinutes;
                            return $diffMinutes <= 120; // 2 horas = 120 minutos
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
            
            // Salvar disponibilidade
            $doctor->availability = json_encode($availabilityData);
            $doctor->save();
            
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
                'address' => 'nullable|string|max:500',
                'notes' => 'nullable|string',
                'is_primary' => 'nullable|boolean',
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
}
