<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'nickname',
        'type',
        'identifier',
        'status',
        'parser_model',
        'user_id',
        'group_id',
        'thalamus_device_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'thalamus_device_id' => 'integer',
    ];

    /**
     * Relacionamento com User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relacionamento com Group
     */
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * Obter label do tipo em português
     */
    public function getTypeLabelAttribute()
    {
        $labels = [
            'smartwatch' => 'Smartwatch',
            'sensor' => 'Sensor',
        ];
        return $labels[$this->type] ?? $this->type;
    }
}
