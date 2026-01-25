<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medication extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'name',
        'pharmaceutical_form',
        'dosage',
        'unit',
        'administration_route',
        'frequency',
        'times',
        'duration',
        'doctor_id',
        'prescription_image',
        'notes',
        'is_active',
        'start_date',
        'end_date',
        'discontinued_at',
        'discontinued_by',
        'discontinued_reason',
    ];

    protected $casts = [
        'frequency' => 'array',
        'times' => 'array',
        'duration' => 'array',
        'is_active' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'discontinued_at' => 'datetime',
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

    public function doseHistory()
    {
        return $this->hasMany(DoseHistory::class);
    }

    public function discontinuedByUser()
    {
        return $this->belongsTo(User::class, 'discontinued_by');
    }
}
