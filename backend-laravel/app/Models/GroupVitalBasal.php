<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupVitalBasal extends Model
{
    protected $table = 'group_vital_basals';

    protected $fillable = [
        'group_id',
        'basal_date',
        'type',
        'value',
        'samples_used',
        'unit',
    ];

    protected $casts = [
        'basal_date' => 'date',
        'value' => 'array',
        'samples_used' => 'integer',
    ];

    public function group()
    {
        return $this->belongsTo(Group::class);
    }
}
