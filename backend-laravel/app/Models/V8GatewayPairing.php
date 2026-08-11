<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class V8GatewayPairing extends Model
{
    protected $table = 'v8_gateway_pairings';

    protected $fillable = [
        'pairing_id',
        'code',
        'poll_secret',
        'device_id',
        'name',
        'status',
        'user_id',
        'group_id',
        'device_token',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function isExpired(): bool
    {
        return $this->expires_at->isPast() || $this->status === 'expired';
    }
}
