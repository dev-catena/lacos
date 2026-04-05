<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PopularPharmacy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PopularPharmacyController extends Controller
{
    /**
     * Buscar farmácias populares próximas
     * GET /api/popular-pharmacies/nearby?latitude={lat}&longitude={lon}&radius={km}
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getNearby(Request $request)
    {
        try {
            $latitude = $request->query('latitude');
            $longitude = $request->query('longitude');
            $radius = $request->query('radius', 10); // Raio padrão de 10km
            $limit = $request->query('limit', 10); // Limite padrão de 10 resultados

            // Validar coordenadas
            if (!$latitude || !$longitude) {
                return response()->json([
                    'success' => false,
                    'error' => 'Latitude e longitude são obrigatórias',
                ], 400);
            }

            $latitude = (float) $latitude;
            $longitude = (float) $longitude;
            $radius = (float) $radius;

            // Calcular limites aproximados para otimizar a busca
            // 1 grau de latitude ≈ 111 km
            // 1 grau de longitude ≈ 111 km * cos(latitude)
            $latRange = $radius / 111.0;
            $lonRange = $radius / (111.0 * cos(deg2rad($latitude)));

            // Buscar farmácias usando query otimizada com cálculo de distância
            // Usar Haversine formula diretamente no SQL para melhor performance
            $pharmacies = PopularPharmacy::active()
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->whereBetween('latitude', [$latitude - $latRange, $latitude + $latRange])
                ->whereBetween('longitude', [$longitude - $lonRange, $longitude + $lonRange])
                ->selectRaw('
                    *,
                    (
                        6371 * acos(
                            cos(radians(?)) * 
                            cos(radians(latitude)) * 
                            cos(radians(longitude) - radians(?)) + 
                            sin(radians(?)) * 
                            sin(radians(latitude))
                        )
                    ) AS distance
                ', [$latitude, $longitude, $latitude])
                ->havingRaw('distance <= ?', [$radius])
                ->orderBy('distance')
                ->limit($limit)
                ->get()
                ->map(function ($pharmacy) {
                    return [
                        'id' => $pharmacy->id,
                        'name' => $pharmacy->name,
                        'address' => $pharmacy->address,
                        'neighborhood' => $pharmacy->neighborhood,
                        'city' => $pharmacy->city,
                        'state' => $pharmacy->state,
                        'zip_code' => $pharmacy->zip_code,
                        'phone' => $pharmacy->phone,
                        'latitude' => (float) $pharmacy->latitude,
                        'longitude' => (float) $pharmacy->longitude,
                        'distance' => round((float) $pharmacy->distance, 2), // Distância em km
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'data' => $pharmacies,
                'count' => $pharmacies->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao buscar farmácias próximas: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar farmácias próximas: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Buscar farmácias por cidade e estado
     * GET /api/popular-pharmacies/by-location?city={cidade}&state={uf}
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getByLocation(Request $request)
    {
        try {
            $city = $request->query('city');
            $state = $request->query('state');
            $limit = $request->query('limit', 20);

            if (!$city) {
                return response()->json([
                    'success' => false,
                    'error' => 'Cidade é obrigatória',
                ], 400);
            }

            $pharmacies = PopularPharmacy::active()
                ->byLocation($city, $state)
                ->limit($limit)
                ->get()
                ->map(function ($pharmacy) {
                    return [
                        'id' => $pharmacy->id,
                        'name' => $pharmacy->name,
                        'address' => $pharmacy->address,
                        'neighborhood' => $pharmacy->neighborhood,
                        'city' => $pharmacy->city,
                        'state' => $pharmacy->state,
                        'zip_code' => $pharmacy->zip_code,
                        'phone' => $pharmacy->phone,
                        'latitude' => $pharmacy->latitude ? (float) $pharmacy->latitude : null,
                        'longitude' => $pharmacy->longitude ? (float) $pharmacy->longitude : null,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $pharmacies,
                'count' => $pharmacies->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao buscar farmácias por localização: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar farmácias: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Listar todas as farmácias (com paginação)
     * GET /api/popular-pharmacies
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->query('per_page', 50);
            $city = $request->query('city');
            $state = $request->query('state');

            $query = PopularPharmacy::active();

            if ($city) {
                $query->where('city', 'like', "%{$city}%");
            }

            if ($state) {
                $query->where('state', $state);
            }

            $pharmacies = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $pharmacies->items(),
                'pagination' => [
                    'current_page' => $pharmacies->currentPage(),
                    'per_page' => $pharmacies->perPage(),
                    'total' => $pharmacies->total(),
                    'last_page' => $pharmacies->lastPage(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao listar farmácias: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erro ao listar farmácias: ' . $e->getMessage(),
            ], 500);
        }
    }
}

