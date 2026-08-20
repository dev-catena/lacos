<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocationPresenceEvent extends Model
{
    protected $fillable = [
        'group_id',
        'gateway_id',
        'gateway_mac',
        'bracelet_mac',
        'rssi',
        'place_label',
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    public function gateway(): BelongsTo
    {
        return $this->belongsTo(LocationGateway::class, 'gateway_id');
    }
}
