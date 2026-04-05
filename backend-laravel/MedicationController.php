<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medication;
use App\Models\GroupActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MedicationController extends Controller
{
    public function index(Request $request)
    {
        $groupId = $request->query('group_id');
        $isActive = $request->query('is_active'); // Sem valor padrão - null se não fornecido

        $query = Medication::with(['doctor']);

        if ($groupId) {
            $query->where('group_id', $groupId);
        }

        // Só filtrar por is_active se o parâmetro foi explicitamente fornecido
        if ($isActive !== null) {
            $isActiveBool = filter_var($isActive, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActiveBool);
        }

        return response()->json($query->get());
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
            \Log::error('MedicationController.store - Usuário não autenticado!');
            return response()->json(['error' => 'Usuário não autenticado'], 401);
        }
        
        \Log::info('MedicationController.store - Criando atividade para medicamento:', [
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
        
        \Log::info('MedicationController.store - Atividade criada com sucesso:', [
            'activity_id' => $activity->id,
            'action_type' => $activity->action_type,
        ]);

        return response()->json($medication, 201);
    }

    public function show($id)
    {
        $medication = Medication::with(['doctor', 'doseHistory'])->findOrFail($id);
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
        \Log::info('MedicationController.update - Dados recebidos:', [
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

        \Log::info('MedicationController.update - Debug ANTES da atualização:', [
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
            \Log::error('MedicationController.update - Usuário não autenticado!');
            return response()->json(['error' => 'Usuário não autenticado'], 401);
        }
        
        \Log::info('MedicationController.update - Usuário autenticado:', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'group_id' => $medication->group_id,
            'isCompleting' => $isCompleting,
            'isDiscontinuing' => ($wasActive && !$willBeActive),
        ]);
        
        // Se concluiu (definiu end_date), registrar atividade específica
        if ($isCompleting) {
            \Log::info('MedicationController.update - Registrando atividade: medication_completed');
            $activity = GroupActivity::logMedicationCompleted(
                $medication->group_id,
                $user->id,
                $user->name,
                $medication->name,
                $medication->id
            );
            \Log::info('MedicationController.update - Atividade medication_completed criada:', [
                'activity_id' => $activity->id,
                'group_id' => $activity->group_id,
                'action_type' => $activity->action_type,
            ]);
        }
        // Se descontinuou (mudou de ativo para inativo), registrar atividade específica
        elseif ($wasActive && !$willBeActive) {
            \Log::info('MedicationController.update - Registrando atividade: medication_discontinued');
            $activity = GroupActivity::logMedicationDiscontinued(
                $medication->group_id,
                $user->id,
                $user->name,
                $medication->name,
                $medication->id
            );
            \Log::info('MedicationController.update - Atividade medication_discontinued criada:', [
                'activity_id' => $activity->id,
                'group_id' => $activity->group_id,
                'action_type' => $activity->action_type,
            ]);
        } else {
            \Log::info('MedicationController.update - Não registrando atividade específica (não é conclusão nem descontinuação)');
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
            \Log::error('Erro ao buscar preço de medicamento: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar preço: ' . $e->getMessage(),
            ], 500);
        }
    }
}

