<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class GroupActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'user_id',
        'action_type',
        'description',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function logMemberJoined($groupId, $userId, $userName, $role)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'member_joined',
            'description' => "{$userName} entrou no grupo como " . self::getRoleLabel($role),
            'metadata' => ['role' => $role],
        ]);
    }

    public static function logMemberPromoted($groupId, $userId, $userName, $newRole)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'member_promoted',
            'description' => "{$userName} foi promovido a " . self::getRoleLabel($newRole),
            'metadata' => ['new_role' => $newRole],
        ]);
    }

    public static function logMemberRemoved($groupId, $removedUserId, $removedUserName)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => null,
            'action_type' => 'member_removed',
            'description' => "{$removedUserName} foi removido do grupo",
            'metadata' => ['removed_user_id' => $removedUserId],
        ]);
    }

    public static function logPatientChanged($groupId, $newPatientId, $newPatientName)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => $newPatientId,
            'action_type' => 'patient_changed',
            'description' => "{$newPatientName} agora é o paciente do grupo",
            'metadata' => ['patient_id' => $newPatientId],
        ]);
    }

    /**
     * Registrar criação de medicamento
     */
    public static function logMedicationCreated($groupId, $userId, $userName, $medicationName, $medicationId = null)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'medication_created',
            'description' => "{$userName} cadastrou o medicamento {$medicationName}",
            'metadata' => [
                'medication_id' => $medicationId,
                'medication_name' => $medicationName,
            ],
        ]);
    }

    /**
     * Registrar atualização de medicamento
     */
    public static function logMedicationUpdated($groupId, $userId, $userName, $medicationName, $medicationId = null)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'medication_updated',
            'description' => "{$userName} atualizou o medicamento {$medicationName}",
            'metadata' => [
                'medication_id' => $medicationId,
                'medication_name' => $medicationName,
            ],
        ]);
    }

    /**
     * Registrar descontinuação de medicamento
     */
    public static function logMedicationDiscontinued($groupId, $userId, $userName, $medicationName, $medicationId = null)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'medication_discontinued',
            'description' => "{$userName} descontinuou o medicamento {$medicationName}",
            'metadata' => [
                'medication_id' => $medicationId,
                'medication_name' => $medicationName,
            ],
        ]);
    }

    /**
     * Registrar conclusão de medicamento
     */
    public static function logMedicationCompleted($groupId, $userId, $userName, $medicationName, $medicationId = null)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'medication_completed',
            'description' => "{$userName} concluiu o medicamento {$medicationName}",
            'metadata' => [
                'medication_id' => $medicationId,
                'medication_name' => $medicationName,
            ],
        ]);
    }

    /**
     * Registrar criação de documento
     */
    public static function logDocumentCreated($groupId, $userId, $userName, $documentTitle, $documentType, $documentId = null)
    {
        $typeLabels = [
            'prescription' => 'receita médica',
            'exam_lab' => 'exame laboratorial',
            'exam_image' => 'exame de imagem',
            'report' => 'relatório',
            'other' => 'documento',
        ];
        
        $typeLabel = $typeLabels[$documentType] ?? 'documento';
        
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'document_created',
            'description' => "{$userName} adicionou uma {$typeLabel}: {$documentTitle}",
            'metadata' => [
                'document_id' => $documentId,
                'document_title' => $documentTitle,
                'document_type' => $documentType,
            ],
        ]);
    }

    /**
     * Registrar criação de consulta
     */
    public static function logConsultationCreated($groupId, $userId, $userName, $consultationDate, $doctorName = null, $consultationId = null)
    {
        $description = "{$userName} agendou uma consulta";
        if ($doctorName) {
            $description .= " com {$doctorName}";
        }
        $description .= " para " . \Carbon\Carbon::parse($consultationDate)->format('d/m/Y');
        
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'consultation_created',
            'description' => $description,
            'metadata' => [
                'consultation_id' => $consultationId,
                'consultation_date' => $consultationDate,
                'doctor_name' => $doctorName,
            ],
        ]);
    }

    /**
     * Registrar criação de ocorrência
     */
    public static function logOccurrenceCreated($groupId, $userId, $userName, $occurrenceType, $occurrenceId = null)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'occurrence_created',
            'description' => "{$userName} registrou uma ocorrência: {$occurrenceType}",
            'metadata' => [
                'occurrence_id' => $occurrenceId,
                'occurrence_type' => $occurrenceType,
            ],
        ]);
    }

    /**
     * Registrar criação de compromisso/agenda
     */
    public static function logAppointmentCreated($groupId, $userId, $userName, $appointmentTitle, $appointmentDate, $appointmentType = 'common', $appointmentId = null, ?string $displayTitle = null)
    {
        $typeLabels = [
            'common' => 'compromisso',
            'medical' => 'consulta médica',
            'fisioterapia' => 'sessão de fisioterapia',
            'exames' => 'exame',
        ];
        
        $typeLabel = $typeLabels[$appointmentType] ?? 'compromisso';
        $titlePart = ($displayTitle !== null && trim((string) $displayTitle) !== '')
            ? trim((string) $displayTitle)
            : $appointmentTitle;

        $useUma = in_array($appointmentType, ['medical', 'fisioterapia'], true);
        $article = $useUma ? 'uma' : 'um';
        // Formatar data de forma mais simples e rápida
        try {
            // Tentar parse direto primeiro
            $carbonDate = \Carbon\Carbon::parse($appointmentDate);
            $formattedDate = $carbonDate->format('d/m/Y');
        } catch (\Exception $e) {
            // Se falhar, tentar extrair apenas a data
            try {
                $dateOnly = substr($appointmentDate, 0, 10); // Pega apenas YYYY-MM-DD
                $carbonDate = \Carbon\Carbon::createFromFormat('Y-m-d', $dateOnly);
                $formattedDate = $carbonDate->format('d/m/Y');
            } catch (\Exception $e2) {
                // Se ainda falhar, usar a data como string
                $formattedDate = $appointmentDate;
            }
        }
        
        $metadata = [
            'appointment_id' => $appointmentId,
            'appointment_title' => $appointmentTitle,
            'appointment_date' => $appointmentDate,
            'appointment_type' => $appointmentType,
        ];
        if ($displayTitle !== null && trim((string) $displayTitle) !== '') {
            $metadata['doctor_display'] = trim((string) $displayTitle);
        }

        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'appointment_created',
            'description' => "{$userName} agendou {$article} {$typeLabel}: {$titlePart} para {$formattedDate}",
            'metadata' => $metadata,
        ]);
    }

    /**
     * Registrar atualização de foto do grupo
     */
    public static function logGroupPhotoUpdated($groupId, $userId, $userName)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'group_photo_updated',
            'description' => "{$userName} atualizou a foto do grupo",
            'metadata' => [],
        ]);
    }

    /**
     * Registrar registro de sinais vitais
     */
    public static function logVitalSignRecorded($groupId, $userId, $userName, $vitalSignType, $vitalSignId = null)
    {
        $typeLabels = [
            'blood_pressure' => 'pressão arterial',
            'heart_rate' => 'frequência cardíaca',
            'oxygen_saturation' => 'saturação de oxigênio',
            'blood_glucose' => 'glicemia',
            'temperature' => 'temperatura',
            'respiratory_rate' => 'frequência respiratória',
        ];
        
        $typeLabel = $typeLabels[$vitalSignType] ?? $vitalSignType;
        
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'vital_sign_recorded',
            'description' => "{$userName} registrou {$typeLabel}",
            'metadata' => [
                'vital_sign_id' => $vitalSignId,
                'vital_sign_type' => $vitalSignType,
            ],
        ]);
    }

    /**
     * Registrar registro de smartwatch
     */
    public static function logSmartwatchRegistered($groupId, $userId, $userName, $deviceNickname, $deviceId = null)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'smartwatch_registered',
            'description' => "{$userName} registrou o smartwatch {$deviceNickname}",
            'metadata' => [
                'device_id' => $deviceId,
                'device_nickname' => $deviceNickname,
            ],
        ]);
    }

    /**
     * Registrar contratação de cuidador
     */
    public static function logCaregiverHired($groupId, $userId, $userName, $caregiverName, $caregiverId = null)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'caregiver_hired',
            'description' => "{$userName} contratou o cuidador {$caregiverName}",
            'metadata' => [
                'caregiver_id' => $caregiverId,
                'caregiver_name' => $caregiverName,
            ],
        ]);
    }

    /**
     * Registrar criação de receita médica
     */
    public static function logPrescriptionCreated($groupId, $userId, $userName, $prescriptionId = null)
    {
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'prescription_created',
            'description' => "{$userName} criou uma nova receita médica",
            'metadata' => [
                'prescription_id' => $prescriptionId,
            ],
        ]);
    }

    /**
     * Registrar cancelamento de consulta
     */
    public static function logAppointmentCancelled($groupId, $userId, $userName, $appointmentTitle, $appointmentDate, $appointmentType = 'common', $appointmentId = null, $cancelledBy = 'doctor')
    {
        $typeLabels = [
            'common' => 'compromisso',
            'medical' => 'consulta médica',
            'fisioterapia' => 'sessão de fisioterapia',
            'exames' => 'exame',
        ];
        
        $typeLabel = $typeLabels[$appointmentType] ?? 'compromisso';
        
        try {
            $carbonDate = \Carbon\Carbon::parse($appointmentDate);
            $formattedDate = $carbonDate->format('d/m/Y \à\s H:i');
        } catch (\Exception $e) {
            try {
                $dateOnly = substr($appointmentDate, 0, 10);
                $carbonDate = \Carbon\Carbon::createFromFormat('Y-m-d', $dateOnly);
                $formattedDate = $carbonDate->format('d/m/Y');
            } catch (\Exception $e2) {
                $formattedDate = $appointmentDate;
            }
        }
        
        $cancelledByLabel = $cancelledBy === 'doctor' ? 'médico' : 'paciente';
        
        return self::create([
            'group_id' => $groupId,
            'user_id' => $userId,
            'action_type' => 'appointment_cancelled',
            'description' => "O {$typeLabel} \"{$appointmentTitle}\" agendado para {$formattedDate} foi cancelado pelo {$cancelledByLabel}",
            'metadata' => [
                'appointment_id' => $appointmentId,
                'appointment_title' => $appointmentTitle,
                'appointment_date' => $appointmentDate,
                'appointment_type' => $appointmentType,
                'cancelled_by' => $cancelledBy,
            ],
        ]);
    }

    /**
     * Corrige artigo em textos legados ("um consulta" → "uma consulta").
     */
    public static function fixLegacyUmConsultaMedica(string $description): string
    {
        $fixed = preg_replace('/\bagendou\s+um\s+consulta\s+médica\b/ui', 'agendou uma consulta médica', $description);
        $fixed = preg_replace('/\bagendou\s+um\s+sessão\b/ui', 'agendou uma sessão', $fixed ?? $description);

        return $fixed ?? $description;
    }

    /**
     * Recompõe a descrição de compromisso agendado (Dra./Dr. + especialidade + artigo correto)
     * a partir do appointment atual. Não altera o banco; usado na API para o app e linhas antigas.
     */
    public static function refreshAppointmentCreatedDescription(self $activity): string
    {
        $original = (string) ($activity->description ?? '');
        $meta = is_array($activity->metadata) ? $activity->metadata : [];
        $appointmentId = $meta['appointment_id'] ?? null;
        if ($activity->action_type !== 'appointment_created') {
            return self::fixLegacyUmConsultaMedica($original);
        }

        try {
            /**
             * Linhas antigas sem appointment_id na metadata: recompõe Dra./especialidade só pelo título.
             */
            if (! $appointmentId) {
                if (preg_match('/^(.+?)\s+agendou\s+(?:um|uma)\s+consulta\s+médica:\s*(.+?)\s+para\s+(\d{2}\/\d{2}\/\d{4})\s*$/u', $original, $legacy)) {
                    $actorName = trim($legacy[1]);
                    $titleRaw = trim($legacy[2]);
                    $formattedDate = $legacy[3];
                    $fake = new Appointment([
                        'type' => 'medical',
                        'title' => $titleRaw,
                        'medical_specialty_id' => null,
                        'doctor_id' => null,
                    ]);
                    $line = Appointment::doctorLineForActivityDescription($fake);
                    $titlePart = $line !== null && $line !== '' ? $line : $titleRaw;

                    return "{$actorName} agendou uma consulta médica: {$titlePart} para {$formattedDate}";
                }

                return self::fixLegacyUmConsultaMedica($original);
            }

            $appt = Appointment::find($appointmentId);
            if (! $appt) {
                if (preg_match('/^(.+?)\s+agendou\s+(?:um|uma)\s+consulta\s+médica:\s*(.+?)\s+para\s+(\d{2}\/\d{2}\/\d{4})\s*$/u', $original, $legacy)) {
                    $actorName = trim($legacy[1]);
                    $titleRaw = trim($legacy[2]);
                    $formattedDate = $legacy[3];
                    $fake = new Appointment([
                        'type' => 'medical',
                        'title' => $titleRaw,
                        'medical_specialty_id' => null,
                        'doctor_id' => null,
                    ]);
                    $line = Appointment::doctorLineForActivityDescription($fake);
                    $titlePart = $line !== null && $line !== '' ? $line : $titleRaw;

                    return "{$actorName} agendou uma consulta médica: {$titlePart} para {$formattedDate}";
                }

                return self::fixLegacyUmConsultaMedica($original);
            }

            $actorName = null;
            if ($activity->user_id) {
                $actorName = optional(User::find($activity->user_id))->name;
            }
            if (! $actorName && preg_match('/^(.+?)\s+agendou/u', $original, $m)) {
                $actorName = trim($m[1]);
            }
            if (! $actorName) {
                $actorName = 'Alguém';
            }

            $typeLabels = [
                'common' => 'compromisso',
                'medical' => 'consulta médica',
                'fisioterapia' => 'sessão de fisioterapia',
                'exames' => 'exame',
            ];
            $type = $appt->type ?? ($meta['appointment_type'] ?? 'common');
            if (mb_stripos($original, 'consulta médica', 0, 'UTF-8') !== false) {
                $type = 'medical';
            }
            $typeLabel = $typeLabels[$type] ?? 'compromisso';
            $useUma = in_array($type, ['medical', 'fisioterapia'], true);
            $article = $useUma ? 'uma' : 'um';

            $savedType = $appt->getRawOriginal('type') ?? $appt->type;
            if ($type === 'medical' && ($appt->type ?? '') !== 'medical') {
                $appt->type = 'medical';
            }
            $line = Appointment::doctorLineForActivityDescription($appt);
            if ($type === 'medical' && ($savedType ?? '') !== 'medical') {
                $appt->type = $savedType;
            }
            $titlePart = $line ?? ($appt->title ?? ($meta['appointment_title'] ?? ''));

            $dateRaw = $appt->scheduled_at ?? $appt->appointment_date ?? ($meta['appointment_date'] ?? null);
            $formattedDate = $dateRaw ? \Carbon\Carbon::parse($dateRaw)->format('d/m/Y') : '';

            return "{$actorName} agendou {$article} {$typeLabel}: {$titlePart} para {$formattedDate}";
        } catch (\Throwable $e) {
            return self::fixLegacyUmConsultaMedica($original);
        }
    }

    /**
     * Descrição enriquecida para respostas JSON (sem gravar em group_activities).
     */
    public static function descriptionForApiResponse(self $activity): string
    {
        if ($activity->action_type === 'appointment_created') {
            return self::refreshAppointmentCreatedDescription($activity);
        }

        return self::fixLegacyUmConsultaMedica((string) ($activity->description ?? ''));
    }

    private static function getRoleLabel($role)
    {
        $labels = [
            'admin' => 'administrador',
            'caregiver' => 'cuidador',
            'patient' => 'paciente',
            'priority_contact' => 'paciente', // Mapear priority_contact para paciente
            'health_professional' => 'profissional de saúde',
        ];
        return $labels[$role] ?? $role;
    }
}



