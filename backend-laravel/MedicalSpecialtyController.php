<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalSpecialty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MedicalSpecialtyController extends Controller
{
    /**
     * Listar todas as especialidades médicas
     * GET /api/medical-specialties
     */
    public function index(Request $request)
    {
        // Limpar qualquer output buffer anterior
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        try {
            $query = MedicalSpecialty::query();
            
            // Busca opcional
            if ($request->has('search') && !empty($request->search)) {
                $query->where('name', 'LIKE', "%{$request->search}%");
            }
            
            // Selecionar apenas id e name, ordenar por nome
            $specialties = $query->select('id', 'name')
                  ->distinct()
                  ->orderBy('name')
                  ->get();
            
            Log::info('Especialidades médicas listadas', [
                'count' => $specialties->count(),
                'has_search' => $request->has('search'),
            ]);
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            return response()->json([
                'success' => true,
                'data' => $specialties
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            
        } catch (\Exception $e) {
            Log::error('Erro ao listar especialidades médicas', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar especialidades médicas',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error'
            ], 500, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }
    
    /**
     * Obter uma especialidade específica
     * GET /api/medical-specialties/{id}
     */
    public function show($id)
    {
        // Limpar qualquer output buffer anterior
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        try {
            $specialty = MedicalSpecialty::findOrFail($id);
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            return response()->json([
                'success' => true,
                'data' => $specialty
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            
        } catch (\Exception $e) {
            Log::error('Erro ao buscar especialidade médica', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Especialidade não encontrada'
            ], 404, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }
}


