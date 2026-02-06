<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserNotificationPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        // Preferências para médicos
        'appointment_patient_notification',
        'vital_signs_basal_change',
        // Preferências para outros perfis
        'medication_reminders',
        'medication_late_alerts',
        'medication_running_out',
        'appointment_reminders',
        'appointment_confirmation',
        'appointment_cancellation',
        'vital_signs_alerts',
        'vital_signs_abnormal',
        'vital_signs_reminders',
        'group_invites',
        'group_member_added',
        'group_changes',
        'system_updates',
        'news_and_tips',
        'email_notifications',
    ];

    protected $casts = [
        'appointment_patient_notification' => 'boolean',
        'vital_signs_basal_change' => 'boolean',
        'medication_reminders' => 'boolean',
        'medication_late_alerts' => 'boolean',
        'medication_running_out' => 'boolean',
        'appointment_reminders' => 'boolean',
        'appointment_confirmation' => 'boolean',
        'appointment_cancellation' => 'boolean',
        'vital_signs_alerts' => 'boolean',
        'vital_signs_abnormal' => 'boolean',
        'vital_signs_reminders' => 'boolean',
        'group_invites' => 'boolean',
        'group_member_added' => 'boolean',
        'group_changes' => 'boolean',
        'system_updates' => 'boolean',
        'news_and_tips' => 'boolean',
        'email_notifications' => 'boolean',
    ];

    /**
     * Relacionamento com User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
