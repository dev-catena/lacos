<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\V8Gateway;
use App\Models\V8GatewayPairing;
use App\Models\VitalSign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class V8GatewayController extends Controller
{
    private const PAIRING_TTL_MINUTES = 15;

    // ─── PUBLIC (ESP32 gateway) ───────────────────────────────────────────────

    /**
     * POST /api/v8-gateways/pairing/start
     * Gateway inicia (ou renova) sessão de pareamento.
     */
    public function pairingStart(Request $request)
    {
        $validated = $request->validate([
            'device_id' => 'required|uuid',
            'name' => 'nullable|string|max:200',
        ]);

        V8GatewayPairing::where('expires_at', '<', now())
            ->where('status', 'pending')
            ->update(['status' => 'expired']);

        $pairingId = (string) Str::uuid();
        $code = strtoupper(Str::random(6));
        $secret = Str::random(64);
        $expiresAt = now()->addMinutes(self::PAIRING_TTL_MINUTES);

        V8GatewayPairing::create([
            'pairing_id' => $pairingId,
            'code' => $code,
            'poll_secret' => $secret,
            'device_id' => $validated['device_id'],
            'name' => $validated['name'] ?: 'Gateway V8',
            'status' => 'pending',
            'expires_at' => $expiresAt,
        ]);

        // Garante registro do dispositivo (ainda sem grupo)
        V8Gateway::firstOrCreate(
            ['device_id' => $validated['device_id']],
            ['name' => $validated['name'] ?: 'Gateway V8']
        );

        $qrPayload = [
            'v' => 1,
            'type' => 'v8_gateway_pair',
            'api' => rtrim(config('app.url'), '/') . '/api',
            'pairing_id' => $pairingId,
            'code' => $code,
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'pairing_id' => $pairingId,
                'code' => $code,
                'poll_secret' => $secret,
                'expires_at' => $expiresAt->toIso8601String(),
                'qr_payload' => $qrPayload,
            ],
        ]);
    }

    /**
     * GET /api/v8-gateways/pairing/{pairing_id}/status?poll_secret=
     */
    public function pairingStatus(Request $request, string $pairingId)
    {
        $pollSecret = (string) $request->query('poll_secret', '');

        $pairing = V8GatewayPairing::where('pairing_id', $pairingId)->first();
        if (! $pairing) {
            return response()->json(['success' => false, 'message' => 'Sessão não encontrada.'], 404);
        }

        if ($pairing->isExpired()) {
            $pairing->update(['status' => 'expired']);

            return response()->json([
                'success' => true,
                'data' => ['status' => 'expired'],
            ]);
        }

        if ($pollSecret === '' || ! hash_equals($pairing->poll_secret, $pollSecret)) {
            return response()->json(['success' => false, 'message' => 'Segredo inválido.'], 403);
        }

        if ($pairing->status === 'claimed') {
            return response()->json([
                'success' => true,
                'data' => [
                    'status' => 'claimed',
                    'device_token' => $pairing->device_token,
                    'group_id' => $pairing->group_id,
                    'name' => $pairing->name,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => ['status' => 'pending'],
        ]);
    }

    /**
     * POST /api/v8-gateways/ingest
     * Authorization: Bearer {device_token}
     */
    public function ingest(Request $request)
    {
        $gateway = $this->resolveGatewayFromToken($request);
        if (! $gateway) {
            return response()->json(['success' => false, 'message' => 'Token inválido.'], 401);
        }

        if (! $gateway->group_id) {
            return response()->json([
                'success' => false,
                'message' => 'Gateway ainda não pareado a um grupo.',
            ], 409);
        }

        $validated = $request->validate([
            'bracelet_mac' => 'nullable|string|max:32',
            'device_name' => 'nullable|string|max:200',
            'readings' => 'required|array|min:1|max:20',
            'readings.*.type' => 'required|string|in:heart_rate,oxygen_saturation,blood_pressure,temperature,sleep,ecg',
            'readings.*.value' => 'required',
            'readings.*.unit' => 'nullable|string|max:20',
            'readings.*.measured_at' => 'nullable|date',
            'readings.*.notes' => 'nullable|string|max:500',
        ]);

        $gateway->last_seen_at = now();
        if (! empty($validated['bracelet_mac'])) {
            $gateway->bracelet_mac = $validated['bracelet_mac'];
        }
        if (! empty($validated['device_name'])) {
            $gateway->name = $validated['device_name'];
        }
        $gateway->save();

        $accompaniedPersonId = $this->resolveAccompaniedPersonId((int) $gateway->group_id);
        $recordedBy = $gateway->paired_by;
        $saved = 0;
        $ids = [];

        foreach ($validated['readings'] as $row) {
            $valueToStore = $row['value'];
            if (is_object($valueToStore)) {
                $valueToStore = (array) $valueToStore;
            } elseif (is_string($valueToStore)) {
                $decoded = json_decode($valueToStore, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $valueToStore = $decoded;
                }
            }

            $notes = $row['notes'] ?? 'wearable: V8 (esp32-gateway)';
            if (! empty($validated['bracelet_mac'])) {
                $notes .= ' | mac=' . $validated['bracelet_mac'];
            }

            $vital = VitalSign::create([
                'group_id' => $gateway->group_id,
                'accompanied_person_id' => $accompaniedPersonId,
                'type' => $row['type'],
                'value' => $valueToStore,
                'unit' => $row['unit'] ?? null,
                'measured_at' => $row['measured_at'] ?? now(),
                'notes' => $notes,
                'recorded_by' => $recordedBy,
            ]);
            $saved++;
            $ids[] = $vital->id;
        }

        Log::info('V8Gateway ingest', [
            'device_id' => $gateway->device_id,
            'group_id' => $gateway->group_id,
            'saved' => $saved,
        ]);

        return response()->json([
            'success' => true,
            'saved' => $saved,
            'ids' => $ids,
        ]);
    }

    /**
     * POST /api/v8-gateways/heartbeat
     */
    public function heartbeat(Request $request)
    {
        $gateway = $this->resolveGatewayFromToken($request);
        if (! $gateway) {
            return response()->json(['success' => false, 'message' => 'Token inválido.'], 401);
        }

        $gateway->update(['last_seen_at' => now()]);

        return response()->json([
            'success' => true,
            'paired' => (bool) $gateway->group_id,
            'group_id' => $gateway->group_id,
        ]);
    }

    // ─── AUTHENTICATED (app Laços) ────────────────────────────────────────────

    /**
     * POST /api/v8-gateways/pairing/claim
     * Body: { code, group_id } — usuário digita o código do portal/serial.
     */
    public function pairingClaimByCode(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10',
            'group_id' => 'required|integer|exists:groups,id',
            'name' => 'nullable|string|max:200',
        ]);

        $this->assertGroupMember((int) $validated['group_id']);

        $code = strtoupper(trim($validated['code']));
        $pairing = V8GatewayPairing::where('code', $code)
            ->where('status', 'pending')
            ->orderByDesc('id')
            ->first();

        if (! $pairing) {
            return response()->json([
                'success' => false,
                'message' => 'Código inválido ou já usado.',
            ], 422);
        }

        return $this->completeClaim($pairing, (int) $validated['group_id'], $validated['name'] ?? null);
    }

    /**
     * POST /api/v8-gateways/pairing/{pairing_id}/claim
     * Body: { code, group_id } — fluxo com QR.
     */
    public function pairingClaim(Request $request, string $pairingId)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10',
            'group_id' => 'required|integer|exists:groups,id',
            'name' => 'nullable|string|max:200',
        ]);

        $this->assertGroupMember((int) $validated['group_id']);

        $pairing = V8GatewayPairing::where('pairing_id', $pairingId)
            ->where('status', 'pending')
            ->first();

        if (! $pairing) {
            return response()->json([
                'success' => false,
                'message' => 'Sessão de pareamento não encontrada ou já usada.',
            ], 404);
        }

        if (strtoupper(trim($validated['code'])) !== strtoupper($pairing->code)) {
            return response()->json([
                'success' => false,
                'message' => 'Código inválido.',
            ], 422);
        }

        return $this->completeClaim($pairing, (int) $validated['group_id'], $validated['name'] ?? null);
    }

    /**
     * GET /api/groups/{groupId}/v8-gateways
     */
    public function indexForGroup(int $groupId)
    {
        $this->assertGroupMember($groupId);

        $gateways = V8Gateway::where('group_id', $groupId)
            ->orderByDesc('last_seen_at')
            ->get()
            ->map(fn (V8Gateway $g) => [
                'id' => $g->id,
                'device_id' => $g->device_id,
                'name' => $g->name,
                'bracelet_mac' => $g->bracelet_mac,
                'last_seen_at' => optional($g->last_seen_at)->toIso8601String(),
                'paired_at' => optional($g->paired_at)->toIso8601String(),
            ]);

        return response()->json([
            'success' => true,
            'gateways' => $gateways,
        ]);
    }

    /**
     * DELETE /api/groups/{groupId}/v8-gateways/{gatewayId}
     */
    public function unpair(int $groupId, int $gatewayId)
    {
        $this->assertGroupMember($groupId);

        $gateway = V8Gateway::where('id', $gatewayId)
            ->where('group_id', $groupId)
            ->first();

        if (! $gateway) {
            return response()->json(['success' => false, 'message' => 'Gateway não encontrado.'], 404);
        }

        $gateway->update([
            'group_id' => null,
            'paired_by' => null,
            'paired_at' => null,
            'device_token_hash' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Gateway desvinculado do grupo.',
        ]);
    }

    // ─── helpers ──────────────────────────────────────────────────────────────

    private function completeClaim(V8GatewayPairing $pairing, int $groupId, ?string $name)
    {
        if ($pairing->isExpired()) {
            $pairing->update(['status' => 'expired']);

            return response()->json([
                'success' => false,
                'message' => 'Código expirado. Peça ao gateway para gerar um novo.',
            ], 422);
        }

        $userId = Auth::id();
        $deviceToken = Str::random(64);
        $tokenHash = hash('sha256', $deviceToken);

        $gateway = V8Gateway::updateOrCreate(
            ['device_id' => $pairing->device_id],
            [
                'name' => $name ?: ($pairing->name ?: 'Gateway V8'),
                'device_token_hash' => $tokenHash,
                'group_id' => $groupId,
                'paired_by' => $userId,
                'paired_at' => now(),
                'last_seen_at' => now(),
            ]
        );

        $pairing->update([
            'status' => 'claimed',
            'user_id' => $userId,
            'group_id' => $groupId,
            'device_token' => $deviceToken,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Gateway vinculado ao grupo.',
            'gateway' => [
                'id' => $gateway->id,
                'device_id' => $gateway->device_id,
                'name' => $gateway->name,
                'group_id' => $groupId,
            ],
        ]);
    }

    private function resolveGatewayFromToken(Request $request): ?V8Gateway
    {
        $authHeader = $request->header('Authorization', '');
        if (! str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }
        $token = substr($authHeader, 7);
        if (strlen($token) < 32) {
            return null;
        }

        return V8Gateway::where('device_token_hash', hash('sha256', $token))->first();
    }

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

    private function resolveAccompaniedPersonId(int $groupId): ?int
    {
        $patientMember = DB::table('group_members')
            ->where('group_id', $groupId)
            ->whereIn('role', ['patient', 'accompanied', 'accompanied_person'])
            ->where('is_active', true)
            ->first();

        if ($patientMember && ! empty($patientMember->accompanied_person_id)) {
            return (int) $patientMember->accompanied_person_id;
        }

        $first = DB::table('accompanied_people')
            ->where('group_id', $groupId)
            ->first();

        return $first ? (int) $first->id : null;
    }
}
