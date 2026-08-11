<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class V8Gateway extends Model
{
    protected $table = 'v8_gateways';

    protected $fillable = [
        'device_id',
        'device_token_hash',
        'name',
        'bracelet_mac',
        'group_id',
        'paired_by',
        'last_seen_at',
        'paired_at',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
        'paired_at' => 'datetime',
    ];

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function pairedByUser()
    {
        return $this->belongsTo(User::class, 'paired_by');
    }
}
