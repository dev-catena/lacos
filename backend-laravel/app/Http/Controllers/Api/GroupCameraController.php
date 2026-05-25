<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupCamera;
use App\Models\GroupMember;
use App\Services\RtmpAgentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class GroupCameraController extends Controller
{
    private function assertGroupMember(int $groupId): Group
    {
        $user = Auth::user();
        if (! $user) {
            abort(401, 'Usuário não autenticado');
        }

        $group = Group::find($groupId);
        if (! $group) {
            abort(404, 'Grupo não encontrado');
        }

        $isMember = GroupMember::where('group_id', $groupId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();

        if (! $isMember) {
            abort(403, 'Você não tem permissão para acessar este grupo');
        }

        return $group;
    }

    private function assertGroupAdmin(int $groupId): Group
    {
        $user = Auth::user();
        if (! $user) {
            abort(401, 'Usuário não autenticado');
        }

        $group = Group::find($groupId);
        if (! $group) {
            abort(404, 'Grupo não encontrado');
        }

        $isAdmin = GroupMember::where('group_id', $groupId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->where('role', 'admin')
            ->exists();

        $isCreator = isset($group->created_by) && (int) $group->created_by === (int) $user->id;

        if (! $isAdmin && ! $isCreator) {
            abort(403, 'Apenas administradores podem gerenciar câmeras');
        }

        return $group;
    }

    private function findGroupCamera(int $groupId, int $cameraId): GroupCamera
    {
        return GroupCamera::where('group_id', $groupId)
            ->where('id', $cameraId)
            ->where('is_active', true)
            ->firstOrFail();
    }

    /**
     * GET /api/groups/{groupId}/cameras
     */
    public function index(int $groupId, RtmpAgentService $rtmp)
    {
        try {
            $this->assertGroupMember($groupId);

            $cameras = GroupCamera::where('group_id', $groupId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get();

            $payload = $cameras->map(function (GroupCamera $camera) use ($rtmp) {
                $status = $rtmp->getStreamStatus($camera->rtmp_camera_id);

                return [
                    'id' => $camera->id,
                    'name' => $camera->name,
                    'rtmp_camera_id' => $camera->rtmp_camera_id,
                    'connected' => (bool) ($status['connected'] ?? false),
                    'last_frame_at' => $status['last_frame_at'] ?? null,
                    'last_error' => $status['last_error'] ?? null,
                ];
            });

            return response()->json([
                'success' => true,
                'cameras' => $payload,
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('GroupCameraController@index', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar câmeras',
            ], 500);
        }
    }

    /**
     * POST /api/groups/{groupId}/cameras
     * Body: { rtmp_camera_id, name? }
     */
    public function store(Request $request, int $groupId)
    {
        try {
            $this->assertGroupAdmin($groupId);

            $validated = $request->validate([
                'rtmp_camera_id' => 'required|string|max:128',
                'name' => 'nullable|string|max:120',
            ]);

            $rtmpId = trim($validated['rtmp_camera_id']);
            $name = trim($validated['name'] ?? '') ?: $rtmpId;

            $camera = GroupCamera::updateOrCreate(
                [
                    'group_id' => $groupId,
                    'rtmp_camera_id' => $rtmpId,
                ],
                [
                    'name' => $name,
                    'is_active' => true,
                ]
            );

            return response()->json([
                'success' => true,
                'camera' => $camera,
            ], 201);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('GroupCameraController@store', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao vincular câmera',
            ], 500);
        }
    }

    /**
     * DELETE /api/groups/{groupId}/cameras/{cameraId}
     */
    public function destroy(int $groupId, int $cameraId)
    {
        try {
            $this->assertGroupAdmin($groupId);
            $camera = $this->findGroupCamera($groupId, $cameraId);
            $camera->update(['is_active' => false]);

            return response()->json(['success' => true]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('GroupCameraController@destroy', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao remover câmera',
            ], 500);
        }
    }

    /**
     * GET /api/groups/{groupId}/cameras/{cameraId}/stream
     * Retorna URL de playback segura (token temporário) — sob demanda.
     */
    public function stream(int $groupId, int $cameraId, RtmpAgentService $rtmp)
    {
        try {
            $this->assertGroupMember($groupId);
            $camera = $this->findGroupCamera($groupId, $cameraId);

            $play = $rtmp->getSecurePlayUrl($camera->rtmp_camera_id);
            if (! $play) {
                return response()->json([
                    'success' => false,
                    'message' => 'Não foi possível obter o stream da câmera',
                ], 502);
            }

            $status = $rtmp->getStreamStatus($camera->rtmp_camera_id);

            return response()->json([
                'success' => true,
                'camera' => [
                    'id' => $camera->id,
                    'name' => $camera->name,
                    'rtmp_camera_id' => $camera->rtmp_camera_id,
                ],
                'play_url' => $play['play_url'],
                'expires_at' => $play['expires_at'],
                'connected' => (bool) ($status['connected'] ?? false),
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Câmera não encontrada',
            ], 404);
        } catch (\Exception $e) {
            Log::error('GroupCameraController@stream', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao obter stream',
            ], 500);
        }
    }

    /**
     * GET /api/groups/{groupId}/cameras/{cameraId}/snapshot
     */
    public function snapshot(int $groupId, int $cameraId, RtmpAgentService $rtmp)
    {
        try {
            $this->assertGroupMember($groupId);
            $camera = $this->findGroupCamera($groupId, $cameraId);

            $response = $rtmp->fetchLatestSnapshot($camera->rtmp_camera_id);
            if (! $response) {
                return response()->json([
                    'success' => false,
                    'message' => 'Snapshot indisponível',
                ], 404);
            }

            return response($response->body(), 200, [
                'Content-Type' => $response->header('Content-Type') ?? 'image/jpeg',
                'Cache-Control' => 'no-store, max-age=0',
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Câmera não encontrada',
            ], 404);
        } catch (\Exception $e) {
            Log::error('GroupCameraController@snapshot', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao obter snapshot',
            ], 500);
        }
    }

    /**
     * GET /api/groups/{groupId}/cameras/available
     * Lista câmeras no RTMP Agent (somente admin, para vincular).
     */
    public function available(int $groupId, RtmpAgentService $rtmp)
    {
        try {
            $this->assertGroupAdmin($groupId);
            $remote = $rtmp->listCameras();
            $linked = GroupCamera::where('group_id', $groupId)
                ->where('is_active', true)
                ->pluck('rtmp_camera_id')
                ->all();

            $items = collect($remote)->map(function ($cam) use ($linked) {
                $id = $cam['id'] ?? null;

                return [
                    'rtmp_camera_id' => $id,
                    'name' => $cam['name'] ?? $id,
                    'enabled' => (bool) ($cam['enabled'] ?? false),
                    'linked' => in_array($id, $linked, true),
                ];
            })->values();

            return response()->json([
                'success' => true,
                'cameras' => $items,
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('GroupCameraController@available', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar câmeras disponíveis',
            ], 500);
        }
    }
}
