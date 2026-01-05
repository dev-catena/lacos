<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacyPrice extends Model
{
    use HasFactory;

    protected $table = 'pharmacy_prices';

    protected $fillable = [
        'user_id',
        'group_id',
        'medication_name',
        'pharmacy_name',
        'pharmacy_address',
        'price',
        'notes',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relacionamento com User (quem informou o preço)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relacionamento com Group
     */
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * Scope para buscar último preço de um medicamento em uma farmácia
     */
    public function scopeLastPriceForMedication($query, $medicationName, $pharmacyName)
    {
        return $query
            ->where('medication_name', $medicationName)
            ->where('pharmacy_name', $pharmacyName)
            ->orderBy('created_at', 'desc')
            ->first();
    }

    /**
     * Scope para buscar todos os preços de um medicamento em uma farmácia
     */
    public function scopePricesForMedication($query, $medicationName, $pharmacyName)
    {
        return $query
            ->where('medication_name', $medicationName)
            ->where('pharmacy_name', $pharmacyName)
            ->orderBy('created_at', 'desc');
    }
}








