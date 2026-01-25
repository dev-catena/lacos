<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = ["name", "slug", "is_default", "features"];

    protected $casts = [
        "is_default" => "boolean",
        "features" => "array",
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, "user_plans")
                    ->withPivot("is_active", "started_at", "expires_at")
                    ->withTimestamps();
    }

    public function activeUsers()
    {
        return $this->belongsToMany(User::class, "user_plans")
                    ->wherePivot("is_active", true)
                    ->withPivot("started_at", "expires_at")
                    ->withTimestamps();
    }
}
