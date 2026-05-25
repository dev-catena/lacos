<?php

namespace App\Services;

use App\Models\Device;
use App\Models\GroupMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class PanicWatchSyncService
{
    public function __construct(
        protected ThalamusSmartwatchClient $thalamus,
        protected NotificationService $notificationService,
    ) {}

    /**
     * Sincroniza alertas SOS dos relógios Thalamus com panic_events locais.
     *
     * @return array{created: int, skipped: int}
     */
    public function syncAll(?int $groupId = null): array
    {
        if (! Schema::hasTable('panic_events') || ! Schema::hasTable('devices')) {
            return ['created' => 0, 'skipped' => 0];
        }

        $query = Device::query()
            ->where('type', 'smartwatch')
            ->whereNotNull('group_id')
            ->whereNotNull('identifier')
            ->where('identifier', '!=', '');

        if ($groupId !== null) {
            $query->where('group_id', $groupId);
        }

        $created = 0;
        $skipped = 0;

        foreach ($query->get() as $device) {
            try {
                $result = $this->syncDevice($device);
                $created += $result['created'];
                $skipped += $result['skipped'];
            } catch (\Throwable $e) {
                Log::warning('PanicWatchSync: falha no dispositivo', [
                    'device_id' => $device->id,
                    'imei' => $device->identifier,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        return ['created' => $created, 'skipped' => $skipped];
    }

    /**
     * @return array{created: int, skipped: int}
     */
    public function syncDevice(Device $device): array
    {
        $imei = trim((string) $device->identifier);
        if ($imei === '' || ! $device->group_id) {
            return ['created' => 0, 'skipped' => 0];
        }

        $r = $this->thalamus->getSosAlerts($imei);
        if (! ($r['ok'] ?? false)) {
            return ['created' => 0, 'skipped' => 0];
        }

        $alerts = $this->normalizeSosAlerts($r['data'] ?? null);
        $created = 0;
        $skipped = 0;

        foreach ($alerts as $alert) {
            if (! $this->isActiveSosAlert($alert)) {
                $skipped++;

                continue;
            }

            $alertId = data_get($alert, 'id');
            if ($alertId !== null && $this->alertAlreadyTracked($imei, (int) $alertId)) {
                $skipped++;

                continue;
            }

            if ($this->hasRecentOngoingWatchPanic((int) $device->group_id, $imei)) {
                $skipped++;

                continue;
            }

            $userId = $this->resolvePanicUserId($device);
            if ($userId === null) {
                Log::warning('PanicWatchSync: grupo sem paciente para atribuir pânico do relógio', [
                    'group_id' => $device->group_id,
                    'imei' => $imei,
                ]);
                $skipped++;

                continue;
            }

            $latitude = data_get($alert, 'latitude');
            $longitude = data_get($alert, 'longitude');

            $eventId = DB::table('panic_events')->insertGetId([
                'group_id' => $device->group_id,
                'user_id' => $userId,
                'trigger_type' => 'watch',
                'device_imei' => $imei,
                'thalamus_alert_id' => $alertId,
                'latitude' => is_numeric($latitude) ? $latitude : null,
                'longitude' => is_numeric($longitude) ? $longitude : null,
                'location_address' => null,
                'call_status' => 'ongoing',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $panicEvent = DB::table('panic_events')->where('id', $eventId)->first();
            $this->notifyGroupAboutPanic((int) $device->group_id, $panicEvent, 'Relógio inteligente');
            $created++;
        }

        return ['created' => $created, 'skipped' => $skipped];
    }

    /**
     * @param  mixed  $data
     * @return list<array<string, mixed>>
     */
    protected function normalizeSosAlerts($data): array
    {
        if (! is_array($data)) {
            return [];
        }

        if ($this->looksLikeSosRow($data)) {
            return [$data];
        }

        $list = [];
        foreach ($data as $row) {
            if (is_array($row) && $this->looksLikeSosRow($row)) {
                $list[] = $row;
            }
        }

        return $list;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    protected function looksLikeSosRow(array $row): bool
    {
        return array_key_exists('latitude', $row)
            || array_key_exists('isSosAlert', $row)
            || array_key_exists('timestamp', $row);
    }

    /**
     * @param  array<string, mixed>  $alert
     */
    protected function isActiveSosAlert(array $alert): bool
    {
        if (array_key_exists('isSosAlert', $alert) && $alert['isSosAlert'] === false) {
            return false;
        }

        $timestamp = data_get($alert, 'timestamp');
        if (is_string($timestamp) && $timestamp !== '') {
            try {
                $at = \Carbon\Carbon::parse($timestamp);
                if ($at->lt(now()->subHours(6))) {
                    return false;
                }
            } catch (\Throwable) {
                // mantém alerta se timestamp inválido
            }
        }

        return true;
    }

    protected function alertAlreadyTracked(string $imei, int $alertId): bool
    {
        if (! Schema::hasColumn('panic_events', 'thalamus_alert_id')) {
            return false;
        }

        return DB::table('panic_events')
            ->where('device_imei', $imei)
            ->where('thalamus_alert_id', $alertId)
            ->exists();
    }

    protected function hasRecentOngoingWatchPanic(int $groupId, string $imei): bool
    {
        $query = DB::table('panic_events')
            ->where('group_id', $groupId)
            ->where('call_status', 'ongoing')
            ->where('trigger_type', 'watch');

        if (Schema::hasColumn('panic_events', 'device_imei')) {
            $query->where('device_imei', $imei);
        }

        return $query
            ->where('created_at', '>=', now()->subMinutes(30))
            ->exists();
    }

    protected function resolvePanicUserId(Device $device): ?int
    {
        if ($device->user_id) {
            return (int) $device->user_id;
        }

        $patient = DB::table('group_members')
            ->where('group_id', $device->group_id)
            ->whereIn('role', GroupMember::accompaniedPersonRoles())
            ->orderBy('id')
            ->first();

        return $patient ? (int) $patient->user_id : null;
    }

    /**
     * Notifica membros do grupo (exceto quem acionou) sobre pânico ativo.
     *
     * @param  object  $panicEvent
     */
    public function notifyGroupAboutPanic(int $groupId, object $panicEvent, ?string $sourceLabel = null): void
    {
        $triggerUserId = (int) $panicEvent->user_id;
        $triggerUser = User::find($triggerUserId);
        $patientName = $triggerUser?->name ?? 'Paciente';
        $source = $sourceLabel ?? ($panicEvent->trigger_type === 'watch' ? 'Relógio inteligente' : 'Botão de pânico');

        $title = '🚨 PÂNICO ACIONADO';
        $message = "{$patientName} acionou o pânico via {$source}.";

        $memberUserIds = DB::table('group_members')
            ->where('group_id', $groupId)
            ->where('user_id', '!=', $triggerUserId)
            ->whereNotIn('role', GroupMember::accompaniedPersonRoles())
            ->pluck('user_id')
            ->unique()
            ->values();

        foreach ($memberUserIds as $memberUserId) {
            $member = User::find($memberUserId);
            if (! $member) {
                continue;
            }

            $this->notificationService->sendNotification(
                $member,
                'panic',
                $title,
                $message,
                [
                    'group_id' => $groupId,
                    'panic_event_id' => $panicEvent->id,
                    'trigger_type' => $panicEvent->trigger_type,
                    'device_imei' => $panicEvent->device_imei ?? null,
                ],
                false,
                $groupId
            );
        }
    }
}
