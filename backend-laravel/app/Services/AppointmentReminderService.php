<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AppointmentReminderService
{
    /** Presets do app (AddAppointmentScreen reminderOption). Valores em minutos antes do horário. */
    public const REMINDER_PRESETS = [
        '1' => [1440, 180, 60, 15],
        '2' => [180, 60, 15],
        '3' => [60, 15],
        '4' => [15],
    ];

    public const DEFAULT_REMINDER_MINUTES = [1440, 180, 60, 15];

    protected NotificationService $notificationService;

    public function __construct(?NotificationService $notificationService = null)
    {
        $this->notificationService = $notificationService ?? app(NotificationService::class);
    }

    /**
     * @param  mixed  $reminderTimes  JSON/array ou preset "1".."4"
     * @return int[]
     */
    public static function normalizeReminderMinutes($reminderTimes): array
    {
        if ($reminderTimes === null || $reminderTimes === '') {
            return self::DEFAULT_REMINDER_MINUTES;
        }

        if (is_string($reminderTimes) && isset(self::REMINDER_PRESETS[$reminderTimes])) {
            return self::REMINDER_PRESETS[$reminderTimes];
        }

        if (is_string($reminderTimes)) {
            $decoded = json_decode($reminderTimes, true);
            if (is_array($decoded)) {
                $reminderTimes = $decoded;
            }
        }

        if (! is_array($reminderTimes)) {
            return self::DEFAULT_REMINDER_MINUTES;
        }

        $minutes = array_values(array_unique(array_map('intval', array_filter($reminderTimes, fn ($v) => is_numeric($v) && (int) $v > 0))));
        rsort($minutes);

        return $minutes ?: self::DEFAULT_REMINDER_MINUTES;
    }

    public static function reminderLabel(int $minutes): string
    {
        return match ($minutes) {
            1440, 1441 => '24 horas',
            180 => '3 horas',
            60 => '1 hora',
            15 => '15 minutos',
            default => $minutes >= 60
                ? (int) floor($minutes / 60).' hora(s)'
                : $minutes.' minuto(s)',
        };
    }

    /**
     * @return Carbon[] Chaves Y-m-d H:i:s
     */
    public function expandOccurrences(Appointment $appointment, Carbon $rangeStart, Carbon $rangeEnd, string $timezone = 'America/Sao_Paulo'): array
    {
        $base = Carbon::parse($appointment->scheduled_at ?? $appointment->appointment_date)->setTimezone($timezone);
        $recurrenceType = $appointment->recurrence_type ?? 'none';

        if (! $recurrenceType || $recurrenceType === 'none') {
            if ($base->betweenIncluded($rangeStart, $rangeEnd)) {
                return [$base->format('Y-m-d H:i:s') => $base->copy()];
            }

            return [];
        }

        $recurrenceEnd = $appointment->recurrence_end
            ? Carbon::parse($appointment->recurrence_end)->setTimezone($timezone)->endOfDay()
            : $rangeEnd->copy();

        $recurrenceDays = $appointment->recurrence_days;
        if (is_string($recurrenceDays)) {
            $recurrenceDays = json_decode($recurrenceDays, true) ?: [];
        }
        if (! is_array($recurrenceDays)) {
            $recurrenceDays = [];
        }

        $exceptionDates = $appointment->relationLoaded('exceptions')
            ? $appointment->exceptions->pluck('exception_date')->map(fn ($d) => Carbon::parse($d)->format('Y-m-d'))->all()
            : $appointment->exceptions()->pluck('exception_date')->map(fn ($d) => Carbon::parse($d)->format('Y-m-d'))->all();

        $occurrences = [];
        $current = $base->copy()->startOfDay();
        $lastDay = $recurrenceEnd->copy()->startOfDay();
        if ($lastDay->gt($rangeEnd)) {
            $lastDay = $rangeEnd->copy()->startOfDay();
        }

        while ($current->lte($lastDay)) {
            $include = match ($recurrenceType) {
                'daily' => true,
                'weekdays' => $current->dayOfWeek >= Carbon::MONDAY && $current->dayOfWeek <= Carbon::FRIDAY,
                'custom' => in_array($current->dayOfWeek, array_map('intval', $recurrenceDays), true),
                default => false,
            };

            if ($include) {
                $occurrence = $current->copy()->setTime($base->hour, $base->minute, $base->second);
                $dateKey = $occurrence->format('Y-m-d');

                if (! in_array($dateKey, $exceptionDates, true) && $occurrence->betweenIncluded($rangeStart, $rangeEnd)) {
                    $occurrences[$occurrence->format('Y-m-d H:i:s')] = $occurrence->copy();
                }
            }

            $current->addDay();
        }

        return $occurrences;
    }

    public function buildDetailsMessage(Appointment $appointment, ?Carbon $occurrenceAt = null, string $timezone = 'America/Sao_Paulo'): string
    {
        $when = ($occurrenceAt ?? Carbon::parse($appointment->scheduled_at ?? $appointment->appointment_date))
            ->setTimezone($timezone);

        $typeLabels = [
            'common' => 'Compromisso',
            'medical' => 'Consulta médica',
            'fisioterapia' => 'Sessão de fisioterapia',
            'exames' => 'Exame',
        ];
        $typeLabel = $typeLabels[$appointment->type] ?? 'Compromisso';

        $lines = [
            "📋 {$typeLabel}",
            "Título: {$appointment->title}",
            'Data/horário: '.$when->format('d/m/Y \à\s H:i'),
        ];

        if ($appointment->description) {
            $lines[] = "Descrição: {$appointment->description}";
        }
        if ($appointment->location) {
            $lines[] = "Local: {$appointment->location}";
        }
        if ($appointment->notes) {
            $lines[] = "Observações: {$appointment->notes}";
        }

        $recurrenceType = $appointment->recurrence_type ?? 'none';
        if ($recurrenceType && $recurrenceType !== 'none') {
            $recurrenceLabels = [
                'daily' => 'Diariamente',
                'weekdays' => 'Segunda a sexta',
                'custom' => 'Personalizado',
            ];
            $recLabel = $recurrenceLabels[$recurrenceType] ?? $recurrenceType;
            $end = $appointment->recurrence_end
                ? Carbon::parse($appointment->recurrence_end)->setTimezone($timezone)->format('d/m/Y')
                : null;
            $lines[] = 'Periodicidade: '.$recLabel.($end ? " (até {$end})" : '');
        }

        $reminderMinutes = self::normalizeReminderMinutes($appointment->reminder_times);
        if (! empty($reminderMinutes)) {
            $labels = array_map(fn ($m) => self::reminderLabel((int) $m), $reminderMinutes);
            $lines[] = 'Lembretes: '.implode(', ', $labels).' antes';
        }

        return implode("\n", $lines);
    }

    /**
     * Processa lembretes programados (cron).
     */
    public function processDueReminders(string $timezone = 'America/Sao_Paulo'): int
    {
        $now = Carbon::now($timezone);
        $sentCount = 0;

        $appointments = Appointment::query()
            ->where(function ($q) {
                $q->whereNull('status')
                    ->orWhereNotIn('status', ['cancelled', 'cancelada', 'completed']);
            })
            ->with(['group.members', 'exceptions'])
            ->get();

        foreach ($appointments as $appointment) {
            if ($appointment->is_teleconsultation) {
                continue;
            }

            $reminderMinutes = self::normalizeReminderMinutes($appointment->reminder_times);
            $rangeStart = $now->copy()->subMinutes(5);
            $rangeEnd = $now->copy()->addHours(25);

            $occurrences = $this->expandOccurrences($appointment, $rangeStart, $rangeEnd, $timezone);

            foreach ($occurrences as $occurrence) {
                foreach ($reminderMinutes as $offsetMinutes) {
                    $offsetMinutes = (int) $offsetMinutes;
                    $remindAt = $occurrence->copy()->subMinutes($offsetMinutes);

                    if ($remindAt->gt($now) || $remindAt->lt($now->copy()->subMinutes(5))) {
                        continue;
                    }

                    $sentCount += $this->notifyGroupMembers(
                        $appointment,
                        $occurrence,
                        $offsetMinutes,
                        $timezone
                    );
                }
            }
        }

        return $sentCount;
    }

    protected function notifyGroupMembers(
        Appointment $appointment,
        Carbon $occurrence,
        int $offsetMinutes,
        string $timezone
    ): int {
        $group = $appointment->group;
        if (! $group) {
            return 0;
        }

        $instanceDate = $occurrence->format('Y-m-d');
        $label = self::reminderLabel($offsetMinutes);
        $title = "Lembrete: consulta em {$label}";
        $details = $this->buildDetailsMessage($appointment, $occurrence, $timezone);
        $message = "Faltam {$label} para o compromisso abaixo:\n\n{$details}";

        $members = $group->members()
            ->where(function ($q) {
                $q->where('is_active', true)->orWhereNull('is_active');
            })
            ->get();

        $sent = 0;

        foreach ($members as $member) {
            $user = User::find($member->user_id);
            if (! $user) {
                continue;
            }

            if (! $this->notificationService->hasNotificationPreference($user, 'appointment_reminders')) {
                continue;
            }

            if ($this->wasReminderAlreadySent($user->id, $appointment->id, $instanceDate, $offsetMinutes)) {
                continue;
            }

            $this->notificationService->sendNotification(
                $user,
                'appointment_reminder',
                $title,
                $message,
                [
                    'appointment_id' => $appointment->id,
                    'instance_date' => $instanceDate,
                    'reminder_minutes' => $offsetMinutes,
                    'group_id' => $appointment->group_id,
                    'appointment_title' => $appointment->title,
                    'appointment_date' => $occurrence->toIso8601String(),
                    'appointment_type' => $appointment->type,
                    'action_type' => 'appointment_reminder',
                ],
                false,
                $appointment->group_id
            );

            $sent++;
        }

        return $sent;
    }

    protected function wasReminderAlreadySent(int $userId, int $appointmentId, string $instanceDate, int $offsetMinutes): bool
    {
        return Notification::query()
            ->where('user_id', $userId)
            ->where('type', 'appointment_reminder')
            ->where('created_at', '>=', Carbon::now()->subHours(3))
            ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '$.appointment_id')) = ?", [(string) $appointmentId])
            ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '$.instance_date')) = ?", [$instanceDate])
            ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '$.reminder_minutes')) = ?", [(string) $offsetMinutes])
            ->exists();
    }
}
