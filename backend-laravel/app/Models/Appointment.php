<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'type',
        'medical_specialty_id',
        'doctor_id',
        'title',
        'description',
        'appointment_date',
        'scheduled_at',
        'location',
        'status',
        'notes',
        'recurrence_type',
        'recurrence_days',
        'recurrence_start',
        'recurrence_end',
        'is_teleconsultation',
        'created_by_user_id',
        // Campos de pagamento
        'payment_status',
        'amount',
        'payment_id',
        'payment_hold_id',
        'refund_id',
        'paid_at',
        'held_at',
        'released_at',
        'refunded_at',
        'confirmed_at',
        'confirmed_by',
        'cancelled_by',
        'doctor_amount',
        'platform_amount',
        'reserved_until',
        // Rastreamento de entrada na videoconferência (janela: 15 min antes até 40 min depois)
        'doctor_joined_at',
        'patient_joined_at',
        'patient_joined_by_user_id',
        'absence_detected_at',
    ];

    protected $casts = [
        'appointment_date' => 'datetime',
        'scheduled_at' => 'datetime',
        'recurrence_start' => 'datetime',
        'recurrence_end' => 'datetime',
        'is_teleconsultation' => 'boolean',
        'amount' => 'decimal:2',
        'doctor_amount' => 'decimal:2',
        'platform_amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'held_at' => 'datetime',
        'released_at' => 'datetime',
        'refunded_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'reserved_until' => 'datetime',
        'doctor_joined_at' => 'datetime',
        'patient_joined_at' => 'datetime',
        'absence_detected_at' => 'datetime',
    ];

    // Relacionamentos
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * Resolve users.id do médico da plataforma quando doctor_id aponta para doctors.
     */
    private static function resolvePlatformUserIdForDoctorRow(object $doctor): ?int
    {
        if (Schema::hasColumn('doctors', 'user_id') && !empty($doctor->user_id)) {
            return (int) $doctor->user_id;
        }

        $email = isset($doctor->email) ? trim((string) $doctor->email) : '';
        if ($email !== '') {
            $normalized = strtolower($email);
            $ids = DB::table('users')
                ->where('profile', 'doctor')
                ->whereRaw('LOWER(TRIM(email)) = ?', [$normalized])
                ->pluck('id');
            if ($ids->count() === 1) {
                return (int) $ids->first();
            }
        }

        $crm = isset($doctor->crm) ? trim((string) $doctor->crm) : '';
        if ($crm !== '' && Schema::hasColumn('users', 'crm')) {
            $ids = DB::table('users')
                ->where('profile', 'doctor')
                ->whereRaw('TRIM(crm) = ?', [$crm])
                ->pluck('id');
            if ($ids->count() === 1) {
                return (int) $ids->first();
            }
        }

        return null;
    }

    /**
     * Usuário médico (tabela users) para envio de notificações, a partir de doctors.id ou users.id.
     */
    public static function resolveDoctorUserForNotification(?int $doctorId): ?User
    {
        if ($doctorId === null || $doctorId <= 0) {
            return null;
        }

        $asUser = User::where('id', $doctorId)->where('profile', 'doctor')->first();
        if ($asUser) {
            return $asUser;
        }

        $doctor = DB::table('doctors')->where('id', $doctorId)->first();
        if (!$doctor) {
            return null;
        }

        $platformId = self::resolvePlatformUserIdForDoctorRow($doctor);
        if (!$platformId) {
            return null;
        }

        return User::where('id', $platformId)->where('profile', 'doctor')->first();
    }

    /**
     * Ambíguo se houver homônimos; usado quando doctor_id veio vazio e o título parece nome do médico.
     */
    private static function resolveDoctorUserByNameGuess(string $rawTitle): ?User
    {
        $trimmed = trim($rawTitle);
        if ($trimmed === '') {
            return null;
        }

        $base = trim(preg_replace('/^(dra\.?|dr\.?|doutora\.?|doutor\.?)\s+/iu', '', $trimmed));
        if ($base === '') {
            $base = $trimmed;
        }

        $candidates = array_values(array_unique(array_filter([$trimmed, $base])));
        $q = User::query()->where('profile', 'doctor');
        $q->where(function ($sub) use ($candidates) {
            foreach ($candidates as $c) {
                $sub->orWhereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower($c)]);
            }
        });

        $users = $q->get();
        if ($users->count() === 1) {
            return $users->first();
        }

        return null;
    }

    private static function honorificFromTitleString(string $title): ?string
    {
        $t = trim($title);
        if ($t === '') {
            return null;
        }
        if (preg_match('/^(dra\.?|doutora\.?)\s+/iu', $t)) {
            return 'Dra.';
        }
        if (preg_match('/^(dr\.?|doutor\.?)\s+/iu', $t)) {
            return 'Dr.';
        }

        return null;
    }

    /**
     * Linha do médico em textos de atividade/notificação (ex.: "Dra. Marcela — Cardiologia").
     */
    public static function doctorLineForActivityDescription(self $appointment): ?string
    {
        if (($appointment->type ?? '') !== 'medical') {
            return null;
        }

        $docUser = null;
        if (! empty($appointment->doctor_id)) {
            $docUser = self::resolveDoctorUserForNotification((int) $appointment->doctor_id);
        }
        if ($docUser === null) {
            $docUser = self::resolveDoctorUserByNameGuess((string) ($appointment->title ?? ''));
        }

        $titleStr = trim((string) ($appointment->title ?? ''));
        if ($docUser === null && $titleStr === '') {
            return null;
        }

        $rawName = $docUser?->name ?? $appointment->title ?? '';
        $baseName = trim(preg_replace('/^(dra\.?|dr\.?|doutora\.?|doutor\.?)\s+/iu', '', (string) $rawName));
        if ($baseName === '') {
            $baseName = $titleStr !== '' ? trim(preg_replace('/^(dra\.?|dr\.?|doutora\.?|doutor\.?)\s+/iu', '', $titleStr)) : '';
        }
        if ($baseName === '') {
            $baseName = 'Médico(a)';
        }

        $honorific = self::honorificFromTitleString($titleStr) ?? 'Dr(a).';
        if ($docUser !== null && $docUser->gender !== null && (string) $docUser->gender !== '') {
            $g = mb_strtolower(trim((string) $docUser->gender));
            if (in_array($g, ['f', 'female', 'feminino', 'mulher', 'fem'], true)) {
                $honorific = 'Dra.';
            } elseif (in_array($g, ['m', 'male', 'masculino', 'homem', 'mas'], true)) {
                $honorific = 'Dr.';
            }
        }

        $specialty = null;
        if (! empty($appointment->medical_specialty_id) && Schema::hasTable('medical_specialties')) {
            $row = DB::table('medical_specialties')->where('id', $appointment->medical_specialty_id)->value('name');
            $specialty = $row ? (string) $row : null;
        }
        if (($specialty === null || $specialty === '') && $docUser && ! empty($docUser->medical_specialty_id) && Schema::hasTable('medical_specialties')) {
            $row = DB::table('medical_specialties')->where('id', $docUser->medical_specialty_id)->value('name');
            $specialty = $row ? (string) $row : null;
        }
        if (($specialty === null || $specialty === '') && ! empty($appointment->doctor_id)) {
            $doctorRow = DB::table('doctors')->where('id', $appointment->doctor_id)->first();
            if ($doctorRow && ! empty($doctorRow->specialty)) {
                $specialty = trim((string) $doctorRow->specialty);
            }
        }
        if (($specialty === null || $specialty === '') && $docUser && Schema::hasTable('doctors') && Schema::hasColumn('doctors', 'user_id')) {
            $doctorRow = DB::table('doctors')->where('user_id', $docUser->id)->first();
            if ($doctorRow && ! empty($doctorRow->specialty)) {
                $specialty = trim((string) $doctorRow->specialty);
            }
        }

        if ($specialty === null || $specialty === '') {
            $specialty = 'Clínica Médica';
        }

        $label = trim($honorific.' '.$baseName);
        if ($specialty !== null && $specialty !== '') {
            $label .= ' — '.$specialty;
        }

        return $label;
    }

    /**
     * Accessor para obter dados do médico (de doctors ou users)
     */
    public function getDoctorUserAttribute()
    {
        if (!$this->doctor_id) {
            return null;
        }

        // Primeiro tentar buscar na tabela doctors
        $doctor = DB::table('doctors')->where('id', $this->doctor_id)->first();
        if ($doctor) {
            $platformUserId = self::resolvePlatformUserIdForDoctorRow($doctor);

            return (object) [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'crm' => $doctor->crm,
                'specialty' => $doctor->specialty,
                'source' => 'doctors',
                'platform_user_id' => $platformUserId,
            ];
        }

        // Se não encontrou, buscar na tabela users com profile='doctor'
        $userDoctor = DB::table('users')
            ->where('id', $this->doctor_id)
            ->where('profile', 'doctor')
            ->first();

        if ($userDoctor) {
            $uid = (int) $userDoctor->id;

            return (object) [
                'id' => $uid,
                'name' => $userDoctor->name,
                'crm' => $userDoctor->crm ?? null,
                'consultation_price' => $userDoctor->consultation_price ?? null,
                'specialty' => null,
                'source' => 'users',
                'platform_user_id' => $uid,
            ];
        }

        return null;
    }

    public function audioRecordings()
    {
        return $this->hasMany(AudioRecording::class);
    }

    /**
     * Relacionamento com Exceções (datas excluídas de recorrências)
     */
    public function exceptions()
    {
        return $this->hasMany(AppointmentException::class);
    }

    /**
     * IDs em appointments.doctor_id que referem o mesmo médico (users.id ou doctors.id).
     *
     * @return int[]
     */
    public static function doctorIdCandidatesForSameDoctor(?int $doctorId): array
    {
        if ($doctorId === null || $doctorId <= 0) {
            return [];
        }

        $ids = [];
        $seen = [];
        $add = function (int $id) use (&$ids, &$seen) {
            if ($id <= 0 || isset($seen[$id])) {
                return;
            }
            $seen[$id] = true;
            $ids[] = $id;
        };

        $add((int) $doctorId);

        $userDoctor = DB::table('users')
            ->where('id', $doctorId)
            ->where('profile', 'doctor')
            ->first();
        if ($userDoctor) {
            foreach (DB::table('doctors')->where('user_id', $doctorId)->pluck('id') as $did) {
                $add((int) $did);
            }
        }

        $doctorRow = DB::table('doctors')->where('id', $doctorId)->first();
        if ($doctorRow) {
            $platformId = self::resolvePlatformUserIdForDoctorRow($doctorRow);
            if ($platformId) {
                $add($platformId);
                foreach (DB::table('doctors')->where('user_id', $platformId)->pluck('id') as $did) {
                    $add((int) $did);
                }
            }
        }

        return $ids;
    }

    /**
     * Status de compromisso considerado cancelado (PT/EN, case-insensitive).
     */
    public static function appointmentStatusIsCancelled(?string $status): bool
    {
        $s = strtolower(trim((string) ($status ?? '')));

        return in_array($s, ['cancelled', 'cancelada', 'canceled'], true);
    }

    /**
     * Teleconsulta ainda ocupa o horário (reserva ativa ou já paga/liberada).
     *
     * Importante: antes, "pending" só ocupava enquanto reserved_until > now (~10 min de hold).
     * Após expirar o hold, o slot sumia do filtro exclude_booked e voltava na lista para outros
     * grupos, embora o compromisso continuasse no banco — comportamento incorreto.
     * Enquanto não estiver cancelado ou reembolsado, o horário permanece indisponível.
     */
    public static function teleconsultationSlotStillOccupied(self $appointment, ?Carbon $now = null): bool
    {
        if (self::appointmentStatusIsCancelled($appointment->status) || ! $appointment->is_teleconsultation) {
            return false;
        }

        if ($appointment->payment_status === 'refunded') {
            return false;
        }

        return true;
    }

    /**
     * O compromisso ainda ocupa o slot na agenda pública (teleconsulta ou presencial).
     * Usado para GET /doctors/{id}/availability?exclude_booked e conflito ao criar teleconsulta.
     *
     * Teleconsulta reembolsada não ocupa; demais tipos seguem desde que não cancelados.
     */
    public static function calendarSlotOccupiedForAvailability(self $appointment): bool
    {
        if (self::appointmentStatusIsCancelled($appointment->status)) {
            return false;
        }
        if ($appointment->is_teleconsultation && $appointment->payment_status === 'refunded') {
            return false;
        }

        return true;
    }

    /**
     * Mapa `Y-m-d H:i` (fuso $timezone) → true para slots já ocupados pelo médico.
     * Inclui consulta presencial e teleconsulta; evita depender só de is_teleconsultation no banco.
     *
     * @return array<string, true>
     */
    public static function teleconsultationOccupiedSlotKeyMap(?int $doctorId, string $timezone = 'America/Sao_Paulo'): array
    {
        $candidates = self::doctorIdCandidatesForSameDoctor($doctorId);
        if ($candidates === []) {
            return [];
        }

        $appts = self::query()
            ->whereNotNull('doctor_id')
            ->where('doctor_id', '>', 0)
            ->whereRaw('LOWER(TRIM(COALESCE(status, ""))) NOT IN (?, ?, ?)', ['cancelled', 'cancelada', 'canceled'])
            ->whereIn('doctor_id', $candidates)
            ->get(['id', 'scheduled_at', 'appointment_date', 'status', 'payment_status', 'is_teleconsultation']);

        $map = [];
        foreach ($appts as $appt) {
            if (! self::calendarSlotOccupiedForAvailability($appt)) {
                continue;
            }
            $dt = $appt->scheduled_at ?? $appt->appointment_date;
            if (! $dt) {
                continue;
            }
            $key = $dt->copy()->timezone($timezone)->format('Y-m-d H:i');
            $map[$key] = true;
        }

        return $map;
    }

    /**
     * Para cada users.id de médico da plataforma, mapa de chaves `Y-m-d H:i` (em $timezone) já ocupadas.
     * Uma única query de compromissos para a lista GET /doctors (next_slot_at / has_future_availability).
     *
     * @param  array<int>  $platformUserIds
     * @return array<int, array<string, true>>
     */
    public static function occupiedCalendarSlotKeyMapsForPlatformUserIds(array $platformUserIds, string $timezone = 'America/Sao_Paulo'): array
    {
        $platformUserIds = array_values(array_unique(array_filter(array_map('intval', $platformUserIds), fn ($id) => $id > 0)));
        if ($platformUserIds === []) {
            return [];
        }

        $userToCandidates = [];
        $candidateSet = [];
        foreach ($platformUserIds as $uid) {
            $cands = self::doctorIdCandidatesForSameDoctor($uid);
            $userToCandidates[$uid] = $cands;
            foreach ($cands as $c) {
                $candidateSet[$c] = true;
            }
        }
        $candidateList = array_keys($candidateSet);
        if ($candidateList === []) {
            return array_fill_keys($platformUserIds, []);
        }

        $appts = self::query()
            ->whereNotNull('doctor_id')
            ->where('doctor_id', '>', 0)
            ->whereRaw('LOWER(TRIM(COALESCE(status, ""))) NOT IN (?, ?, ?)', ['cancelled', 'cancelada', 'canceled'])
            ->whereIn('doctor_id', $candidateList)
            ->get(['doctor_id', 'scheduled_at', 'appointment_date', 'status', 'payment_status', 'is_teleconsultation']);

        $slotKeysByCandidate = [];
        foreach ($appts as $appt) {
            if (! self::calendarSlotOccupiedForAvailability($appt)) {
                continue;
            }
            $dt = $appt->scheduled_at ?? $appt->appointment_date;
            if (! $dt) {
                continue;
            }
            $did = (int) $appt->doctor_id;
            $key = $dt->copy()->timezone($timezone)->format('Y-m-d H:i');
            if (! isset($slotKeysByCandidate[$did])) {
                $slotKeysByCandidate[$did] = [];
            }
            $slotKeysByCandidate[$did][$key] = true;
        }

        $out = [];
        foreach ($platformUserIds as $uid) {
            $merged = [];
            foreach ($userToCandidates[$uid] as $candId) {
                if (empty($slotKeysByCandidate[$candId])) {
                    continue;
                }
                foreach ($slotKeysByCandidate[$candId] as $k => $_) {
                    $merged[$k] = true;
                }
            }
            $out[$uid] = $merged;
        }

        return $out;
    }

    /**
     * Outro compromisso já ocupa o mesmo horário (mesmo minuto) para o mesmo médico.
     */
    public static function findConflictingTeleconsultationAppointment(?int $doctorId, Carbon $slotStart, ?int $excludeAppointmentId = null): ?self
    {
        $candidates = self::doctorIdCandidatesForSameDoctor($doctorId);
        if ($candidates === []) {
            return null;
        }

        $tz = 'America/Sao_Paulo';
        $slotKey = $slotStart->copy()->timezone($tz)->format('Y-m-d H:i');

        $query = self::query()
            ->whereNotNull('doctor_id')
            ->where('doctor_id', '>', 0)
            ->whereRaw('LOWER(TRIM(COALESCE(status, ""))) NOT IN (?, ?, ?)', ['cancelled', 'cancelada', 'canceled'])
            ->whereIn('doctor_id', $candidates);

        if ($excludeAppointmentId) {
            $query->where('id', '!=', $excludeAppointmentId);
        }

        foreach ($query->get() as $appt) {
            $dt = $appt->scheduled_at ?? $appt->appointment_date;
            if (! $dt) {
                continue;
            }
            $apptKey = $dt->copy()->timezone($tz)->format('Y-m-d H:i');
            if ($apptKey !== $slotKey) {
                continue;
            }
            if (self::calendarSlotOccupiedForAvailability($appt)) {
                return $appt;
            }
        }

        return null;
    }
}

