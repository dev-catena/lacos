<?php

namespace App\Services;

use App\Models\Group;
use App\Models\GroupMember;
use App\Models\GroupVitalBasal;
use App\Models\Notification;
use App\Models\User;
use App\Models\VitalSign;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class VitalSignBasalService
{
    public const TYPES = [
        'heart_rate',
        'oxygen_saturation',
        'blood_pressure',
        'temperature',
    ];

    /** 8 janelas de 3 horas no dia (0–3 … 21–24). */
    public const WINDOW_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

    public const MIN_WINDOWS = 4;

    public const ALERT_THRESHOLD_PERCENT = 50.0;

    protected NotificationService $notificationService;

    public function __construct(?NotificationService $notificationService = null)
    {
        $this->notificationService = $notificationService ?? app(NotificationService::class);
    }

    public function typeLabel(string $type): string
    {
        return match ($type) {
            'heart_rate' => 'frequência cardíaca',
            'oxygen_saturation' => 'saturação de oxigênio',
            'blood_pressure' => 'pressão arterial',
            'temperature' => 'temperatura',
            default => $type,
        };
    }

    public function defaultUnit(string $type): string
    {
        return match ($type) {
            'heart_rate' => 'bpm',
            'oxygen_saturation' => '%',
            'blood_pressure' => 'mmHg',
            'temperature' => '°C',
            default => '',
        };
    }

    /**
     * Extrai valor(es) numéricos de um VitalSign.
     * PA → ['systolic' => x, 'diastolic' => y]; demais → float|null.
     */
    public function extractValue(VitalSign $vitalSign): float|array|null
    {
        $value = $vitalSign->value;
        $type = $vitalSign->type;

        if ($type === 'blood_pressure') {
            if (is_array($value)) {
                $sys = $value['systolic'] ?? $value[0] ?? null;
                $dia = $value['diastolic'] ?? $value[1] ?? null;
                if (is_numeric($sys) && is_numeric($dia)) {
                    return [
                        'systolic' => (float) $sys,
                        'diastolic' => (float) $dia,
                    ];
                }
            }
            if (is_string($value) && str_contains($value, '/')) {
                [$sys, $dia] = array_map('trim', explode('/', $value, 2));
                if (is_numeric($sys) && is_numeric($dia)) {
                    return [
                        'systolic' => (float) $sys,
                        'diastolic' => (float) $dia,
                    ];
                }
            }

            return null;
        }

        if (is_array($value) && isset($value[0]) && is_numeric($value[0])) {
            return (float) $value[0];
        }
        if (is_numeric($value)) {
            return (float) $value;
        }

        return null;
    }

    /**
     * Calcula basal do dia: 1 amostra por janela de 3h (última da janela), média das janelas com dado.
     */
    public function calculateDailyBasal(int $groupId, string $type, ?Carbon $day = null): ?array
    {
        if (! in_array($type, self::TYPES, true)) {
            return null;
        }

        $tz = config('app.timezone', 'America/Sao_Paulo');
        $day = ($day ? $day->copy() : Carbon::now($tz))->timezone($tz)->startOfDay();
        $dayEnd = $day->copy()->endOfDay();

        $rows = VitalSign::where('group_id', $groupId)
            ->where('type', $type)
            ->whereBetween('measured_at', [$day, $dayEnd])
            ->orderBy('measured_at')
            ->get();

        if ($rows->isEmpty()) {
            return null;
        }

        $windowSamples = [];
        foreach (self::WINDOW_HOURS as $startHour) {
            $wStart = $day->copy()->addHours($startHour);
            $wEnd = $wStart->copy()->addHours(3);
            $inWindow = $rows->filter(function (VitalSign $vs) use ($wStart, $wEnd) {
                $at = Carbon::parse($vs->measured_at);

                return $at->gte($wStart) && $at->lt($wEnd);
            });
            if ($inWindow->isEmpty()) {
                continue;
            }
            /** @var VitalSign $pick */
            $pick = $inWindow->last();
            $extracted = $this->extractValue($pick);
            if ($extracted === null) {
                continue;
            }
            $windowSamples[] = $extracted;
        }

        $count = count($windowSamples);
        if ($count < self::MIN_WINDOWS) {
            return null;
        }

        if ($type === 'blood_pressure') {
            $sys = [];
            $dia = [];
            foreach ($windowSamples as $sample) {
                if (is_array($sample)) {
                    $sys[] = $sample['systolic'];
                    $dia[] = $sample['diastolic'];
                }
            }
            if (count($sys) < self::MIN_WINDOWS) {
                return null;
            }

            return [
                'systolic' => round(array_sum($sys) / count($sys), 1),
                'diastolic' => round(array_sum($dia) / count($dia), 1),
                'samples_used' => count($sys),
                'unit' => 'mmHg',
            ];
        }

        $nums = array_map('floatval', $windowSamples);

        return [
            'value' => round(array_sum($nums) / count($nums), 2),
            'samples_used' => count($nums),
            'unit' => $this->defaultUnit($type),
        ];
    }

    /**
     * Persiste basal do dia para o grupo/tipo.
     */
    public function storeDailyBasal(int $groupId, string $type, ?Carbon $day = null): ?GroupVitalBasal
    {
        if (! Schema::hasTable('group_vital_basals')) {
            return null;
        }

        $computed = $this->calculateDailyBasal($groupId, $type, $day);
        if ($computed === null) {
            return null;
        }

        $tz = config('app.timezone', 'America/Sao_Paulo');
        $date = ($day ? $day->copy() : Carbon::now($tz))->timezone($tz)->toDateString();

        $payloadValue = $type === 'blood_pressure'
            ? [
                'systolic' => $computed['systolic'],
                'diastolic' => $computed['diastolic'],
            ]
            : ['value' => $computed['value']];

        return GroupVitalBasal::updateOrCreate(
            [
                'group_id' => $groupId,
                'basal_date' => $date,
                'type' => $type,
            ],
            [
                'value' => $payloadValue,
                'samples_used' => $computed['samples_used'],
                'unit' => $computed['unit'] ?? $this->defaultUnit($type),
            ]
        );
    }

    public function computeAllForGroup(int $groupId, ?Carbon $day = null): int
    {
        $saved = 0;
        foreach (self::TYPES as $type) {
            if ($this->storeDailyBasal($groupId, $type, $day)) {
                $saved++;
            }
        }

        return $saved;
    }

    /**
     * Basal de referência: preferir o dia anterior gravado; senão recalcular últimas 24h em 8 janelas.
     */
    public function getReferenceBasal(int $groupId, string $type): ?array
    {
        if (! in_array($type, self::TYPES, true)) {
            return null;
        }

        $tz = config('app.timezone', 'America/Sao_Paulo');
        $yesterday = Carbon::now($tz)->subDay()->startOfDay();

        if (Schema::hasTable('group_vital_basals')) {
            $row = GroupVitalBasal::where('group_id', $groupId)
                ->where('type', $type)
                ->where('basal_date', '<=', $yesterday->toDateString())
                ->orderByDesc('basal_date')
                ->first();

            if ($row) {
                return [
                    'value' => $row->value,
                    'samples_used' => $row->samples_used,
                    'unit' => $row->unit,
                    'basal_date' => optional($row->basal_date)->toDateString(),
                    'source' => 'stored',
                ];
            }
        }

        // Fallback: calcular o dia de ontem na hora
        $computed = $this->calculateDailyBasal($groupId, $type, $yesterday);
        if ($computed === null) {
            return null;
        }

        return [
            'value' => $type === 'blood_pressure'
                ? ['systolic' => $computed['systolic'], 'diastolic' => $computed['diastolic']]
                : ['value' => $computed['value']],
            'samples_used' => $computed['samples_used'],
            'unit' => $computed['unit'] ?? $this->defaultUnit($type),
            'basal_date' => $yesterday->toDateString(),
            'source' => 'computed',
        ];
    }

    /**
     * Retorna variação % se >= 50%; senão null.
     * PA: alerta se sistólica OU diastólica exceder o limiar.
     */
    public function changePercentAgainstBasal(VitalSign $vitalSign, ?array $basalRef = null): ?array
    {
        $type = $vitalSign->type;
        if (! in_array($type, self::TYPES, true)) {
            return null;
        }

        $basalRef = $basalRef ?? $this->getReferenceBasal((int) $vitalSign->group_id, $type);
        if ($basalRef === null) {
            return null;
        }

        $current = $this->extractValue($vitalSign);
        if ($current === null) {
            return null;
        }

        $basalValue = $basalRef['value'];

        if ($type === 'blood_pressure') {
            $bSys = (float) ($basalValue['systolic'] ?? 0);
            $bDia = (float) ($basalValue['diastolic'] ?? 0);
            $cSys = (float) ($current['systolic'] ?? 0);
            $cDia = (float) ($current['diastolic'] ?? 0);
            if ($bSys <= 0 || $bDia <= 0) {
                return null;
            }
            $pctSys = abs(($cSys - $bSys) / $bSys) * 100;
            $pctDia = abs(($cDia - $bDia) / $bDia) * 100;
            $pct = max($pctSys, $pctDia);
            if ($pct < self::ALERT_THRESHOLD_PERCENT) {
                return null;
            }

            return [
                'change_percent' => round($pct, 1),
                'current' => $current,
                'basal' => ['systolic' => $bSys, 'diastolic' => $bDia],
                'unit' => 'mmHg',
            ];
        }

        $b = (float) ($basalValue['value'] ?? $basalValue[0] ?? 0);
        $c = (float) $current;
        if ($b <= 0) {
            return null;
        }
        $pct = abs(($c - $b) / $b) * 100;
        if ($pct < self::ALERT_THRESHOLD_PERCENT) {
            return null;
        }

        return [
            'change_percent' => round($pct, 1),
            'current' => $c,
            'basal' => $b,
            'unit' => $basalRef['unit'] ?? $this->defaultUnit($type),
        ];
    }

    /**
     * Notifica demais membros do grupo (não acompanhado) sobre desvio >50% da basal.
     */
    public function notifyGroupIfBasalExceeded(VitalSign $vitalSign): int
    {
        $diff = $this->changePercentAgainstBasal($vitalSign);
        if ($diff === null) {
            return 0;
        }

        $existing = Notification::where('type', 'vital_sign')
            ->where('group_id', $vitalSign->group_id)
            ->where('created_at', '>=', Carbon::now()->subHours(1))
            ->where(function ($q) use ($vitalSign) {
                $q->where('data->vital_sign_id', $vitalSign->id)
                    ->orWhere(function ($q2) use ($vitalSign) {
                        $q2->where('data->action_type', 'vital_sign_basal_alert')
                            ->where('data->vital_sign_type', $vitalSign->type);
                    });
            })
            ->exists();

        if ($existing) {
            return 0;
        }

        $group = Group::find($vitalSign->group_id);
        if (! $group) {
            return 0;
        }

        $patientMember = GroupMember::where('group_id', $group->id)
            ->whereIn('role', GroupMember::accompaniedPersonRoles())
            ->first();
        $patient = $patientMember ? User::find($patientMember->user_id) : null;
        $patientName = $patient?->name ?? ($group->accompanied_name ?: 'Paciente');

        $members = GroupMember::where('group_id', $group->id)
            ->whereNotIn('role', GroupMember::accompaniedPersonRoles())
            ->where('user_id', '!=', (int) $vitalSign->recorded_by)
            ->get();

        $typeLabel = $this->typeLabel($vitalSign->type);
        $pct = $diff['change_percent'];

        if ($vitalSign->type === 'blood_pressure') {
            $basalTxt = ($diff['basal']['systolic'] ?? '?').'/'.($diff['basal']['diastolic'] ?? '?');
            $curTxt = ($diff['current']['systolic'] ?? '?').'/'.($diff['current']['diastolic'] ?? '?');
        } else {
            $basalTxt = number_format((float) $diff['basal'], 1);
            $curTxt = number_format((float) $diff['current'], 1);
        }
        $unit = $diff['unit'] ?? '';

        $title = 'Alerta: sinal vital fora da basal';
        $message = "{$patientName}: {$typeLabel} variou {$pct}% em relação à basal.\n";
        $message .= "Basal: {$basalTxt} {$unit}\n";
        $message .= "Atual: {$curTxt} {$unit}";

        $sent = 0;
        foreach ($members as $member) {
            $user = User::find($member->user_id);
            if (! $user) {
                continue;
            }
            // Preferência de alteração basal; fallback para alertas de vitais
            $ok = $this->notificationService->hasNotificationPreference($user, 'vital_signs_basal_change')
                || $this->notificationService->hasNotificationPreference($user, 'vital_signs_abnormal')
                || $this->notificationService->hasNotificationPreference($user, 'vital_signs_alerts');
            if (! $ok) {
                continue;
            }

            $this->notificationService->sendNotification(
                $user,
                'vital_sign',
                $title,
                $message,
                [
                    'vital_sign_id' => $vitalSign->id,
                    'group_id' => $vitalSign->group_id,
                    'patient_name' => $patientName,
                    'vital_sign_type' => $vitalSign->type,
                    'action_type' => 'vital_sign_basal_alert',
                    'basal_value' => $diff['basal'],
                    'current_value' => $diff['current'],
                    'change_percent' => $pct,
                ],
                false,
                $vitalSign->group_id
            );
            $sent++;
        }

        if ($sent > 0) {
            Log::info('VitalSignBasalService alert sent', [
                'group_id' => $vitalSign->group_id,
                'type' => $vitalSign->type,
                'change_percent' => $pct,
                'sent' => $sent,
            ]);
        }

        return $sent;
    }
}
