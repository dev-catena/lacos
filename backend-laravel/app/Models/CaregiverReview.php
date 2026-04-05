<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaregiverReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'caregiver_id',
        'author_id',
        'group_id',
        'rating',
        'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relacionamento com o cuidador avaliado
     */
    public function caregiver()
    {
        return $this->belongsTo(User::class, 'caregiver_id');
    }

    /**
     * Relacionamento com o autor da avaliação
     */
    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Relacionamento com o grupo (opcional)
     */
    public function group()
    {
        return $this->belongsTo(Group::class, 'group_id');
    }
}

