<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\LocationBracelet;
use App\Models\LocationGateway;
use App\Models\LocationPresenceEvent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class LocationModuleController extends Controller
{
    private const LIVE_WINDOW_MINUTES = 5;

    // ─── Ingest (MQTT bridge / gateway MOKO) ───────────────────────────────────

    /**
     * POST /api/location/ingest
     * Body: { gateway_mac, readings: [{ bracelet_mac, rssi, recorded_at? }] }
     */
    public function ingest(Request $request)
    {
        if (! Schema::hasTable('location_gateways')) {
            return response()->json([
                'success' => false,
                'message' => 'Módulo de localização ainda não migrado.',
            ], 503);
        }

        $validated = $request->validate([
            'gateway_mac' => 'required|string|max:32',
            'readings' => 'required|array|min:1|max:100',
            'readings.*.bracelet_mac' => 'required|string|max:32',
            'readings.*.rssi' => 'nullable|integer|min:-120|max:0',
            'readings.*.recorded_at' => 'nullable|date',
        ]);

        $gatewayMac = $this->normalizeMac($validated['gateway_mac']);
        $gateway = LocationGateway::where('gateway_mac', $gatewayMac)->first();
        if (! $gateway) {
            return response()->json([
                'success' => false,
                'message' => 'Gateway não cadastrado. Configure-o no app Laços.',
            ], 404);
        }

        $gateway->last_seen_at = now();
        $gateway->save();

        $saved = 0;
        foreach ($validated['readings'] as $row) {
            $braceletMac = $this->normalizeMac($row['bracelet_mac']);
            $recordedAt = isset($row['recorded_at'])
                ? Carbon::parse($row['recorded_at'])
                : now();

            LocationPresenceEvent::create([
                'group_id' => $gateway->group_id,
                'gateway_id' => $gateway->id,
                'gateway_mac' => $gatewayMac,
                'bracelet_mac' => $braceletMac,
                'rssi' => $row['rssi'] ?? null,
                'place_label' => $gateway->place_label,
                'recorded_at' => $recordedAt,
            ]);

            LocationBracelet::where('group_id', $gateway->group_id)
                ->where('bracelet_mac', $braceletMac)
                ->update(['last_seen_at' => $recordedAt]);

            $saved++;
        }

        return response()->json([
            'success' => true,
            'saved' => $saved,
            'group_id' => $gateway->group_id,
        ]);
    }

    // ─── Gateways (config) ─────────────────────────────────────────────────────

    public function indexGateways(int $groupId)
    {
        $this->assertGroupMember($groupId);

        $items = LocationGateway::where('group_id', $groupId)
            ->orderBy('place_label')
            ->get()
            ->map(fn (LocationGateway $g) => $this->serializeGateway($g));

        return response()->json(['success' => true, 'gateways' => $items]);
    }

    public function storeGateway(Request $request, int $groupId)
    {
        $this->assertGroupMember($groupId);

        $validated = $request->validate([
            'gateway_mac' => 'required|string|max:32',
            'device_name' => 'nullable|string|max:200',
            'place_label' => 'required|string|max:200',
            'place_description' => 'nullable|string|max:1000',
        ]);

        $mac = $this->normalizeMac($validated['gateway_mac']);
        $existsElsewhere = LocationGateway::where('gateway_mac', $mac)
            ->where('group_id', '!=', $groupId)
            ->exists();
        if ($existsElsewhere) {
            return response()->json([
                'success' => false,
                'message' => 'Este gateway já está cadastrado em outro grupo.',
            ], 409);
        }

        $gateway = LocationGateway::updateOrCreate(
            ['group_id' => $groupId, 'gateway_mac' => $mac],
            [
                'device_name' => $validated['device_name'] ?? null,
                'place_label' => trim($validated['place_label']),
                'place_description' => $validated['place_description'] ?? null,
                'created_by' => Auth::id(),
            ]
        );

        return response()->json([
            'success' => true,
            'gateway' => $this->serializeGateway($gateway),
        ]);
    }

    public function updateGateway(Request $request, int $groupId, int $gatewayId)
    {
        $this->assertGroupMember($groupId);

        $gateway = LocationGateway::where('group_id', $groupId)->where('id', $gatewayId)->first();
        if (! $gateway) {
            return response()->json(['success' => false, 'message' => 'Gateway não encontrado.'], 404);
        }

        $validated = $request->validate([
            'device_name' => 'nullable|string|max:200',
            'place_label' => 'sometimes|required|string|max:200',
            'place_description' => 'nullable|string|max:1000',
        ]);

        $gateway->fill($validated);
        $gateway->save();

        return response()->json([
            'success' => true,
            'gateway' => $this->serializeGateway($gateway),
        ]);
    }

    public function destroyGateway(int $groupId, int $gatewayId)
    {
        $this->assertGroupMember($groupId);

        $gateway = LocationGateway::where('group_id', $groupId)->where('id', $gatewayId)->first();
        if (! $gateway) {
            return response()->json(['success' => false, 'message' => 'Gateway não encontrado.'], 404);
        }

        $gateway->delete();

        return response()->json(['success' => true, 'message' => 'Gateway removido.']);
    }

    // ─── Bracelets (config) ────────────────────────────────────────────────────

    public function indexBracelets(int $groupId)
    {
        $this->assertGroupMember($groupId);

        $items = LocationBracelet::with('memberUser')
            ->where('group_id', $groupId)
            ->orderBy('bracelet_name')
            ->get()
            ->map(fn (LocationBracelet $b) => $this->serializeBracelet($b));

        return response()->json(['success' => true, 'bracelets' => $items]);
    }

    public function storeBracelet(Request $request, int $groupId)
    {
        $this->assertGroupMember($groupId);

        $validated = $request->validate([
            'bracelet_mac' => 'required|string|max:32',
            'bracelet_name' => 'nullable|string|max:200',
            'member_user_id' => 'nullable|integer|exists:users,id',
            'member_label' => 'nullable|string|max:200',
        ]);

        if (! empty($validated['member_user_id'])) {
            $this->assertMemberInGroup($groupId, (int) $validated['member_user_id']);
        }

        $mac = $this->normalizeMac($validated['bracelet_mac']);
        $existsElsewhere = LocationBracelet::where('bracelet_mac', $mac)
            ->where('group_id', '!=', $groupId)
            ->exists();
        if ($existsElsewhere) {
            return response()->json([
                'success' => false,
                'message' => 'Esta pulseira já está cadastrada em outro grupo.',
            ], 409);
        }

        $bracelet = LocationBracelet::updateOrCreate(
            ['group_id' => $groupId, 'bracelet_mac' => $mac],
            [
                'bracelet_name' => $validated['bracelet_name'] ?? null,
                'member_user_id' => $validated['member_user_id'] ?? null,
                'member_label' => $validated['member_label'] ?? null,
                'created_by' => Auth::id(),
            ]
        );
        $bracelet->load('memberUser');

        return response()->json([
            'success' => true,
            'bracelet' => $this->serializeBracelet($bracelet),
        ]);
    }

    public function updateBracelet(Request $request, int $groupId, int $braceletId)
    {
        $this->assertGroupMember($groupId);

        $bracelet = LocationBracelet::where('group_id', $groupId)->where('id', $braceletId)->first();
        if (! $bracelet) {
            return response()->json(['success' => false, 'message' => 'Pulseira não encontrada.'], 404);
        }

        $validated = $request->validate([
            'bracelet_name' => 'nullable|string|max:200',
            'member_user_id' => 'nullable|integer|exists:users,id',
            'member_label' => 'nullable|string|max:200',
        ]);

        if (array_key_exists('member_user_id', $validated) && $validated['member_user_id']) {
            $this->assertMemberInGroup($groupId, (int) $validated['member_user_id']);
        }

        $bracelet->fill($validated);
        $bracelet->save();
        $bracelet->load('memberUser');

        return response()->json([
            'success' => true,
            'bracelet' => $this->serializeBracelet($bracelet),
        ]);
    }

    public function destroyBracelet(int $groupId, int $braceletId)
    {
        $this->assertGroupMember($groupId);

        $bracelet = LocationBracelet::where('group_id', $groupId)->where('id', $braceletId)->first();
        if (! $bracelet) {
            return response()->json(['success' => false, 'message' => 'Pulseira não encontrada.'], 404);
        }

        $bracelet->delete();

        return response()->json(['success' => true, 'message' => 'Pulseira removida.']);
    }

    // ─── Visualização ──────────────────────────────────────────────────────────

    public function realtime(int $groupId)
    {
        $this->assertGroupMember($groupId);

        $since = now()->subMinutes(self::LIVE_WINDOW_MINUTES);
        $bracelets = LocationBracelet::with('memberUser')
            ->where('group_id', $groupId)
            ->get();

        $positions = [];
        foreach ($bracelets as $bracelet) {
            $events = LocationPresenceEvent::where('group_id', $groupId)
                ->where('bracelet_mac', $bracelet->bracelet_mac)
                ->where('recorded_at', '>=', $since)
                ->orderByDesc('recorded_at')
                ->get();

            $best = $this->resolveBestLocation($events);
            $positions[] = array_merge($this->serializeBracelet($bracelet), [
                'current' => $best,
                'is_online' => $best !== null,
            ]);
        }

        $gateways = LocationGateway::where('group_id', $groupId)
            ->orderBy('place_label')
            ->get()
            ->map(fn (LocationGateway $g) => $this->serializeGateway($g));

        return response()->json([
            'success' => true,
            'window_minutes' => self::LIVE_WINDOW_MINUTES,
            'positions' => $positions,
            'gateways' => $gateways,
        ]);
    }

    public function history(Request $request, int $groupId)
    {
        $this->assertGroupMember($groupId);

        $validated = $request->validate([
            'bracelet_id' => 'nullable|integer',
            'bracelet_mac' => 'nullable|string|max:32',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $query = LocationPresenceEvent::where('group_id', $groupId);

        if (! empty($validated['bracelet_id'])) {
            $bracelet = LocationBracelet::where('group_id', $groupId)
                ->where('id', $validated['bracelet_id'])
                ->first();
            if ($bracelet) {
                $query->where('bracelet_mac', $bracelet->bracelet_mac);
            }
        } elseif (! empty($validated['bracelet_mac'])) {
            $query->where('bracelet_mac', $this->normalizeMac($validated['bracelet_mac']));
        }

        if (! empty($validated['from'])) {
            $query->where('recorded_at', '>=', Carbon::parse($validated['from']));
        }
        if (! empty($validated['to'])) {
            $query->where('recorded_at', '<=', Carbon::parse($validated['to']));
        }

        $limit = (int) ($validated['limit'] ?? 200);
        $events = $query->orderByDesc('recorded_at')->limit($limit)->get();

        $points = $events->map(fn (LocationPresenceEvent $e) => [
            'id' => $e->id,
            'bracelet_mac' => $e->bracelet_mac,
            'gateway_id' => $e->gateway_id,
            'gateway_mac' => $e->gateway_mac,
            'place_label' => $e->place_label,
            'rssi' => $e->rssi,
            'recorded_at' => $e->recorded_at?->toIso8601String(),
        ])->values();

        return response()->json([
            'success' => true,
            'points' => $points,
        ]);
    }

    /**
     * Membros do grupo elegíveis para associar à pulseira (paciente / acompanhado).
     */
    public function assignableMembers(int $groupId)
    {
        $this->assertGroupMember($groupId);

        $members = DB::table('group_members')
            ->join('users', 'group_members.user_id', '=', 'users.id')
            ->where('group_members.group_id', $groupId)
            ->where('group_members.is_active', true)
            ->select('users.id as user_id', 'users.name', 'users.email', 'group_members.role')
            ->orderBy('users.name')
            ->get()
            ->map(function ($m) {
                $role = $m->role === 'priority_contact' ? 'patient' : $m->role;

                return [
                    'user_id' => (int) $m->user_id,
                    'name' => $m->name,
                    'email' => $m->email,
                    'role' => $role,
                ];
            });

        return response()->json(['success' => true, 'members' => $members]);
    }

    // ─── helpers ───────────────────────────────────────────────────────────────

    private function resolveBestLocation($events): ?array
    {
        if ($events->isEmpty()) {
            return null;
        }

        $byGateway = [];
        foreach ($events as $event) {
            $key = $event->gateway_id ?: $event->gateway_mac;
            if (! isset($byGateway[$key]) || ($event->rssi ?? -999) > ($byGateway[$key]['rssi'] ?? -999)) {
                $byGateway[$key] = [
                    'gateway_id' => $event->gateway_id,
                    'gateway_mac' => $event->gateway_mac,
                    'place_label' => $event->place_label,
                    'rssi' => $event->rssi,
                    'recorded_at' => $event->recorded_at?->toIso8601String(),
                ];
            }
        }

        $best = null;
        foreach ($byGateway as $row) {
            if ($best === null || ($row['rssi'] ?? -999) > ($best['rssi'] ?? -999)) {
                $best = $row;
            }
        }

        return $best;
    }

    private function serializeGateway(LocationGateway $g): array
    {
        return [
            'id' => $g->id,
            'gateway_mac' => $g->gateway_mac,
            'device_name' => $g->device_name,
            'place_label' => $g->place_label,
            'place_description' => $g->place_description,
            'last_seen_at' => $g->last_seen_at?->toIso8601String(),
        ];
    }

    private function serializeBracelet(LocationBracelet $b): array
    {
        $memberName = $b->member_label
            ?: ($b->memberUser?->name)
            ?: null;

        return [
            'id' => $b->id,
            'bracelet_mac' => $b->bracelet_mac,
            'bracelet_name' => $b->bracelet_name,
            'member_user_id' => $b->member_user_id,
            'member_name' => $memberName,
            'member_label' => $b->member_label,
            'last_seen_at' => $b->last_seen_at?->toIso8601String(),
        ];
    }

    private function normalizeMac(string $mac): string
    {
        return strtoupper(preg_replace('/[^A-Fa-f0-9]/', '', $mac) ?? '');
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

    private function assertMemberInGroup(int $groupId, int $userId): void
    {
        $ok = GroupMember::where('group_id', $groupId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if (! $ok) {
            abort(422, 'O membro selecionado não pertence a este grupo.');
        }
    }
}
