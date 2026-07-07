<?php

namespace App\Console\Commands;

use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckVaccinationAlerts extends Command
{
    protected $signature   = 'vaccinations:check-alerts';
    protected $description = 'Envia alertas de vacinas próximas (7 dias) ou atrasadas para os membros do grupo.';

    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle(): int
    {
        $today = Carbon::today();

        // Grupos com módulo de vacinação ativo e data de nascimento disponível
        $groups = DB::table('groups as g')
            ->where('g.is_active', true)
            ->where(function ($q) {
                $q->where('g.module_vaccination', true)
                  ->orWhereRaw('1=0'); // fallback seguro
            })
            ->select('g.id', 'g.name')
            ->get();

        $this->info("Verificando {$groups->count()} grupo(s) com módulo de vacinação ativo.");

        foreach ($groups as $group) {
            $birthDate = $this->getBirthDate($group->id);

            if (!$birthDate) {
                continue;
            }

            $birth = Carbon::parse($birthDate);

            // Calendário PNI
            $schedules = DB::table('vaccine_schedules')->orderBy('age_months')->get();

            // Registros já aplicados indexados por vaccine_schedule_id
            $applied = DB::table('vaccination_records')
                ->where('group_id', $group->id)
                ->whereNotNull('vaccine_schedule_id')
                ->pluck('applied_at', 'vaccine_schedule_id');

            $adminsAndCaregivers = $this->getNotifiableMembers($group->id);

            foreach ($schedules as $schedule) {
                if (isset($applied[$schedule->id])) {
                    continue; // já aplicada
                }

                $dueDate = $birth->copy()->addMonths($schedule->age_months);

                $daysUntilDue = $today->diffInDays($dueDate, false); // negativo se atrasado

                if ($daysUntilDue >= 0 && $daysUntilDue <= 7) {
                    // Próxima em até 7 dias
                    $dateLabel = $dueDate->format('d/m/Y');
                    $this->sendToAll(
                        $adminsAndCaregivers,
                        $group->id,
                        'vaccination',
                        'Vacina em breve',
                        "{$schedule->vaccine_name} ({$schedule->dose}) está prevista para {$dateLabel}.",
                        ['vaccine_schedule_id' => $schedule->id, 'group_id' => $group->id, 'due_date' => $dueDate->toDateString()]
                    );
                } elseif ($daysUntilDue < 0) {
                    // Atrasada
                    $daysLate = abs((int)$daysUntilDue);
                    $this->sendToAll(
                        $adminsAndCaregivers,
                        $group->id,
                        'vaccination',
                        'Vacina atrasada',
                        "{$schedule->vaccine_name} ({$schedule->dose}) está atrasada há {$daysLate} dia(s).",
                        ['vaccine_schedule_id' => $schedule->id, 'group_id' => $group->id, 'due_date' => $dueDate->toDateString()]
                    );
                }
            }
        }

        $this->info('Verificação de alertas de vacinação concluída.');

        return Command::SUCCESS;
    }

    private function getBirthDate(int $groupId): ?string
    {
        $bd = DB::table('accompanied_people')
            ->where('group_id', $groupId)
            ->value('birth_date');

        if ($bd) return $bd;

        $patientUserId = DB::table('group_members')
            ->where('group_id', $groupId)
            ->whereIn('role', ['priority_contact', 'patient'])
            ->value('user_id');

        if ($patientUserId) {
            return DB::table('users')->where('id', $patientUserId)->value('birth_date');
        }

        return null;
    }

    private function getNotifiableMembers(int $groupId): \Illuminate\Support\Collection
    {
        return DB::table('group_members as gm')
            ->join('users as u', 'u.id', '=', 'gm.user_id')
            ->where('gm.group_id', $groupId)
            ->where('gm.is_active', true)
            ->whereIn('gm.role', ['admin', 'caregiver', 'health_professional'])
            ->select('u.id', 'u.name', 'u.email', 'u.phone')
            ->get();
    }

    private function sendToAll(\Illuminate\Support\Collection $members, int $groupId, string $type, string $title, string $message, array $data): void
    {
        foreach ($members as $member) {
            // Evitar duplicar notificação no mesmo dia
            $alreadySent = DB::table('notifications')
                ->where('user_id', $member->id)
                ->where('type', $type)
                ->where('title', $title)
                ->where('message', $message)
                ->whereDate('created_at', Carbon::today())
                ->exists();

            if ($alreadySent) continue;

            try {
                $userModel = \App\Models\User::find($member->id);
                if ($userModel) {
                    $this->notificationService->sendNotification(
                        $userModel,
                        $type,
                        $title,
                        $message,
                        $data,
                        false,
                        $groupId
                    );
                }
            } catch (\Exception $e) {
                Log::warning("CheckVaccinationAlerts: erro ao notificar user {$member->id}: " . $e->getMessage());
            }
        }
    }
}
