<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicationCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MedicationCatalogController extends Controller
{
    /**
     * Buscar medicamentos (autocomplete)
     * GET /api/medications/search?q={query}&limit={limit}
     */
    public function search(Request $request)
    {
        try {
            $query = $request->query('q', '');
            $limit = (int) $request->query('limit', 10);

            if (empty($query) || strlen($query) < 2) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'count' => 0,
                ]);
            }

            // Buscar medicamentos
            $medications = MedicationCatalog::search($query, $limit);

            // Processar resultados para remover duplicatas por nome (sem concentração)
            $uniqueMedications = [];
            $seenNames = [];

            foreach ($medications as $med) {
                $nameOnly = MedicationCatalog::extractNameOnly($med->nome_produto);
                $nameKey = strtolower(trim($nameOnly));

                // Se já vimos este nome, pular
                if (isset($seenNames[$nameKey])) {
                    continue;
                }

                $seenNames[$nameKey] = true;

                $uniqueMedications[] = [
                    'id' => $med->id,
                    'name' => $med->nome_produto, // Nome completo para referência
                    'displayName' => $nameOnly, // Apenas nome para exibição
                    'principio_ativo' => $med->principio_ativo,
                    'classe_terapeutica' => $med->classe_terapeutica,
                    'situacao_registro' => $med->situacao_registro,
                    'source' => 'database',
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $uniqueMedications,
                'count' => count($uniqueMedications),
                'query' => $query,
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao buscar medicamentos: ' . $e->getMessage(), [
                'query' => $request->query('q'),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar medicamentos',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obter informações completas de um medicamento
     * GET /api/medications/info?name={nome}
     */
    public function getInfo(Request $request)
    {
        try {
            $name = $request->query('name');

            if (empty($name)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Nome do medicamento não fornecido',
                ], 400);
            }

            // Buscar medicamento
            $medication = MedicationCatalog::where('nome_normalizado', MedicationCatalog::normalizeName($name))
                ->where('is_active', true)
                ->where('situacao_registro', 'VÁLIDO')
                ->first();

            if (!$medication) {
                return response()->json([
                    'success' => false,
                    'error' => 'Medicamento não encontrado',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $medication->id,
                    'name' => $medication->nome_produto,
                    'displayName' => MedicationCatalog::extractNameOnly($medication->nome_produto),
                    'principio_ativo' => $medication->principio_ativo,
                    'classe_terapeutica' => $medication->classe_terapeutica,
                    'categoria_regulatoria' => $medication->categoria_regulatoria,
                    'numero_registro_produto' => $medication->numero_registro_produto,
                    'situacao_registro' => $medication->situacao_registro,
                    'empresa_detentora_registro' => $medication->empresa_detentora_registro,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao buscar informações do medicamento: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar informações do medicamento',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Estatísticas do catálogo
     * GET /api/medications/stats
     */
    public function stats()
    {
        try {
            $total = MedicationCatalog::count();
            $active = MedicationCatalog::where('is_active', true)
                ->where('situacao_registro', 'VÁLIDO')
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'active' => $active,
                    'inactive' => $total - $active,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar estatísticas',
            ], 500);
        }
    }
}







