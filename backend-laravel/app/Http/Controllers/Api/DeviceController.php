<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DeviceController extends Controller
{
    /**
     * Listar todos os dispositivos (admin)
     * GET /api/admin/devices
     */
    public function index()
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                ], 403);
            }

            $devices = Device::with(['user', 'group'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($device) {
                    return [
                        'id' => $device->id,
                        'nickname' => $device->nickname,
                        'type' => $device->type,
                        'type_label' => $device->type_label,
                        'identifier' => $device->identifier,
                        'user_id' => $device->user_id,
                        'user_name' => $device->user ? $device->user->name : null,
                        'user_email' => $device->user ? $device->user->email : null,
                        'group_id' => $device->group_id,
                        'group_name' => $device->group ? $device->group->name : null,
                        'created_at' => $device->created_at,
                    ];
                });

            return response()->json($devices);
        } catch (\Exception $e) {
            Log::error('Erro ao listar dispositivos: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao buscar dispositivos',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar dispositivos de um grupo
     * GET /api/groups/{groupId}/devices
     */
    public function getGroupDevices($groupId)
    {
        try {
            $devices = Device::where('group_id', $groupId)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($device) {
                    return [
                        'id' => $device->id,
                        'nickname' => $device->nickname,
                        'type' => $device->type,
                        'type_label' => $device->type_label,
                        'identifier' => $device->identifier,
                        'created_at' => $device->created_at,
                    ];
                });

            return response()->json($devices);
        } catch (\Exception $e) {
            Log::error('Erro ao listar dispositivos do grupo: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao buscar dispositivos',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Criar dispositivo para um grupo
     * POST /api/groups/{groupId}/devices
     */
    public function createGroupDevice(Request $request, $groupId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nickname' => 'required|string|max:255',
                'type' => 'required|in:smartwatch,sensor',
                'identifier' => 'required|string|unique:devices,identifier',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $device = Device::create([
                'nickname' => $request->nickname,
                'type' => $request->type,
                'identifier' => $request->identifier,
                'group_id' => $groupId,
                'user_id' => Auth::id(),
            ]);

            // Registrar atividade de registro de smartwatch (apenas se for smartwatch)
            if ($request->type === 'smartwatch' && class_exists('App\Models\GroupActivity')) {
                try {
                    $user = Auth::user();
                    \App\Models\GroupActivity::logSmartwatchRegistered(
                        $groupId,
                        $user->id,
                        $user->name,
                        $request->nickname,
                        $device->id
                    );
                } catch (\Exception $e) {
                    Log::warning("Erro ao registrar atividade de smartwatch: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo criado com sucesso',
                'device' => [
                    'id' => $device->id,
                    'nickname' => $device->nickname,
                    'type' => $device->type,
                    'type_label' => $device->type_label,
                    'identifier' => $device->identifier,
                    'created_at' => $device->created_at,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erro ao criar dispositivo: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao criar dispositivo',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obter detalhes de um dispositivo
     * GET /api/admin/devices/{id}
     */
    public function show($id)
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                ], 403);
            }

            $device = Device::with(['user', 'group'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'device' => [
                    'id' => $device->id,
                    'nickname' => $device->nickname,
                    'type' => $device->type,
                    'type_label' => $device->type_label,
                    'identifier' => $device->identifier,
                    'user_id' => $device->user_id,
                    'user_name' => $device->user ? $device->user->name : null,
                    'user_email' => $device->user ? $device->user->email : null,
                    'group_id' => $device->group_id,
                    'group_name' => $device->group ? $device->group->name : null,
                    'created_at' => $device->created_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dispositivo não encontrado'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar dispositivo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar dispositivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Atualizar dispositivo
     * PUT /api/admin/devices/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                ], 403);
            }

            $device = Device::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'nickname' => 'sometimes|string|max:255',
                'type' => 'sometimes|in:smartwatch,sensor',
                'identifier' => 'sometimes|string|unique:devices,identifier,' . $id,
                'user_id' => 'nullable|exists:users,id',
                'group_id' => 'nullable|exists:groups,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $device->update($request->only(['nickname', 'type', 'identifier', 'user_id', 'group_id']));

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo atualizado com sucesso',
                'device' => $device->load(['user', 'group'])
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dispositivo não encontrado'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar dispositivo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar dispositivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Criar novo dispositivo
     * POST /api/admin/devices
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
            $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

            if (!$user || !$isRoot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'nickname' => 'required|string|max:255',
                'type' => 'required|in:smartwatch,sensor',
                'identifier' => 'required|string|unique:devices,identifier',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $device = Device::create([
                'nickname' => $request->nickname,
                'type' => $request->type,
                'identifier' => $request->identifier,
                'user_id' => $request->user_id ?? null,
                'group_id' => $request->group_id ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo criado com sucesso',
                'device' => [
                    'id' => $device->id,
                    'nickname' => $device->nickname,
                    'type' => $device->type,
                    'type_label' => $device->type_label,
                    'identifier' => $device->identifier,
                    'created_at' => $device->created_at,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erro ao criar dispositivo: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao criar dispositivo',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Excluir dispositivo
     * DELETE /api/admin/devices/{id}
     * DELETE /api/groups/{groupId}/devices/{deviceId}
     */
    public function destroy($groupId = null, $deviceId = null)
    {
        try {
            $user = Auth::user();

            // Se deviceId não foi passado, então $groupId é o ID do dispositivo (rota admin)
            // Nesse caso, verificar se é root
            if (!$deviceId) {
                // Verificar se é root: por campo is_root ou por email root@lacos.com ou admin@lacos.com
                $isRoot = ($user->is_root ?? false) || ($user->email === 'root@lacos.com') || ($user->email === 'admin@lacos.com');

                if (!$user || !$isRoot) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.'
                    ], 403);
                }
            }

            $id = $deviceId ?? $groupId;
            
            $device = Device::findOrFail($id);
            
            // Se foi passado groupId, verificar se o dispositivo pertence ao grupo
            if ($groupId && $deviceId && $device->group_id != $groupId) {
                return response()->json([
                    'error' => 'Dispositivo não pertence a este grupo',
                    'message' => 'O dispositivo não está vinculado ao grupo informado'
                ], 403);
            }
            
            $device->delete();

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo excluído com sucesso'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Dispositivo não encontrado',
                'message' => 'O dispositivo com o ID informado não existe'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erro ao excluir dispositivo: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao excluir dispositivo',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
