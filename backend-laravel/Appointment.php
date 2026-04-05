<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    ];

    protected $casts = [
        'appointment_date' => 'datetime',
        'scheduled_at' => 'datetime',
        'recurrence_start' => 'datetime',
        'recurrence_end' => 'datetime',
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

