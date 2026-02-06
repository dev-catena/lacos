<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

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
     * Accessor para obter dados do médico (de doctors ou users)
     */
    public function getDoctorUserAttribute()
    {
        if (!$this->doctor_id) {
            return null;
        }

        // Primeiro tentar buscar na tabela doctors
        $doctor = \DB::table('doctors')->where('id', $this->doctor_id)->first();
        if ($doctor) {
            return (object) [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'crm' => $doctor->crm,
                'specialty' => $doctor->specialty,
                'source' => 'doctors'
            ];
        }

        // Se não encontrou, buscar na tabela users com profile='doctor'
        $userDoctor = \DB::table('users')
            ->where('id', $this->doctor_id)
            ->where('profile', 'doctor')
            ->first();
        
        if ($userDoctor) {
            return (object) [
                'id' => $userDoctor->id,
                'name' => $userDoctor->name,
                'crm' => $userDoctor->crm ?? null,
                'consultation_price' => $userDoctor->consultation_price ?? null,
                'specialty' => null, // Pode ser obtido de medical_specialties se necessário
                'source' => 'users'
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

}

