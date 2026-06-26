<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserStreamAgent extends Model
{
    protected $fillable = [
        'user_id',
        'agent_uuid',
        'agent_token_hash',
        'nome',
        'stream_api',
        'auth_user',
        'auth_pass',
        'cameras',
        'linked_at',
        'last_seen_at',
    ];

    protected $casts = [
        'cameras'      => 'array',
        'linked_at'    => 'datetime',
        'last_seen_at' => 'datetime',
    ];

    protected $hidden = [
        'auth_pass',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function setAuthPassAttribute(?string $value): void
    {
        $this->attributes['auth_pass'] = $value ? encrypt($value) : null;
    }

    public function getAuthPassDecryptedAttribute(): ?string
    {
        if (empty($this->attributes['auth_pass'])) {
            return null;
        }

        try {
            return decrypt($this->attributes['auth_pass']);
        } catch (\Throwable) {
            return null;
        }
    }
}
