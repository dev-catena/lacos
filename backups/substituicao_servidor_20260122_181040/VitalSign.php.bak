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
        'value' => 'array',
    ];

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
