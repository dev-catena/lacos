<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RtmpAgentService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AdminRtmpCameraController extends Controller
{
    private function assertRootUser(): void
    {
        $user = Auth::user();
        $isRoot = ($user->is_root ?? false)
            || ($user->email === 'root@lacos.com')
            || ($user->email === 'admin@lacos.com');

        if (! $user || ! $isRoot) {
            abort(403, 'Acesso negado. Apenas usuários root podem acessar esta funcionalidade.');
        }
    }

    /**
     * GET /api/admin/rtmp/cameras
     * Proxy autenticado para listagem do agente RTMP.
     */
    public function index(RtmpAgentService $rtmp)
    {
        try {
            $this->assertRootUser();

            $cameras = $rtmp->listCameras();

            return response()->json([
                'success' => true,
                'cameras' => $cameras,
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('AdminRtmpCameraController@index', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao listar câmeras do agente RTMP',
            ], 502);
        }
    }

    /**
     * GET /api/admin/rtmp/cameras/{cameraId}/snapshot
     * Proxy do snapshot JPEG (evita CORS no web-admin).
     */
    public function snapshot(string $cameraId, RtmpAgentService $rtmp)
    {
        try {
            $this->assertRootUser();

            $cameraId = trim($cameraId);
            if ($cameraId === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'ID da câmera inválido',
                ], 422);
            }

            $response = $rtmp->fetchLatestSnapshot($cameraId);
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
        } catch (\Throwable $e) {
            Log::error('AdminRtmpCameraController@snapshot', [
                'camera_id' => $cameraId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao obter snapshot',
            ], 502);
        }
    }
}
