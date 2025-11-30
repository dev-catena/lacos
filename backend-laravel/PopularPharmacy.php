<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PopularPharmacy extends Model
{
    use HasFactory;

    protected $table = 'popular_pharmacies';

    protected $fillable = [
        'name',
        'address',
        'neighborhood',
        'city',
        'state',
        'zip_code',
        'phone',
        'latitude',
        'longitude',
        'is_active',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'is_active' => 'boolean',
    ];

    /**
     * Scope para buscar farmácias ativas
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para buscar farmácias por cidade e estado
     */
    public function scopeByLocation($query, $city, $state = null)
    {
        $query->where('city', 'like', "%{$city}%");
        
        if ($state) {
            $query->where('state', $state);
        }
        
        return $query;
    }

    /**
     * Calcular distância em km usando a fórmula de Haversine
     * @param float $userLatitude
     * @param float $userLongitude
     * @return float Distância em quilômetros
     */
    public function distanceFrom($userLatitude, $userLongitude)
    {
        if (!$this->latitude || !$this->longitude) {
            return null;
        }

        $earthRadius = 6371; // Raio da Terra em km

        $latDiff = deg2rad($this->latitude - $userLatitude);
        $lonDiff = deg2rad($this->longitude - $userLongitude);

        $a = sin($latDiff / 2) * sin($latDiff / 2) +
             cos(deg2rad($userLatitude)) * cos(deg2rad($this->latitude)) *
             sin($lonDiff / 2) * sin($lonDiff / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}

