<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AudioRecording extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'group_id',
        'title',
        'description',
        'file_path',
        'duration_seconds',
        'recorded_by',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
    ];

    // Relacionamentos
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
