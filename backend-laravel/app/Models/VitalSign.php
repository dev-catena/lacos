<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VitalSign extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'measured_at',
        'type',
        'value',
        'unit',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'measured_at' => 'datetime',
        'value' => 'array', // JSON será convertido para array/objeto quando lido
    ];
    
    /**
     * Setter para value - permite objetos, arrays e números
     */
    public function setValueAttribute($value)
    {
        // Se for número, converter para array com um elemento para manter compatibilidade
        if (is_numeric($value) && !is_array($value) && !is_object($value)) {
            $this->attributes['value'] = json_encode([$value]);
        } else {
            // Para objetos e arrays, salvar como JSON
            $this->attributes['value'] = json_encode($value);
        }
    }

    // Relacionamentos
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
