<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company_name',
        'company_type',
        'cnpj',
        'cpf',
        'address',
        'address_number',
        'address_complement',
        'neighborhood',
        'city',
        'state',
        'zip_code',
        'bank_name',
        'bank_code',
        'agency',
        'account',
        'account_type',
        'account_holder_name',
        'account_holder_document',
        'pix_key',
        'pix_key_type',
        'business_description',
        'website',
        'instagram',
        'facebook',
        'status',
        'approved_at',
        'rejected_reason',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    /**
     * Relacionamento com User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Verificar se está aprovado
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Verificar se está pendente
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Relacionamento com categorias
     */
    public function categories(): HasMany
    {
        return $this->hasMany(SupplierCategory::class);
    }
}


