<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppointmentException extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'exception_date',
    ];

    protected $casts = [
        'exception_date' => 'date',
    ];

    /**
     * Relacionamento com Appointment
     */
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}

