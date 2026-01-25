<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GroupMedia extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'group_media';

    protected $fillable = [
        'group_id',
        'posted_by_user_id',
        'type',
        'file_path',
        'url',
        'thumbnail_url',
        'thumbnail_path',
        'description',
    ];

    protected $casts = [
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
     * Relacionamento com User (quem postou)
     */
    public function postedBy()
    {
        return $this->belongsTo(User::class, 'posted_by_user_id');
    }

    /**
     * Scope para mídias das últimas 24h
     */
    public function scopeRecent($query)
    {
        return $query->where('created_at', '>=', now()->subHours(24));
    }

    /**
     * Scope para imagens
     */
    public function scopeImages($query)
    {
        return $query->where('type', 'image');
    }

    /**
     * Scope para vídeos
     */
    public function scopeVideos($query)
    {
        return $query->where('type', 'video');
    }
}

