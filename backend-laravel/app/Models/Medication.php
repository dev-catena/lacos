<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medication extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'prescription_id', // ID da receita (opcional)
        'accompanied_person_id', // ID do paciente acompanhado (obrigatório)
        'name',
        'pharmaceutical_form', // Forma farmacêutica
        'dosage',
        'unit', // Unidade de concentração
        'administration_route', // Via de administração
        'dose_quantity', // Quantidade da dose
        'dose_quantity_unit', // Unidade da quantidade da dose
        'frequency',
        'time', // Coluna existe como 'time' (singular), não 'times'
        'start_date',
        'end_date',
        'instructions',
        'notes',
        'is_active',
        'registered_by_user_id',
    ];

    protected $casts = [
        'frequency' => 'array', // Varchar na tabela, mas tratado como array (JSON decode/encode)
        'time' => 'string', // TIME na tabela (não é JSON)
        'is_active' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];
    
    // Accessor para frequency - decodificar JSON string para array
    public function getFrequencyAttribute($value)
    {
        if (is_string($value)) {
            return json_decode($value, true) ?? [];
        }
        return $value ?? [];
    }
    
    // Mutator para frequency - codificar array para JSON string
    public function setFrequencyAttribute($value)
    {
        if (is_array($value)) {
            $this->attributes['frequency'] = json_encode($value);
        } else {
            $this->attributes['frequency'] = $value;
        }
    }

    // Relacionamentos
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
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
