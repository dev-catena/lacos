<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PanicEvent extends Model {
    use HasFactory;
    protected $fillable = ['group_id','user_id','trigger_type','latitude','longitude','location_address','call_duration','call_status','notes'];
    protected $casts = ['latitude' => 'decimal:8','longitude' => 'decimal:8'];
    public function group() { return $this->belongsTo(Group::class); }
    public function user() { return $this->belongsTo(User::class); }
}
