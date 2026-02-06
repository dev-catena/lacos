<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'documents';

    protected $fillable = [
        'group_id',
        'user_id',
        'doctor_id',
        'consultation_id',
        'type',
        'title',
        'document_date',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'notes',
    ];

    protected $casts = [
        'document_date' => 'date',
        'file_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relacionamento com Group
     */
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * Relacionamento com User (quem fez upload)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relacionamento com Doctor (opcional)
     */
    public function doctor()
    {
        if (class_exists(\App\Models\Doctor::class)) {
            return $this->belongsTo(\App\Models\Doctor::class);
        }
        return null;
    }

    /**
     * Relacionamento com Consultation (opcional - pode não existir ainda)
     */
    public function consultation()
    {
        if (class_exists(\App\Models\Consultation::class)) {
            return $this->belongsTo(\App\Models\Consultation::class);
        }
        return null;
    }

    /**
     * Scope para documentos por tipo
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope para documentos de um grupo
     */
    public function scopeForGroup($query, $groupId)
    {
        return $query->where('group_id', $groupId);
    }
}

