<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\GroupV8BlePairing;
use App\Models\VitalSign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class GroupV8BlePairingController extends Controller
{
    /**
     * GET /api/groups/{groupId}/v8-ble-pairing
     */
    public function show(int $groupId)
    {
        $group = $this->assertGroupMember($groupId);
        $userId = (int) Auth::id();
        $pairing = null;
        if (Schema::hasTable('group_v8_ble_pairings')) {
            $pairing = GroupV8BlePairing::with('pairedByUser')
                ->where('group_id', $groupId)
                ->first();
        }

        $latest = $this->latestV8Readings($groupId);

        $isAdmin = $this->isGroupAdmin($group, $userId);
        $isPatient = $this->isGroupPatient($group, $userId);
        $isOwner = $pairing !== null && (int) $pairing->paired_by === $userId;

        // Só o registro deste group_id conta. Não inferir dono por sinais vitais
        // (isso misturava a pulseira da Mamãe Sandra na Vovó Rosa).
        $hasLink = $pairing !== null;

        // Só o paciente/acompanhado pareia e usa BLE neste celular.
        // Demais membros só leem as leituras gravadas no backend.
        $canConnect = $isPatient;
        $canClaim = $isPatient;

        $pairingPayload = $pairing ? $this->serializePairing($pairing) : null;

        return response()->json([
            'success' => true,
            'pairing' => $pairingPayload,
            'is_owner' => $isOwner,
            'is_patient' => $isPatient,
            'can_connect' => $canConnect,
            'can_claim' => $canClaim,
            'can_unpair' => $hasLink && ($isOwner || $isAdmin || $isPatient),
            'latest' => $hasLink ? $latest['readings'] : [
                'heart_rate' => null,
                'oxygen_saturation' => null,
                'blood_pressure' => null,
                'temperature' => null,
                'sleep' => null,
                'ecg' => null,
            ],
        ]);
    }

    /**
     * PUT /api/groups/{groupId}/v8-ble-pairing
     */
    public function upsert(Request $request, int $groupId)
    {
        if (! Schema::hasTable('group_v8_ble_pairings')) {
            return response()->json([
                'success' => false,
                'message' => 'Tabela de vínculo da pulseira ainda não existe. Rode as migrations.',
            ], 503);
        }

        $group = $this->assertGroupMember($groupId);
        $userId = (int) Auth::id();

        if (! $this->isGroupPatient($group, $userId)) {
            return response()->json([
                'success' => false,
                'message' => 'Só o paciente/acompanhado pode vincular a pulseira ao grupo. Use o celular que fica perto dele.',
            ], 403);
        }

        $validated = $request->validate([
            'bracelet_id' => 'required|string|max:80',
            'bracelet_name' => 'nullable|string|max:200',
            'bracelet_model' => 'nullable|string|in:v5,v8',
            'battery_percent' => 'nullable|integer|min:0|max:100',
        ]);

        $model = strtolower((string) ($validated['bracelet_model'] ?? 'v8'));
        if (! in_array($model, ['v5', 'v8'], true)) {
            $model = 'v8';
        }

        $pairing = GroupV8BlePairing::where('group_id', $groupId)->first();

        $alreadyElsewhere = GroupV8BlePairing::where('bracelet_id', $validated['bracelet_id'])
            ->where('group_id', '!=', $groupId)
            ->first();
        if ($alreadyElsewhere) {
            return response()->json([
                'success' => false,
                'message' => 'Esta pulseira já está vinculada a outro grupo.',
            ], 409);
        }

        $payload = [
            'paired_by' => $userId,
            'bracelet_id' => $validated['bracelet_id'],
            'bracelet_name' => $validated['bracelet_name'] ?: ($model === 'v5' ? 'Pulseira V5' : 'Pulseira V8'),
            'paired_at' => $pairing?->paired_at ?: now(),
            'last_seen_at' => now(),
        ];
        if (Schema::hasColumn('group_v8_ble_pairings', 'bracelet_model')) {
            $payload['bracelet_model'] = $model;
        }
        if (
            Schema::hasColumn('group_v8_ble_pairings', 'battery_percent')
            && array_key_exists('battery_percent', $validated)
            && $validated['battery_percent'] !== null
        ) {
            $payload['battery_percent'] = (int) $validated['battery_percent'];
        }

        $pairing = GroupV8BlePairing::updateOrCreate(
            ['group_id' => $groupId],
            $payload
        );
        $pairing->load('pairedByUser');

        return response()->json([
            'success' => true,
            'message' => 'Pulseira vinculada ao grupo.',
            'pairing' => $this->serializePairing($pairing),
            'is_owner' => true,
            'can_connect' => true,
            'can_unpair' => true,
        ]);
    }

    /**
     * POST /api/groups/{groupId}/v8-ble-pairing/measure
     * Cuidador solicita medição no celular do paciente (sem BLE no cuidador).
     */
    public function requestMeasure(Request $request, int $groupId)
    {
        $group = $this->assertGroupMember($groupId);
        $userId = (int) Auth::id();

        if ($this->isGroupPatient($group, $userId)) {
            return response()->json([
                'success' => false,
                'message' => 'O paciente já monitora a pulseira neste celular. Use a gravação automática.',
            ], 422);
        }

        if (! Schema::hasTable('group_v8_ble_pairings')) {
            return response()->json([
                'success' => false,
                'message' => 'Pulseira ainda não configurada.',
            ], 503);
        }

        $pairing = GroupV8BlePairing::where('group_id', $groupId)->first();
        if (! $pairing) {
            return response()->json([
                'success' => false,
                'message' => 'O paciente ainda não vinculou a pulseira.',
            ], 404);
        }

        $validated = $request->validate([
            'type' => 'required|string|in:all,ecg',
        ]);

        $requestId = (string) \Illuminate\Support\Str::uuid();

        try {
            event(new \App\Events\BraceletMeasureRequested(
                $groupId,
                $validated['type'],
                $userId,
                $requestId
            ));
        } catch (\Throwable $e) {
            \Log::warning('bracelet.measure broadcast failed: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Não foi possível avisar o celular do paciente. Verifique a conexão em tempo real.',
            ], 502);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pedido enviado ao celular do paciente.',
            'request_id' => $requestId,
            'type' => $validated['type'],
        ]);
    }

    /**
     * POST /api/groups/{groupId}/v8-ble-pairing/measure-finished
     * App do paciente reporta fim da medição remota.
     */
    public function finishMeasure(Request $request, int $groupId)
    {
        $group = $this->assertGroupMember($groupId);
        $userId = (int) Auth::id();

        if (! $this->isGroupPatient($group, $userId)) {
            return response()->json([
                'success' => false,
                'message' => 'Só o paciente reporta o fim da medição.',
            ], 403);
        }

        $validated = $request->validate([
            'type' => 'required|string|in:all,ecg',
            'request_id' => 'required|string|max:80',
            'success' => 'required|boolean',
            'message' => 'nullable|string|max:500',
        ]);

        try {
            event(new \App\Events\BraceletMeasureFinished(
                $groupId,
                $validated['type'],
                $validated['request_id'],
                (bool) $validated['success'],
                $validated['message'] ?? null
            ));
        } catch (\Throwable $e) {
            \Log::warning('bracelet.measure.finished broadcast failed: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * DELETE /api/groups/{groupId}/v8-ble-pairing
     */
    public function destroy(int $groupId)
    {
        if (! Schema::hasTable('group_v8_ble_pairings')) {
            return response()->json([
                'success' => true,
                'message' => 'Nenhuma pulseira vinculada.',
            ]);
        }

        $group = $this->assertGroupMember($groupId);
        $userId = (int) Auth::id();
        $pairing = GroupV8BlePairing::where('group_id', $groupId)->first();

        if (! $pairing) {
            return response()->json([
                'success' => true,
                'message' => 'Nenhuma pulseira vinculada.',
            ]);
        }

        $isOwner = (int) $pairing->paired_by === $userId;
        if (! $isOwner && ! $this->isGroupAdmin($group, $userId) && ! $this->isGroupPatient($group, $userId)) {
            return response()->json([
                'success' => false,
                'message' => 'Só quem conectou, o paciente ou um admin pode desvincular a pulseira.',
            ], 403);
        }

        $pairing->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pulseira desvinculada do grupo.',
        ]);
    }

    private function serializePairing(GroupV8BlePairing $pairing): array
    {
        $user = $pairing->pairedByUser;

        $model = 'v8';
        if (Schema::hasColumn('group_v8_ble_pairings', 'bracelet_model')) {
            $raw = strtolower((string) ($pairing->bracelet_model ?: ''));
            if (in_array($raw, ['v5', 'v8'], true)) {
                $model = $raw;
            }
        }

        return [
            'bracelet_id' => $pairing->bracelet_id,
            'bracelet_name' => $pairing->bracelet_name,
            'bracelet_model' => $model,
            'battery_percent' => Schema::hasColumn('group_v8_ble_pairings', 'battery_percent')
                ? ($pairing->battery_percent !== null ? (int) $pairing->battery_percent : null)
                : null,
            'paired_by' => (int) $pairing->paired_by,
            'paired_by_name' => $user?->name,
            'paired_at' => optional($pairing->paired_at)->toIso8601String(),
            'last_seen_at' => optional($pairing->last_seen_at)->toIso8601String(),
        ];
    }

    private function latestV8Readings(int $groupId): array
    {
        $rows = VitalSign::where('group_id', $groupId)
            ->where(function ($q) {
                $q->where('notes', 'like', '%wearable%')
                    ->orWhere('notes', 'like', '%V8%')
                    ->orWhere('notes', 'like', '%v8%')
                    ->orWhere('notes', 'like', '%V5%')
                    ->orWhere('notes', 'like', '%v5%');
            })
            ->orderByDesc('measured_at')
            ->limit(120)
            ->get();

        $readings = [
            'heart_rate' => null,
            'oxygen_saturation' => null,
            'blood_pressure' => null,
            'temperature' => null,
            'sleep' => null,
            'ecg' => null,
        ];
        $recordedBy = null;
        $lastMeasuredAt = null;
        $notes = null;

        foreach ($rows as $row) {
            if ($recordedBy === null && $row->recorded_by) {
                $recordedBy = (int) $row->recorded_by;
            }
            if ($lastMeasuredAt === null && $row->measured_at) {
                $lastMeasuredAt = $row->measured_at->toIso8601String();
            }
            if ($notes === null && $row->notes) {
                $notes = (string) $row->notes;
            }
            $type = $row->type;
            if (! array_key_exists($type, $readings) || $readings[$type] !== null) {
                continue;
            }
            $readings[$type] = $this->formatReading($row);
        }

        return [
            'readings' => $readings,
            'recorded_by' => $recordedBy,
            'last_measured_at' => $lastMeasuredAt,
            'notes' => $notes,
        ];
    }

    private function formatReading(VitalSign $row): array
    {
        $raw = $row->value;
        if (is_array($raw) && isset($raw[0]) && ! isset($raw['systolic']) && count($raw) === 1) {
            $raw = $raw[0];
        }

        $out = [
            'value' => $raw,
            'unit' => $row->unit,
            'measured_at' => optional($row->measured_at)->toIso8601String(),
        ];

        if ($row->type === 'blood_pressure') {
            if (is_array($raw) && isset($raw['systolic'], $raw['diastolic'])) {
                $out['systolic'] = (int) $raw['systolic'];
                $out['diastolic'] = (int) $raw['diastolic'];
            } elseif (is_string($raw) && str_contains($raw, '/')) {
                [$sys, $dia] = array_map('intval', explode('/', $raw, 2));
                $out['systolic'] = $sys;
                $out['diastolic'] = $dia;
            }
        }

        if ($row->type === 'ecg' && is_array($raw)) {
            $out['heart_rate'] = $raw['heart_rate'] ?? null;
            $out['hrv'] = $raw['hrv'] ?? null;
            $out['stress'] = $raw['stress'] ?? null;
            $out['samples'] = $raw['samples'] ?? null;
        }

        return $out;
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

    private function isGroupAdmin(Group $group, int $userId): bool
    {
        $isAdmin = GroupMember::where('group_id', $group->id)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->where('role', 'admin')
            ->exists();

        $isCreator = isset($group->created_by) && (int) $group->created_by === $userId;

        return $isAdmin || $isCreator;
    }

    private function isGroupPatient(Group $group, int $userId): bool
    {
        return GroupMember::where('group_id', $group->id)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->whereIn('role', GroupMember::accompaniedPersonRoles())
            ->exists();
    }
}
