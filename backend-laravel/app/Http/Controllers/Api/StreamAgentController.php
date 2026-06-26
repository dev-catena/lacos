<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StreamAgentPairing;
use App\Models\UserStreamAgent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StreamAgentController extends Controller
{
    private const PAIRING_TTL_MINUTES = 10;

    // ─── PUBLIC (camera agent) ──────────────────────────────────────────────

    /**
     * POST /api/stream-agents/pairing/start
     * Chamado pelo agente de câmeras para iniciar uma sessão de pareamento.
     */
    public function pairingStart(Request $request)
    {
        $request->validate([
            'nome' => 'nullable|string|max:200',
        ]);

        // Expirar sessões antigas
        StreamAgentPairing::where('expires_at', '<', now())->update(['status' => 'expired']);

        $pairingId = (string) Str::uuid();
        $code      = strtoupper(Str::random(6));
        $secret    = Str::random(64);
        $expiresAt = now()->addMinutes(self::PAIRING_TTL_MINUTES);

        $pairing = StreamAgentPairing::create([
            'pairing_id' => $pairingId,
            'code'       => $code,
            'poll_secret'=> $secret,
            'nome'       => ($request->input('nome') ?: 'Agente local'),
            'status'     => 'pending',
            'expires_at' => $expiresAt,
        ]);

        $qrPayload = [
            'v'          => 1,
            'type'       => 'guard_agent_pair',
            'guard_api'  => rtrim(config('app.url'), '/') . '/api',
            'pairing_id' => $pairingId,
            'code'       => $code,
        ];

        return response()->json([
            'success' => true,
            'data'    => [
                'pairing_id'  => $pairingId,
                'code'        => $code,
                'poll_secret' => $secret,
                'expires_at'  => $expiresAt->toIso8601String(),
                'qr_payload'  => $qrPayload,
            ],
        ]);
    }

    /**
     * GET /api/stream-agents/pairing/{pairing_id}/status
     * Chamado pelo agente para verificar se o app já aceitou o pareamento.
     * Retorna o token quando status = "claimed".
     */
    public function pairingStatus(Request $request, string $pairingId)
    {
        $pollSecret = $request->query('poll_secret', '');

        $pairing = StreamAgentPairing::where('pairing_id', $pairingId)->first();

        if (! $pairing) {
            return response()->json(['success' => false, 'message' => 'Sessão não encontrada.'], 404);
        }

        if ($pairing->isExpired()) {
            $pairing->update(['status' => 'expired']);
            return response()->json([
                'success' => true,
                'data'    => ['status' => 'expired'],
            ]);
        }

        if ($pollSecret && ! hash_equals($pairing->poll_secret, $pollSecret)) {
            return response()->json(['success' => false, 'message' => 'Segredo inválido.'], 403);
        }

        if ($pairing->status === 'claimed') {
            $agent = UserStreamAgent::where('user_id', $pairing->user_id)
                ->whereNotNull('agent_token_hash')
                ->where('agent_token_hash', $pairing->agent_token)
                ->first();

            $agentUuid = $agent?->agent_uuid;

            return response()->json([
                'success' => true,
                'data'    => [
                    'status'     => 'claimed',
                    'token'      => $pairing->agent_token,
                    'agent_uuid' => $agentUuid,
                    'nome'       => $pairing->nome,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data'    => ['status' => 'pending'],
        ]);
    }

    // ─── AUTHENTICATED (Lacos user app) ─────────────────────────────────────

    /**
     * POST /api/stream-agents/pairing/{pairing_id}/claim
     * Chamado pelo app Lacos (usuário autenticado) para aceitar o pareamento.
     */
    public function pairingClaim(Request $request, string $pairingId)
    {
        $request->validate([
            'code' => 'required|string|max:10',
        ]);

        $pairing = StreamAgentPairing::where('pairing_id', $pairingId)
            ->where('status', 'pending')
            ->first();

        if (! $pairing) {
            return response()->json([
                'success' => false,
                'message' => 'Sessão de pareamento não encontrada ou já expirada.',
            ], 404);
        }

        if ($pairing->isExpired()) {
            $pairing->update(['status' => 'expired']);
            return response()->json([
                'success' => false,
                'message' => 'Código expirado. Peça ao agente para gerar um novo QR Code.',
            ], 422);
        }

        if (strtoupper(trim($request->input('code'))) !== strtoupper($pairing->code)) {
            return response()->json([
                'success' => false,
                'message' => 'Código inválido.',
            ], 422);
        }

        $userId    = Auth::id();
        $agentUuid = (string) Str::uuid();
        $agentToken = Str::random(64);

        // Cria ou atualiza o agente para este usuário
        $agent = UserStreamAgent::updateOrCreate(
            ['user_id' => $userId, 'agent_uuid' => $agentUuid],
            [
                'agent_uuid'       => $agentUuid,
                'agent_token_hash' => $agentToken,
                'nome'             => $pairing->nome,
                'stream_api'       => '',
                'cameras'          => [],
                'linked_at'        => now(),
            ]
        );

        $pairing->update([
            'status'      => 'claimed',
            'user_id'     => $userId,
            'agent_token' => $agentToken,
        ]);

        return response()->json([
            'success'    => true,
            'agent_uuid' => $agentUuid,
            'nome'       => $pairing->nome,
            'message'    => 'Agente vinculado! As câmeras serão sincronizadas em instantes.',
        ]);
    }

    // ─── AGENT TOKEN AUTH (camera agent after claim) ─────────────────────────

    /**
     * POST /api/stream-agents/heartbeat
     * Chamado pelo agente periodicamente para manter o vínculo ativo.
     * Header: Authorization: Bearer {agent_token}
     */
    public function heartbeat(Request $request)
    {
        $agent = $this->resolveAgentFromToken($request);
        if (! $agent) {
            return response()->json(['success' => false, 'message' => 'Token inválido.'], 401);
        }

        $agent->update(['last_seen_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * POST /api/stream-agents/sync
     * Chamado pelo agente para atualizar a lista de câmeras.
     * Header: Authorization: Bearer {agent_token}
     * Body: {"cameras": [{"stream_id":"...","nome":"...","ip":"...","enabled":true}]}
     */
    public function sync(Request $request)
    {
        $agent = $this->resolveAgentFromToken($request);
        if (! $agent) {
            return response()->json(['success' => false, 'message' => 'Token inválido.'], 401);
        }

        $request->validate([
            'cameras'           => 'required|array',
            'cameras.*.stream_id' => 'required|string|max:200',
            'cameras.*.nome'    => 'nullable|string|max:200',
            'cameras.*.ip'      => 'nullable|string|max:100',
            'cameras.*.enabled' => 'nullable|boolean',
            'stream_api_base'   => 'nullable|string|max:500',
        ]);

        $cameras = collect($request->input('cameras'))
            ->filter(fn ($c) => ! empty($c['stream_id']) && ($c['enabled'] ?? true))
            ->map(fn ($c) => [
                'id'   => $c['stream_id'],
                'nome' => $c['nome'] ?? $c['stream_id'],
                'ip'   => $c['ip'] ?? null,
            ])
            ->values()
            ->all();

        $updates = [
            'cameras'     => $cameras,
            'last_seen_at'=> now(),
        ];

        if ($request->filled('stream_api_base')) {
            $updates['stream_api'] = rtrim($request->input('stream_api_base'), '/');
        }

        $agent->update($updates);

        return response()->json([
            'success'  => true,
            'synced'   => count($cameras),
            'agent_uuid' => $agent->agent_uuid,
        ]);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function resolveAgentFromToken(Request $request): ?UserStreamAgent
    {
        $authHeader = $request->header('Authorization', '');
        if (! str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }
        $token = substr($authHeader, 7);
        if (strlen($token) < 32) {
            return null;
        }

        return UserStreamAgent::where('agent_token_hash', $token)
            ->whereNotNull('agent_uuid')
            ->first();
    }
}
