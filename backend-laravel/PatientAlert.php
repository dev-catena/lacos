<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientAlert extends Model
{
    use HasFactory;

    protected $table = 'patient_alerts';

    protected $fillable = [
        'group_id',
        'patient_user_id',
        'type',
        'message',
        'details',
        
        // Medication fields
        'medication_id',
        'medication_name',
        'dosage',
        
        // Appointment fields
        'appointment_id',
        'appointment_type',
        'location',
        
        // Vital signs fields
        'vital_sign_type',
        'value',
        'normal_range',
        
        // Control fields
        'is_active',
        'priority',
        'time',
        'expires_at',
        'dismissed_at',
        'taken_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'priority' => 'integer',
        'time' => 'datetime',
        'expires_at' => 'datetime',
        'dismissed_at' => 'datetime',
        'taken_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relacionamento com Group
     */
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * Relacionamento com User (paciente)
     */
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_user_id');
    }

    /**
     * Relacionamento com Medication
     */
    public function medication()
    {
        return $this->belongsTo(Medication::class);
    }

    /**
     * Relacionamento com Appointment
     */
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Scope para alertas ativos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope para alertas de medicamentos
     */
    public function scopeMedication($query)
    {
        return $query->where('type', 'medication');
    }

    /**
     * Scope para alertas de consultas
     */
    public function scopeAppointment($query)
    {
        return $query->where('type', 'appointment');
    }

    /**
     * Scope para alertas de sinais vitais
     */
    public function scopeVitalSigns($query)
    {
        return $query->where('type', 'vital_signs');
    }

    /**
     * Scope para alertas de sedentarismo
     */
    public function scopeSedentary($query)
    {
        return $query->where('type', 'sedentary');
    }
}

