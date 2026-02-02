<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FallSensorData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class FallSensorController extends Controller
{
    /**
     * Salvar dados do sensor
     */
    public function store(Request $request, $groupId)
    {
        try {
            $user = Auth::user();

            $validator = Validator::make($request->all(), [
                'sensor_mac' => 'nullable|string|max:17',
                'posture' => 'required|in:standing,sitting,lying_ventral,lying_dorsal,lying_lateral_right,lying_lateral_left,fall',
                'acceleration_x' => 'nullable|numeric',
                'acceleration_y' => 'nullable|numeric',
                'acceleration_z' => 'nullable|numeric',
                'gyro_x' => 'nullable|numeric',
                'gyro_y' => 'nullable|numeric',
                'gyro_z' => 'nullable|numeric',
                'magnitude' => 'nullable|numeric',
                'is_fall_detected' => 'nullable|boolean',
                'confidence' => 'nullable|numeric|min:0|max:100',
                'sensor_timestamp' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();
            
            // Obter nome da postura em português
            $postureNames = FallSensorData::getPostureNames();
            $posturePt = $postureNames[$validated['posture']] ?? $validated['posture'];

            $sensorData = FallSensorData::create([
                'group_id' => $groupId,
                'user_id' => $user->id,
                'sensor_mac' => $validated['sensor_mac'] ?? null,
                'posture' => $validated['posture'],
                'posture_pt' => $posturePt,
                'acceleration_x' => $validated['acceleration_x'] ?? null,
                'acceleration_y' => $validated['acceleration_y'] ?? null,
                'acceleration_z' => $validated['acceleration_z'] ?? null,
                'gyro_x' => $validated['gyro_x'] ?? null,
                'gyro_y' => $validated['gyro_y'] ?? null,
                'gyro_z' => $validated['gyro_z'] ?? null,
                'magnitude' => $validated['magnitude'] ?? null,
                'is_fall_detected' => $validated['is_fall_detected'] ?? false,
                'confidence' => $validated['confidence'] ?? null,
                'sensor_timestamp' => $validated['sensor_timestamp'] ?? now(),
            ]);

            Log::info('FallSensorController::store - Dados salvos:', [
                'id' => $sensorData->id,
                'group_id' => $groupId,
                'user_id' => $user->id,
                'posture' => $validated['posture'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Dados do sensor salvos com sucesso',
                'data' => $sensorData
            ], 201);

        } catch (\Exception $e) {
            Log::error('FallSensorController::store - Erro:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao salvar dados do sensor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar histórico do grupo
     */
    public function index(Request $request, $groupId)
    {
        try {
            $user = Auth::user();
            
            $limit = $request->query('limit', 50);
            $offset = $request->query('offset', 0);
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $posture = $request->query('posture');
            $onlyFalls = $request->query('only_falls', false);

            $query = FallSensorData::where('group_id', $groupId)
                ->orderBy('created_at', 'desc');

            if ($startDate) {
                $query->where('created_at', '>=', $startDate);
            }

            if ($endDate) {
                $query->where('created_at', '<=', $endDate);
            }

            if ($posture) {
                $query->where('posture', $posture);
            }

            if ($onlyFalls) {
                $query->where('is_fall_detected', true);
            }

            $total = $query->count();
            $data = $query->skip($offset)->take($limit)->get();

            return response()->json([
                'success' => true,
                'data' => $data,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]);

        } catch (\Exception $e) {
            Log::error('FallSensorController::index - Erro:', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar histórico',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obter última postura detectada
     */
    public function getLatest(Request $request, $groupId)
    {
        try {
            $latest = FallSensorData::where('group_id', $groupId)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$latest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nenhum dado encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $latest
            ]);

        } catch (\Exception $e) {
            Log::error('FallSensorController::getLatest - Erro:', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar última postura',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obter alertas de queda recentes
     */
    public function getFallAlerts(Request $request, $groupId)
    {
        try {
            $hours = $request->query('hours', 24); // Últimas 24 horas por padrão

            $alerts = FallSensorData::where('group_id', $groupId)
                ->where('is_fall_detected', true)
                ->where('created_at', '>=', now()->subHours($hours))
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $alerts,
                'count' => $alerts->count()
            ]);

        } catch (\Exception $e) {
            Log::error('FallSensorController::getFallAlerts - Erro:', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar alertas de queda',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

