<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Doctor extends Model {
    use HasFactory;
    protected $fillable = ['group_id','name','specialty','medical_specialty_id','crm','phone','email','address','notes','is_primary'];
    protected $casts = ['is_primary' => 'boolean'];
    public function group() { return $this->belongsTo(Group::class); }
    public function medicalSpecialty() { return $this->belongsTo(MedicalSpecialty::class); }
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
