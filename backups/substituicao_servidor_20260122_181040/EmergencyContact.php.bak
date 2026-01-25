<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmergencyContact extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'name',
        'relationship',
        'phone',
        'alternate_phone',
        'is_primary',
        'photo',
        'notes',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    /**
     * Relacionamento: Grupo ao qual o contato pertence
     */
    public function group()
    {
        return $this->belongsTo(Group::class);
    }
}
