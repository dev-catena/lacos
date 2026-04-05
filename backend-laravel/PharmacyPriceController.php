<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PharmacyPrice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PharmacyPriceController extends Controller
{
    /**
     * Buscar último preço informado para um medicamento em uma farmácia
     * GET /api/pharmacy-prices/last?medication_name={nome}&pharmacy_name={nome_farmacia}
     */
    public function getLastPrice(Request $request)
    {
        try {
            $medicationName = $request->query('medication_name');
            $pharmacyName = $request->query('pharmacy_name');

            if (!$medicationName || !$pharmacyName) {
                return response()->json([
                    'success' => false,
                    'error' => 'Nome do medicamento e da farmácia são obrigatórios',
                ], 400);
            }

            $lastPrice = PharmacyPrice::lastPriceForMedication($medicationName, $pharmacyName);

            if (!$lastPrice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nenhum preço informado ainda para este medicamento nesta farmácia',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $lastPrice->id,
                    'medication_name' => $lastPrice->medication_name,
                    'pharmacy_name' => $lastPrice->pharmacy_name,
                    'pharmacy_address' => $lastPrice->pharmacy_address,
                    'price' => floatval($lastPrice->price),
                    'notes' => $lastPrice->notes,
                    'informed_by' => $lastPrice->user->name ?? 'Usuário',
                    'informed_at' => $lastPrice->created_at->format('d/m/Y H:i'),
                    'days_ago' => $lastPrice->created_at->diffInDays(now()),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar último preço: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar preço: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Salvar novo preço informado pelo usuário
     * POST /api/pharmacy-prices
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'medication_name' => 'required|string|max:200',
                'pharmacy_name' => 'required|string|max:200',
                'pharmacy_address' => 'nullable|string|max:500',
                'price' => 'required|numeric|min:0.01',
                'notes' => 'nullable|string|max:1000',
                'group_id' => 'nullable|exists:groups,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $pharmacyPrice = PharmacyPrice::create([
                'user_id' => $request->user()->id,
                'group_id' => $request->input('group_id'),
                'medication_name' => $request->input('medication_name'),
                'pharmacy_name' => $request->input('pharmacy_name'),
                'pharmacy_address' => $request->input('pharmacy_address'),
                'price' => $request->input('price'),
                'notes' => $request->input('notes'),
            ]);

            $pharmacyPrice->load('user');

            return response()->json([
                'success' => true,
                'message' => 'Preço informado com sucesso! Obrigado por contribuir.',
                'data' => [
                    'id' => $pharmacyPrice->id,
                    'medication_name' => $pharmacyPrice->medication_name,
                    'pharmacy_name' => $pharmacyPrice->pharmacy_name,
                    'pharmacy_address' => $pharmacyPrice->pharmacy_address,
                    'price' => floatval($pharmacyPrice->price),
                    'notes' => $pharmacyPrice->notes,
                    'informed_at' => $pharmacyPrice->created_at->format('d/m/Y H:i'),
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erro ao salvar preço de farmácia: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erro ao salvar preço: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Buscar histórico de preços para um medicamento em uma farmácia
     * GET /api/pharmacy-prices/history?medication_name={nome}&pharmacy_name={nome_farmacia}
     */
    public function getHistory(Request $request)
    {
        try {
            $medicationName = $request->query('medication_name');
            $pharmacyName = $request->query('pharmacy_name');
            $limit = $request->query('limit', 10);

            if (!$medicationName || !$pharmacyName) {
                return response()->json([
                    'success' => false,
                    'error' => 'Nome do medicamento e da farmácia são obrigatórios',
                ], 400);
            }

            $prices = PharmacyPrice::pricesForMedication($medicationName, $pharmacyName)
                ->with('user')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $prices->map(function ($price) {
                    return [
                        'id' => $price->id,
                        'price' => floatval($price->price),
                        'notes' => $price->notes,
                        'informed_by' => $price->user->name ?? 'Usuário',
                        'informed_at' => $price->created_at->format('d/m/Y H:i'),
                        'days_ago' => $price->created_at->diffInDays(now()),
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar histórico de preços: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar histórico: ' . $e->getMessage(),
            ], 500);
        }
    }
}








