<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SystemSettingController extends Controller
{
    /**
     * Listar todas as configurações ou por categoria
     */
    public function index(Request $request)
    {
        try {
            $query = SystemSetting::query();

            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            if ($request->has('keys')) {
                $keys = is_array($request->keys) ? $request->keys : explode(',', $request->keys);
                $query->whereIn('key', $keys);
            }

            $settings = $query->get()->map(function ($setting) {
                return [
                    'key' => $setting->key,
                    'value' => $setting->getTypedValue(),
                    'type' => $setting->type,
                    'description' => $setting->description,
                    'category' => $setting->category,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $settings,
            ]);
        } catch (\Exception $e) {
            Log::error('SystemSettingController.index - Erro: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar configurações',
            ], 500);
        }
    }

    /**
     * Obter configuração específica por chave
     */
    public function show($key)
    {
        try {
            $setting = SystemSetting::where('key', $key)->first();

            if (!$setting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configuração não encontrada',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'key' => $setting->key,
                    'value' => $setting->getTypedValue(),
                    'type' => $setting->type,
                    'description' => $setting->description,
                    'category' => $setting->category,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SystemSettingController.show - Erro: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar configuração',
            ], 500);
        }
    }

    /**
     * Atualizar configuração
     */
    public function update(Request $request, $key)
    {
        try {
            $request->validate([
                'value' => 'required',
                'type' => 'sometimes|in:string,integer,boolean,json',
            ]);

            $setting = SystemSetting::where('key', $key)->first();

            if (!$setting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configuração não encontrada',
                ], 404);
            }

            $value = $request->value;
            $type = $request->type ?? $setting->type;

            // Validar tipo
            if ($type === 'integer' && !is_numeric($value)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Valor deve ser um número inteiro',
                ], 400);
            }

            if ($type === 'boolean') {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
            }

            $setting->value = is_array($value) ? json_encode($value) : (string) $value;
            if ($request->has('type')) {
                $setting->type = $type;
            }
            if ($request->has('description')) {
                $setting->description = $request->description;
            }
            $setting->save();

            return response()->json([
                'success' => true,
                'message' => 'Configuração atualizada com sucesso',
                'data' => [
                    'key' => $setting->key,
                    'value' => $setting->getTypedValue(),
                    'type' => $setting->type,
                    'description' => $setting->description,
                    'category' => $setting->category,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('SystemSettingController.update - Erro: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar configuração: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obter configurações de gravação (endpoint específico)
     */
    public function getRecordingSettings()
    {
        try {
            $settings = SystemSetting::where('category', 'recording')->get();

            $result = [];
            foreach ($settings as $setting) {
                $result[$setting->key] = $setting->getTypedValue();
            }

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            Log::error('SystemSettingController.getRecordingSettings - Erro: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar configurações de gravação',
            ], 500);
        }
    }
}
