<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserStreamAgent;
use App\Services\StreamCameraStatusService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class AdminStreamCameraController extends Controller
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
     * GET /api/admin/users/cameras-overview
     */
    public function usersOverview(StreamCameraStatusService $statusService)
    {
        $this->assertRootUser();

        if (! Schema::hasTable('user_stream_agents')) {
            return response()->json([
                'success' => true,
                'users' => [],
                'message' => 'Módulo de agentes de câmera não instalado no servidor.',
            ]);
        }

        $users = User::query()
            ->select('id', 'name', 'email', 'profile', 'is_blocked', 'created_at')
            ->orderBy('name')
            ->get();

        $agentsByUser = UserStreamAgent::query()
            ->orderByDesc('linked_at')
            ->get()
            ->groupBy('user_id');

        $payload = $users->map(function (User $user) use ($agentsByUser, $statusService) {
            $agents = $agentsByUser->get($user->id, collect());
            $linked = $agents->isNotEmpty();
            $totalCameras = 0;
            $activeCameras = 0;
            $agentDetails = [];

            foreach ($agents as $agent) {
                $counts = $statusService->countCameras($agent->cameras ?? [], $agent->stream_api);
                $totalCameras += $counts['total'];
                $activeCameras += $counts['active'];

                $agentDetails[] = [
                    'stream_api' => $agent->stream_api,
                    'cameras_total' => $counts['total'],
                    'cameras_active' => $counts['active'],
                    'linked_at' => optional($agent->linked_at)->toIso8601String(),
                ];
            }

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile' => $user->profile,
                'is_blocked' => (bool) $user->is_blocked,
                'linked_to_agent' => $linked,
                'agents_count' => $agents->count(),
                'cameras_total' => $totalCameras,
                'cameras_active' => $activeCameras,
                'is_active' => $activeCameras > 0,
                'agents' => $agentDetails,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'users' => $payload,
        ]);
    }
}
