<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LocationGateway extends Model
{
    protected $fillable = [
        'group_id',
        'gateway_mac',
        'device_name',
        'place_label',
        'place_description',
        'created_by',
        'last_seen_at',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(LocationPresenceEvent::class, 'gateway_id');
    }
}
