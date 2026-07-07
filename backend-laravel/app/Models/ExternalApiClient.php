<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExternalApiClient extends Model
{
    protected $fillable = ['name', 'api_key', 'is_active'];

    public static function findByKey(string $key): ?self
    {
        return self::where('api_key', $key)->where('is_active', true)->first();
    }
}
