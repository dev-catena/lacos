<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medication;
use Illuminate\Http\Request;

class MedicationController extends Controller
{
    public function index(Request $request)
    {
        $groupId = $request->query('group_id');
        $isActive = $request->query('is_active', true);

        $query = Medication::with(['doctor']);

        if ($groupId) {
            $query->where('group_id', $groupId);
        }

        if ($isActive !== null) {
            $query->where('is_active', $isActive);
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
            'administration_route' => 'nullable|string|max:50',
            'frequency_type' => 'required|in:simple,advanced',
            'frequency_details' => 'required|json',
            'first_dose_at' => 'nullable|date',
            'duration_type' => 'required|in:continuo,temporario',
            'duration_value' => 'nullable|integer',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
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
        // start_date e end_date podem ser calculados a partir de duration
        if (!isset($medicationData['start_date'])) {
            $medicationData['start_date'] = now();
        }
        
        // Se for temporário, calcular end_date
        if ($medicationData['duration']['type'] === 'temporario' && isset($medicationData['duration']['value'])) {
            $medicationData['end_date'] = now()->addDays($medicationData['duration']['value']);
        }
        
        $medication = Medication::create($medicationData);
        $medication->load('doctor');

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
            'administration_route' => 'sometimes|string|max:50',
            'frequency_type' => 'sometimes|in:simple,advanced',
            'frequency_details' => 'sometimes|json',
            'first_dose_at' => 'sometimes|date',
            'duration_type' => 'sometimes|in:continuo,temporario',
            'duration_value' => 'nullable|integer',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

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

