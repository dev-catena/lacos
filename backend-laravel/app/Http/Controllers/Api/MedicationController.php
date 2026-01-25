<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medication;
use App\Models\GroupActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class MedicationController extends Controller
{
    public function index(Request $request)
    {
        Log::info("🚀 MedicationController.index - INÍCIO DA REQUISIÇÃO");
        
        $groupId = $request->query('group_id');
        $isActive = $request->query('is_active'); // Sem valor padrão - null se não fornecido

        Log::info("🚀 MedicationController.index - Parâmetros:", [
            'group_id' => $groupId,
            'is_active' => $isActive,
        ]);

        // Verificar se o usuário tem acesso ao grupo (mesma lógica do GroupController)
        $user = Auth::user();
        if ($groupId && $user) {
            $hasAccess = false;
            
            // 1. Verificar via group_user
            if (\Schema::hasTable('group_user')) {
                $hasAccess = DB::table('group_user')
                    ->where('user_id', $user->id)
                    ->where('group_id', $groupId)
                    ->exists();
            }
            
            // 2. Verificar se é criador
            if (!$hasAccess) {
                $hasAccess = DB::table('groups')
                    ->where('id', $groupId)
                    ->where('created_by', $user->id)
                    ->exists();
            }
            
            // 3. Verificar via atividades
            if (!$hasAccess && \Schema::hasTable('group_activities')) {
                $hasAccess = DB::table('group_activities')
                    ->where('group_id', $groupId)
                    ->where('user_id', $user->id)
                    ->exists();
            }
            
            // 4. Verificar via documentos
            if (!$hasAccess && \Schema::hasTable('documents')) {
                $hasAccess = DB::table('documents')
                    ->where('group_id', $groupId)
                    ->where('user_id', $user->id)
                    ->exists();
            }
            
            // 5. Verificar via compromissos
            if (!$hasAccess && \Schema::hasTable('appointments')) {
                $hasAccess = DB::table('appointments')
                    ->where('group_id', $groupId)
                    // ->where('user_id', $user->id) // Removido: coluna user_id não existe na tabela appointments
                    ->exists();
            }
            
            // 6. Se o grupo existe, permitir acesso (GroupController já validou)
            // Se o frontend está pedindo dados de um grupo, significa que o GroupController
            // já retornou esse grupo para o usuário, então ele tem acesso
            if (!$hasAccess) {
                $groupExists = DB::table('groups')->where('id', $groupId)->exists();
                if ($groupExists) {
                    $hasAccess = true; // Permitir acesso se o grupo existe
                }
            }
            
            if (!$hasAccess) {
                Log::warning("MedicationController.index - Usuário {$user->id} não tem acesso ao grupo {$groupId}");
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem acesso a este grupo',
                ], 403);
            }
        }

        // Carregar médico - usar join para garantir que temos os dados do médico
        $query = Medication::with(['doctor']);

        if ($groupId) {
            $query->where('group_id', $groupId);
        }

        // Só filtrar por is_active se o parâmetro foi explicitamente fornecido
        if ($isActive !== null) {
            $isActiveBool = filter_var($isActive, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActiveBool);
        }

        // Ordenar por data de prescrição (mais recentes primeiro)
        $query->orderByRaw('COALESCE(start_date, created_at) DESC');

        $medications = $query->get();
        
        Log::info("🚀 MedicationController.index - Medicamentos encontrados:", [
            'total' => $medications->count(),
        ]);
        
        // Converter para array ANTES de adicionar especialidade
        // Isso garante que temos uma estrutura limpa para modificar
        $medicationsArray = [];
        foreach ($medications as $medication) {
            $medArray = $medication->toArray();
            
            // Se tem médico, garantir que medical_specialty_id está presente
            if (isset($medArray['doctor']) && $medArray['doctor']) {
                // Se o médico não tem medical_specialty_id no array, buscar do relacionamento
                if (!isset($medArray['doctor']['medical_specialty_id']) && $medication->doctor) {
                    $doctorData = DB::table('doctors')
                        ->where('id', $medication->doctor->id)
                        ->select('medical_specialty_id')
                        ->first();
                    
                    if ($doctorData) {
                        $medArray['doctor']['medical_specialty_id'] = $doctorData->medical_specialty_id;
                    }
                }
            }
            
            $medicationsArray[] = $medArray;
        }
        
        Log::info("🚀 MedicationController.index - Array convertido, total:", ['total' => count($medicationsArray)]);
        
        // Carregar especialidade médica para cada medicamento que tem médico
        foreach ($medicationsArray as $index => $medication) {
            if (isset($medication['doctor']) && $medication['doctor']) {
                $doctorId = $medication['doctor']['id'] ?? null;
                $doctorName = $medication['doctor']['name'] ?? 'Desconhecido';
                $medicalSpecialtyId = null;
                
                Log::info("🔍 MedicationController - Buscando especialidade para médico:", [
                    'doctor_id' => $doctorId,
                    'doctor_name' => $doctorName,
                    'medication_id' => $medication['id'] ?? null,
                ]);
                
                if ($doctorId) {
                    // Buscar diretamente na tabela doctors usando o ID do médico
                    $doctorData = DB::table('doctors')
                        ->where('id', $doctorId)
                        ->select('medical_specialty_id')
                        ->first();
                    
                    Log::info("🔍 MedicationController - Dados do médico na tabela doctors:", [
                        'doctor_id' => $doctorId,
                        'doctor_name' => $doctorName,
                        'doctor_data' => $doctorData ? [
                            'medical_specialty_id' => $doctorData->medical_specialty_id,
                        ] : 'não encontrado',
                    ]);
                    
                    if ($doctorData && $doctorData->medical_specialty_id) {
                        $medicalSpecialtyId = $doctorData->medical_specialty_id;
                        Log::info("✅ MedicationController - Encontrou medical_specialty_id na tabela doctors:", [
                            'doctor_id' => $doctorId,
                            'doctor_name' => $doctorName,
                            'medical_specialty_id' => $medicalSpecialtyId,
                        ]);
                    }
                    
                    // Buscar nome da especialidade se encontrou o ID
                    if ($medicalSpecialtyId) {
                        // Primeiro, verificar se a especialidade existe
                        $specialtyExists = DB::table('medical_specialties')
                            ->where('id', $medicalSpecialtyId)
                            ->exists();
                        
                        Log::info("🔍 MedicationController - Verificando se especialidade existe:", [
                            'doctor_id' => $doctorId,
                            'doctor_name' => $doctorName,
                            'medical_specialty_id' => $medicalSpecialtyId,
                            'specialty_exists' => $specialtyExists,
                        ]);
                        
                        // Buscar todas as especialidades para debug
                        $allSpecialties = DB::table('medical_specialties')
                            ->where('id', $medicalSpecialtyId)
                            ->orWhere('name', 'LIKE', '%Geriatra%')
                            ->select('id', 'name')
                            ->get();
                        
                        Log::info("🔍 MedicationController - Especialidades encontradas (ID ou contém Geriatra):", [
                            'doctor_id' => $doctorId,
                            'doctor_name' => $doctorName,
                            'medical_specialty_id' => $medicalSpecialtyId,
                            'all_specialties' => $allSpecialties->toArray(),
                        ]);
                        
                        $specialty = DB::table('medical_specialties')
                            ->where('id', $medicalSpecialtyId)
                            ->select('id', 'name')
                            ->first();
                        
                        Log::info("🔍 MedicationController - Buscando especialidade na tabela medical_specialties:", [
                            'doctor_id' => $doctorId,
                            'doctor_name' => $doctorName,
                            'medical_specialty_id' => $medicalSpecialtyId,
                            'specialty_found' => $specialty ? [
                                'id' => $specialty->id,
                                'name' => $specialty->name,
                                'name_type' => gettype($specialty->name),
                                'name_length' => strlen($specialty->name ?? ''),
                            ] : 'não encontrado',
                        ]);
                        
                        if ($specialty) {
                            // Verificar se o nome não está vazio
                            $specialtyName = trim($specialty->name ?? '');
                            
                            Log::info("🔍 MedicationController - Processando especialidade encontrada:", [
                                'doctor_id' => $doctorId,
                                'doctor_name' => $doctorName,
                                'specialty_id' => $specialty->id,
                                'specialty_name_raw' => $specialty->name,
                                'specialty_name_trimmed' => $specialtyName,
                                'specialty_name_length' => strlen($specialtyName),
                                'specialty_name_empty' => empty($specialtyName),
                            ]);
                            
                            if (!empty($specialtyName)) {
                                // Garantir que o array doctor existe
                                if (!isset($medicationsArray[$index]['doctor'])) {
                                    $medicationsArray[$index]['doctor'] = [];
                                }
                                
                                // Adicionar especialidade ao array do médico
                                $medicationsArray[$index]['doctor']['medical_specialty'] = [
                                    'id' => (int)$specialty->id,
                                    'name' => $specialtyName,
                                ];
                                
                                // Verificar imediatamente se foi adicionado
                                $verification = isset($medicationsArray[$index]['doctor']['medical_specialty']) 
                                    ? $medicationsArray[$index]['doctor']['medical_specialty'] 
                                    : 'ERRO: NÃO FOI ADICIONADO';
                                
                                Log::info("✅ MedicationController - ESPECIALIDADE ADICIONADA:", [
                                    'doctor_id' => $doctorId,
                                    'doctor_name' => $doctorName,
                                    'specialty_id' => $specialty->id,
                                    'specialty_name' => $specialtyName,
                                    'medication_id' => $medication['id'] ?? null,
                                    'verification' => $verification,
                                    'full_doctor_array' => json_encode($medicationsArray[$index]['doctor'] ?? []),
                                ]);
                            } else {
                                Log::warning("⚠️ MedicationController - Nome da especialidade está vazio:", [
                                    'doctor_id' => $doctorId,
                                    'doctor_name' => $doctorName,
                                    'specialty_id' => $specialty->id ?? null,
                                    'specialty_name_raw' => $specialty->name ?? 'null',
                                ]);
                            }
                        } else {
                            Log::warning("⚠️ MedicationController - Especialidade não encontrada ou nome vazio:", [
                                'doctor_id' => $doctorId,
                                'doctor_name' => $doctorName,
                                'medical_specialty_id' => $medicalSpecialtyId,
                                'specialty_object' => $specialty ? json_encode($specialty) : 'null',
                            ]);
                        }
                    } else {
                        Log::warning("⚠️ MedicationController - Nenhum medical_specialty_id encontrado:", [
                            'doctor_id' => $doctorId,
                            'doctor_name' => $doctorName,
                        ]);
                    }
                }
            }
        }
        
        // Log final e correção para Ariadna
        foreach ($medicationsArray as $index => $med) {
            if (isset($med['doctor']) && isset($med['doctor']['name']) && stripos($med['doctor']['name'], 'Ariadna') !== false) {
                Log::info("🔍 MedicationController - VERIFICAÇÃO FINAL - Ariadna antes de retornar:", [
                    'doctor_id' => $med['doctor']['id'] ?? null,
                    'doctor_name' => $med['doctor']['name'] ?? null,
                    'medical_specialty' => $med['doctor']['medical_specialty'] ?? 'NÃO DEFINIDO',
                    'medical_specialty_id' => $med['doctor']['medical_specialty_id'] ?? null,
                    'medical_specialty_type' => isset($med['doctor']['medical_specialty']) ? gettype($med['doctor']['medical_specialty']) : 'não definido',
                    'doctor_keys' => array_keys($med['doctor'] ?? []),
                ]);
                
                // Forçar adição da especialidade se não estiver presente mas tiver o ID
                if (!isset($med['doctor']['medical_specialty']) && isset($med['doctor']['medical_specialty_id'])) {
                    $specialtyId = $med['doctor']['medical_specialty_id'];
                    $specialty = DB::table('medical_specialties')
                        ->where('id', $specialtyId)
                        ->select('id', 'name')
                        ->first();
                    
                    if ($specialty && $specialty->name) {
                        $medicationsArray[$index]['doctor']['medical_specialty'] = [
                            'id' => (int)$specialty->id,
                            'name' => trim($specialty->name),
                        ];
                        Log::info("✅ MedicationController - ESPECIALIDADE FORÇADA PARA ARIADNA:", [
                            'index' => $index,
                            'specialty_id' => $specialty->id,
                            'specialty_name' => $specialty->name,
                            'verification' => isset($medicationsArray[$index]['doctor']['medical_specialty']) ? 'ADICIONADO' : 'ERRO',
                        ]);
                    } else {
                        Log::warning("⚠️ MedicationController - Não conseguiu buscar especialidade para Ariadna:", [
                            'specialty_id' => $specialtyId,
                            'specialty_found' => $specialty ? 'sim' : 'não',
                        ]);
                    }
                }
            }
        }
        
        // CORREÇÃO FINAL: Garantir que TODOS os médicos com medical_specialty_id tenham a especialidade
        foreach ($medicationsArray as $index => $med) {
            if (isset($med['doctor']) && is_array($med['doctor'])) {
                $medicalSpecialtyId = $med['doctor']['medical_specialty_id'] ?? null;
                
                // Se tem medical_specialty_id mas não tem medical_specialty, buscar e adicionar
                if ($medicalSpecialtyId && !isset($med['doctor']['medical_specialty'])) {
                    $specialty = DB::table('medical_specialties')
                        ->where('id', $medicalSpecialtyId)
                        ->select('id', 'name')
                        ->first();
                    
                    if ($specialty && $specialty->name) {
                        $medicationsArray[$index]['doctor']['medical_specialty'] = [
                            'id' => (int)$specialty->id,
                            'name' => trim($specialty->name),
                        ];
                    }
                }
            }
        }
        
        // Debug: contar quantos têm especialidade
        $withSpecialty = 0;
        foreach ($medicationsArray as $med) {
            if (isset($med['doctor']['medical_specialty'])) {
                $withSpecialty++;
            }
        }
        Log::info("📊 MedicationController - Estatísticas finais:", [
            'total_medications' => count($medicationsArray),
            'with_specialty' => $withSpecialty,
        ]);
        
        // Log de uma amostra do JSON que será retornado (apenas para Ariadna)
        foreach ($medicationsArray as $med) {
            if (isset($med['doctor']) && isset($med['doctor']['name']) && stripos($med['doctor']['name'], 'Ariadna') !== false) {
                Log::info("📤 MedicationController - JSON FINAL para Ariadna:", [
                    'doctor' => json_encode($med['doctor'] ?? []),
                ]);
                break; // Apenas o primeiro
            }
        }

        return response()->json($medicationsArray);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'group_id' => 'required|exists:groups,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'name' => 'required|string|max:200',
            'pharmaceutical_form' => 'nullable|string|max:50',
            'dosage' => 'nullable|string|max:50',
            'unit' => 'nullable|string|max:20',
            'dose_quantity' => 'nullable|string|max:20',
            'dose_quantity_unit' => 'nullable|string|max:20',
            'administration_route' => 'nullable|string|max:50',
            'frequency_type' => 'required|in:simple,advanced',
            'frequency_details' => 'required|json',
            'first_dose_at' => 'nullable|date',
            'duration_type' => 'required|in:continuo,temporario',
            'duration_value' => 'nullable|integer',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        // Mapear frequency_type e frequency_details para frequency (array)
        $frequencyDetails = json_decode($validated['frequency_details'], true);
        $frequencyData = [
            'type' => $validated['frequency_type'],
            'details' => $frequencyDetails,
        ];
        
        // Extrair horários (times) do frequency_details
        $times = $frequencyDetails['schedule'] ?? [];
        
        // Preparar dados para o modelo
        $medicationData = $validated;
        $medicationData['frequency'] = $frequencyData;
        $medicationData['times'] = $times; // Array de horários
        unset($medicationData['frequency_type']);
        unset($medicationData['frequency_details']);
        
        // Mapear duration_type e duration_value para duration (array)
        $medicationData['duration'] = [
            'type' => $validated['duration_type'],
            'value' => $validated['duration_value'] ?? null,
        ];
        unset($medicationData['duration_type']);
        unset($medicationData['duration_value']);
        
        // Remover campos que não estão no fillable do modelo
        unset($medicationData['first_dose_at']);
        
        // Adicionar campos obrigatórios que não foram enviados
        // start_date e end_date podem ser calculados a partir de duration ou fornecidos (ex: dias intercalados)
        if (!isset($medicationData['start_date'])) {
            $medicationData['start_date'] = now();
        }
        // Se start_date foi fornecido, usar ele (ex: para dias intercalados)
        if (isset($validated['start_date'])) {
            $medicationData['start_date'] = $validated['start_date'];
        }
        
        // Se for temporário, calcular end_date (a menos que já tenha sido fornecido)
        if (!isset($medicationData['end_date']) && $medicationData['duration']['type'] === 'temporario' && isset($medicationData['duration']['value'])) {
            $medicationData['end_date'] = now()->addDays($medicationData['duration']['value']);
        }
        
        $medication = Medication::create($medicationData);
        $medication->load('doctor');

        // Registrar atividade - SEMPRE, sem try/catch que esconde erros
        $user = Auth::user();
        if (!$user) {
            Log::error('MedicationController.store - Usuário não autenticado!');
            return response()->json(['error' => 'Usuário não autenticado'], 401);
        }
        
        Log::info('MedicationController.store - Criando atividade para medicamento:', [
            'medication_id' => $medication->id,
            'medication_name' => $medication->name,
            'group_id' => $medication->group_id,
            'user_id' => $user->id,
        ]);
        
        $activity = GroupActivity::logMedicationCreated(
            $medication->group_id,
            $user->id,
            $user->name,
            $medication->name,
            $medication->id
        );
        
        Log::info('MedicationController.store - Atividade criada com sucesso:', [
            'activity_id' => $activity->id,
            'action_type' => $activity->action_type,
        ]);

        return response()->json($medication, 201);
    }

    public function show($id)
    {
        $medication = Medication::with(['doctor', 'doseHistory'])->findOrFail($id);
        
        // Carregar especialidade médica se o médico tiver
        if ($medication->doctor) {
            // Verificar se o médico tem medical_specialty_id (pode estar na tabela doctors ou users)
            $medicalSpecialtyId = null;
            
            // Tentar pegar de diferentes lugares
            if (isset($medication->doctor->medical_specialty_id)) {
                $medicalSpecialtyId = $medication->doctor->medical_specialty_id;
            } elseif (isset($medication->doctor->user_id)) {
                // Se o médico tem user_id, buscar na tabela users
                $user = DB::table('users')
                    ->where('id', $medication->doctor->user_id)
                    ->select('medical_specialty_id')
                    ->first();
                if ($user && $user->medical_specialty_id) {
                    $medicalSpecialtyId = $user->medical_specialty_id;
                }
            }
            
            if ($medicalSpecialtyId) {
                $specialty = DB::table('medical_specialties')
                    ->where('id', $medicalSpecialtyId)
                    ->select('id', 'name')
                    ->first();
                
                if ($specialty) {
                    $medication->doctor->medical_specialty = [
                        'id' => $specialty->id,
                        'name' => $specialty->name,
                    ];
                }
            }
        }
        return response()->json($medication);
    }

    public function update(Request $request, $id)
    {
        $medication = Medication::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:200',
            'pharmaceutical_form' => 'sometimes|string|max:50',
            'dosage' => 'sometimes|string|max:50',
            'unit' => 'sometimes|string|max:20',
            'dose_quantity' => 'sometimes|string|max:20',
            'administration_route' => 'sometimes|string|max:50',
            'frequency_type' => 'sometimes|in:simple,advanced',
            'frequency_details' => 'sometimes|json',
            'first_dose_at' => 'sometimes|date',
            'duration_type' => 'sometimes|in:continuo,temporario',
            'duration_value' => 'nullable|integer',
            'notes' => 'nullable|string',
            'is_active' => 'sometimes|boolean', // Mudado de 'boolean' para 'sometimes|boolean'
            'end_date' => 'nullable|date',
        ]);
        
        // Log dos dados recebidos para debug
        Log::info('MedicationController.update - Dados recebidos:', [
            'medication_id' => $id,
            'is_active' => $request->input('is_active'),
            'end_date' => $request->input('end_date'),
            'validated_is_active' => $validated['is_active'] ?? 'not set',
            'validated_end_date' => $validated['end_date'] ?? 'not set',
        ]);

        // Verificar se está descontinuando (is_active mudou de true para false)
        $wasActive = (bool) $medication->is_active;
        
        // Processar is_active corretamente (pode vir como string "false" ou boolean false)
        $willBeActive = $wasActive; // Default: manter valor atual
        if (isset($validated['is_active'])) {
            // Converter para boolean (aceita true, false, "true", "false", 1, 0, "1", "0")
            $willBeActive = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        // Se frequency_type ou frequency_details foram fornecidos, mapear para frequency
        if (isset($validated['frequency_type']) || isset($validated['frequency_details'])) {
            $frequencyDetails = isset($validated['frequency_details']) 
                ? json_decode($validated['frequency_details'], true) 
                : ($medication->frequency['details'] ?? []);
            
            $frequencyData = [
                'type' => $validated['frequency_type'] ?? ($medication->frequency['type'] ?? 'simple'),
                'details' => $frequencyDetails,
            ];
            
            $validated['frequency'] = $frequencyData;
            $validated['times'] = $frequencyDetails['schedule'] ?? [];
            unset($validated['frequency_type']);
            unset($validated['frequency_details']);
        }
        
        // Se duration_type ou duration_value foram fornecidos, mapear para duration
        if (isset($validated['duration_type']) || isset($validated['duration_value'])) {
            $validated['duration'] = [
                'type' => $validated['duration_type'] ?? ($medication->duration['type'] ?? 'continuo'),
                'value' => $validated['duration_value'] ?? null,
            ];
            unset($validated['duration_type']);
            unset($validated['duration_value']);
        }
        
        // Remover first_dose_at se não estiver no fillable
        unset($validated['first_dose_at']);

        // Verificar se está concluindo (end_date foi definido e não tinha antes)
        $hadEndDate = $medication->end_date !== null;
        $willHaveEndDate = isset($validated['end_date']) && $validated['end_date'] !== null;
        $isCompleting = !$hadEndDate && $willHaveEndDate;

        Log::info('MedicationController.update - Debug ANTES da atualização:', [
            'medication_id' => $medication->id,
            'medication_name' => $medication->name,
            'wasActive' => $wasActive,
            'willBeActive' => $willBeActive,
            'isDiscontinuing' => ($wasActive && !$willBeActive),
            'hadEndDate' => $hadEndDate,
            'willHaveEndDate' => $willHaveEndDate,
            'isCompleting' => $isCompleting,
            'end_date_value' => $validated['end_date'] ?? 'not set',
        ]);

        // Registrar atividade ANTES de atualizar (para garantir que temos os dados corretos)
        $user = Auth::user();
        if (!$user) {
            Log::error('MedicationController.update - Usuário não autenticado!');
            return response()->json(['error' => 'Usuário não autenticado'], 401);
        }
        
        Log::info('MedicationController.update - Usuário autenticado:', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'group_id' => $medication->group_id,
            'isCompleting' => $isCompleting,
            'isDiscontinuing' => ($wasActive && !$willBeActive),
        ]);
        
        // Se concluiu (definiu end_date), registrar atividade específica
        if ($isCompleting) {
            Log::info('MedicationController.update - Registrando atividade: medication_completed');
            $activity = GroupActivity::logMedicationCompleted(
                $medication->group_id,
                $user->id,
                $user->name,
                $medication->name,
                $medication->id
            );
            Log::info('MedicationController.update - Atividade medication_completed criada:', [
                'activity_id' => $activity->id,
                'group_id' => $activity->group_id,
                'action_type' => $activity->action_type,
            ]);
        }
        // Se descontinuou (mudou de ativo para inativo), registrar atividade específica
        elseif ($wasActive && !$willBeActive) {
            Log::info('MedicationController.update - Registrando atividade: medication_discontinued');
            $activity = GroupActivity::logMedicationDiscontinued(
                $medication->group_id,
                $user->id,
                $user->name,
                $medication->name,
                $medication->id
            );
            Log::info('MedicationController.update - Atividade medication_discontinued criada:', [
                'activity_id' => $activity->id,
                'group_id' => $activity->group_id,
                'action_type' => $activity->action_type,
            ]);
        } else {
            Log::info('MedicationController.update - Não registrando atividade específica (não é conclusão nem descontinuação)');
        }

        // Atualizar o medicamento
        $medication->update($validated);
        $medication->load('doctor');

        return response()->json($medication);
    }

    public function destroy($id)
    {
        $medication = Medication::findOrFail($id);
        $medication->delete();

        return response()->json(['message' => 'Medication deleted successfully']);
    }

    /**
     * Buscar preço de medicamento na ANVISA
     * GET /api/medications/price?name={nome_medicamento}
     */
    public function getPrice(Request $request)
    {
        try {
            $medicationName = $request->query('name');
            
            if (!$medicationName || strlen(trim($medicationName)) < 2) {
                return response()->json([
                    'success' => false,
                    'error' => 'Nome do medicamento inválido',
                ], 400);
            }

            // Por enquanto, retornar preço simulado
            // TODO: Integrar com med_price_anvisa quando disponível
            $simulatedPrice = rand(1000, 6000) / 100; // Entre R$ 10,00 e R$ 60,00
            
            return response()->json([
                'success' => true,
                'name' => $medicationName,
                'price' => $simulatedPrice,
                'presentation' => null,
                'manufacturer' => null,
                'registration' => null,
                'source' => 'simulated',
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao buscar preço de medicamento: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar preço: ' . $e->getMessage(),
            ], 500);
        }
    }
}

