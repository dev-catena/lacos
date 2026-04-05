<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupMember extends Model
{
    use HasFactory;

    /**
     * Papéis da pessoa acompanhada no grupo — não devem ser destino de ligações de pânico / contato de emergência.
     */
    public static function accompaniedPersonRoles(): array
    {
        return ['patient', 'priority_contact', 'accompanied'];
    }

    public static function isAccompaniedPersonRole(?string $role): bool
    {
        if ($role === null || $role === '') {
            return false;
        }

        return in_array(strtolower($role), self::accompaniedPersonRoles(), true);
    }

    protected $fillable = [
        'user_id',
        'group_id',
        'role',
        'joined_at',
        'is_active',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Relacionamentos
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }
}
