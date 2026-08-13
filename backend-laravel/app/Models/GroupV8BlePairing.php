<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GroupV8BlePairing extends Model
{
    protected $table = 'group_v8_ble_pairings';

    protected $fillable = [
        'group_id',
        'paired_by',
        'bracelet_id',
        'bracelet_name',
        'paired_at',
        'last_seen_at',
    ];

    protected $casts = [
        'paired_at' => 'datetime',
        'last_seen_at' => 'datetime',
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
