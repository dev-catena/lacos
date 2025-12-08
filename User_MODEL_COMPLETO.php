<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $appends = ['photo_url'];

    protected $fillable = [
        'name',
        'email',
        'password',
        'profile',
        'phone',
        'birth_date',
        'photo',
        'gender',
        'phone',
        'gender',
        'blood_type',
        'birth_date',
        'photo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function createdGroups()
    {
        return $this->hasMany(Group::class, 'created_by');
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_members', 'user_id', 'group_id')
                    ->withPivot('role', 'is_active', 'is_emergency_contact', 'joined_at')
                    ->withTimestamps();
    }

    public function groupMemberships()
    {
        return $this->hasMany(GroupMember::class, 'user_id');
    }
    
    /**
     * Accessor para retornar a URL completa da foto do usuário
     */
    public function getPhotoUrlAttribute()
    {
        if ($this->photo) {
            return asset('storage/' . $this->photo);
        }
        return null;
    }

    /**
     * Relacionamento com avaliações recebidas como cuidador profissional
     */
    public function caregiverReviews()
    {
        return $this->hasMany(CaregiverReview::class, 'caregiver_id');
    }

    /**
     * Relacionamento com cursos e certificações do cuidador profissional
     */
    public function caregiverCourses()
    {
        return $this->hasMany(CaregiverCourse::class, 'user_id');
    }

}

