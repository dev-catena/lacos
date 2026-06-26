<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StreamAgentPairing extends Model
{
    protected $fillable = [
        'pairing_id',
        'code',
        'poll_secret',
        'nome',
        'status',
        'user_id',
        'agent_token',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast() || $this->status === 'expired';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending' && ! $this->isExpired();
    }
}
