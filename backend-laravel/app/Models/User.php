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
        'blood_type',
        // Campos de dados pessoais
        'last_name',
        'cpf',
        'address',
        'address_number',
        'address_complement',
        'city',
        'state',
        'zip_code',
        // Campos específicos de cuidador profissional
        'neighborhood',
        'formation_details',
        'formation_description',
        'crm',
        'medical_specialty_id',
        'hourly_rate',
        'consultation_price',
        'availability',
        'is_available',
        'latitude',
        'longitude',
        // Campos de saúde do paciente
        'chronic_diseases',
        'allergies',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_available' => 'boolean',
        'hourly_rate' => 'decimal:2',
        'consultation_price' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
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

    /**
     * Relacionamento com especialidade médica
     */
    public function medicalSpecialty()
    {
        return $this->belongsTo(MedicalSpecialty::class, 'medical_specialty_id');
    }
}

