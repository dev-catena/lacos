<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VitalSign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VitalSignController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $groupId = $request->query('group_id');
        $type = $request->query('type');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = VitalSign::query();

        if ($groupId) {
            $query->where('group_id', $groupId);
        }

        if ($type) {
            $query->where('type', $type);
        }

        if ($startDate) {
            $query->where('measured_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('measured_at', '<=', $endDate);
        }

        $vitalSigns = $query->orderBy('measured_at', 'desc')->get();

        return response()->json($vitalSigns);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            \Log::info('VitalSignController::store - Dados recebidos:', $request->all());
            
            $validated = $request->validate([
                'group_id' => 'required|exists:groups,id',
                'type' => 'required|string',
                'value' => 'required',
                'unit' => 'nullable|string',
                'measured_at' => 'nullable|date',
                'notes' => 'nullable|string',
            ]);

            $user = Auth::user();
            
            \Log::info('VitalSignController::store - Dados validados:', $validated);
            \Log::info('VitalSignController::store - User ID:', ['user_id' => $user->id]);
            
            // O campo value é JSON no banco (cast 'array' no modelo), então precisamos garantir que seja um array
            $valueToStore = $validated['value'];
            
            // Se já for array, manter
            if (is_array($valueToStore)) {
                // Já é array, manter como está
            }
            // Se for objeto (vindo do JSON do frontend), converter para array
            elseif (is_object($valueToStore)) {
                $valueToStore = (array) $valueToStore;
            }
            // Se for string, tentar fazer decode JSON primeiro
            elseif (is_string($valueToStore)) {
                $decoded = json_decode($valueToStore, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $valueToStore = $decoded;
                } else {
                    // Se não for JSON válido ou não for array, converter para array
                    $valueToStore = [$valueToStore];
                }
            }
            // Se for número, converter para array
            elseif (is_numeric($valueToStore)) {
                $valueToStore = [$valueToStore];
            }
            // Qualquer outro tipo, converter para array
            else {
                $valueToStore = [$valueToStore];
            }
            
            \Log::info('VitalSignController::store - Value a ser salvo:', ['value' => $valueToStore, 'type' => gettype($valueToStore)]);
            
            $vitalSign = VitalSign::create([
                'group_id' => $validated['group_id'],
                'type' => $validated['type'],
                'value' => $valueToStore,
                'unit' => $validated['unit'] ?? null,
                'measured_at' => $validated['measured_at'] ?? now(),
                'notes' => $validated['notes'] ?? null,
                'recorded_by' => $user->id,
            ]);

            \Log::info('VitalSignController::store - Sinal vital criado com sucesso:', ['id' => $vitalSign->id]);
            
            return response()->json($vitalSign, 201);
        } catch (\Exception $e) {
            \Log::error('VitalSignController::store - Erro:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Erro ao salvar sinal vital',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $vitalSign = VitalSign::findOrFail($id);
        return response()->json($vitalSign);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $vitalSign = VitalSign::findOrFail($id);

        $validated = $request->validate([
            'type' => 'sometimes|string',
            'value' => 'sometimes',
            'unit' => 'nullable|string',
            'measured_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $vitalSign->update($validated);

        return response()->json($vitalSign);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $vitalSign = VitalSign::findOrFail($id);
        $vitalSign->delete();

        return response()->json(['message' => 'Vital sign deleted successfully']);
    }
}

