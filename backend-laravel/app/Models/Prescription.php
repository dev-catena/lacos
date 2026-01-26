<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Prescription extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'group_id',
        'doctor_id',
        'doctor_name',
        'doctor_specialty',
        'doctor_crm',
        'prescription_date',
        'notes',
        'image_url',
        'created_by',
    ];

    protected $casts = [
        'prescription_date' => 'date',
    ];

    // Relacionamentos
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function medications()
    {
        return $this->hasMany(Medication::class, 'prescription_id');
    }

    // Accessor para obter o médico (pode ser de doctors ou users)
    public function getDoctorAttribute()
    {
        if (!$this->doctor_id) {
            return null;
        }

        // Tentar buscar na tabela doctors primeiro
        $doctor = \DB::table('doctors')->where('id', $this->doctor_id)->first();
        if ($doctor) {
            return (object) [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'specialty' => $doctor->specialty,
                'crm' => $doctor->crm,
                'is_platform_doctor' => false,
            ];
        }

        // Se não encontrou, tentar na tabela users
        $user = \DB::table('users')
            ->where('id', $this->doctor_id)
            ->where('profile', 'doctor')
            ->first();
        
        if ($user) {
            return (object) [
                'id' => $user->id,
                'name' => $user->name,
                'specialty' => null, // users não tem specialty diretamente
                'crm' => $user->crm ?? null,
                'is_platform_doctor' => true,
            ];
        }

        return null;
    }
}
