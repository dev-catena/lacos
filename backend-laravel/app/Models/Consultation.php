<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Consultation extends Model {
    protected $fillable = ["group_id","doctor_id","type","title","consultation_date","doctor_name","location","summary","diagnosis","treatment","notes","is_urgency","status","created_by"];
    protected $casts = ["consultation_date"=>"datetime","is_urgency"=>"boolean"];
    public function group() { return $this->belongsTo(Group::class); }
    public function doctor() { return $this->belongsTo(Doctor::class); }
}
