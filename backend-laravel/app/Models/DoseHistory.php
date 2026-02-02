<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoseHistory extends Model
{
    use HasFactory;

    protected $table = 'dose_history';

    protected $fillable = [
        'medication_id',
        'scheduled_time',
        'status',
        'taken_at',
        'taken_by',
        'notes',
        'skip_reason',
    ];

    protected $casts = [
        'scheduled_time' => 'datetime',
        'taken_at' => 'datetime',
    ];

    // Relacionamentos
    public function medication()
    {
        return $this->belongsTo(Medication::class);
    }

    public function takenByUser()
    {
        return $this->belongsTo(User::class, 'taken_by');
    }
}
