<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaregiverCourse extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'institution',
        'year',
        'description',
        'certificate_url',
    ];

    protected $casts = [
        'year' => 'integer',
    ];

    public function caregiver()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

