<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserStreamAgent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserStreamAgentController extends Controller
{
    /**
     * GET /api/user/stream-agents
     */
    public function index()
    {
        $userId = Auth::id();
        $agents = UserStreamAgent::where('user_id', $userId)
            ->orderByDesc('linked_at')
            ->get()
            ->map(fn (UserStreamAgent $agent) => $this->serializeAgent($agent));

        return response()->json([
            'success' => true,
            'agents' => $agents,
        ]);
    }

    /**
     * POST /api/user/stream-agents
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'stream_api' => 'required|string|max:500',
            'auth' => 'nullable|array',
            'auth.user' => 'nullable|string|max:120',
            'auth.pass' => 'nullable|string|max:120',
            'cameras' => 'required|array|min:1',
            'cameras.*.id' => 'required|string|max:200',
            'cameras.*.nome' => 'required|string|max:200',
        ], [
            'stream_api.required' => 'Endereço do agente é obrigatório.',
            'cameras.required' => 'Informe ao menos uma câmera.',
        ]);

        $userId = Auth::id();
        $streamApi = rtrim(trim($validated['stream_api']), '/');
        $auth = $validated['auth'] ?? [];
        $cameras = collect($validated['cameras'])
            ->map(fn ($camera) => [
                'id' => trim((string) $camera['id']),
                'nome' => trim((string) $camera['nome']),
            ])
            ->filter(fn ($camera) => $camera['id'] !== '' && $camera['nome'] !== '')
            ->values()
            ->all();

        if (count($cameras) === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Nenhuma câmera válida informada.',
            ], 422);
        }

        $agent = UserStreamAgent::updateOrCreate(
            [
                'user_id' => $userId,
                'stream_api' => $streamApi,
            ],
            [
                'auth_user' => $auth['user'] ?? null,
                'auth_pass' => $auth['pass'] ?? null,
                'cameras' => $cameras,
                'linked_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'agent' => $this->serializeAgent($agent),
        ]);
    }

    /**
     * DELETE /api/user/stream-agents
     */
    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'stream_api' => 'required|string|max:500',
        ]);

        $userId = Auth::id();
        $streamApi = rtrim(trim($validated['stream_api']), '/');

        UserStreamAgent::where('user_id', $userId)
            ->where('stream_api', $streamApi)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vínculo removido com sucesso.',
        ]);
    }

    private function serializeAgent(UserStreamAgent $agent): array
    {
        return [
            'stream_api' => $agent->stream_api,
            'auth' => [
                'user' => $agent->auth_user,
            ],
            'cameras' => $agent->cameras ?? [],
            'vinculadoEm' => optional($agent->linked_at)->toIso8601String(),
        ];
    }
}
