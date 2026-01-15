<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class MedicationCatalog extends Model
{
    use HasFactory;

    protected $table = 'medication_catalog';

    protected $fillable = [
        'nome_produto',
        'nome_normalizado',
        'principio_ativo',
        'tipo_produto',
        'categoria_regulatoria',
        'numero_registro_produto',
        'data_vencimento_registro',
        'situacao_registro',
        'classe_terapeutica',
        'empresa_detentora_registro',
        'data_finalizacao_processo',
        'numero_processo',
        'is_active',
        'search_keywords',
    ];

    protected $casts = [
        'data_vencimento_registro' => 'date',
        'data_finalizacao_processo' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Normalizar nome do medicamento para busca
     */
    public static function normalizeName($name)
    {
        if (empty($name)) {
            return '';
        }

        // Converter para lowercase
        $normalized = mb_strtolower($name, 'UTF-8');
        
        // Remover acentos
        $normalized = self::removeAccents($normalized);
        
        // Remover caracteres especiais, manter apenas letras, números e espaços
        $normalized = preg_replace('/[^a-z0-9\s]/', ' ', $normalized);
        
        // Remover espaços múltiplos
        $normalized = preg_replace('/\s+/', ' ', $normalized);
        
        return trim($normalized);
    }

    /**
     * Remover acentos de uma string
     */
    private static function removeAccents($string)
    {
        $accents = [
            'à' => 'a', 'á' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a',
            'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e',
            'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
            'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
            'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u',
            'ç' => 'c', 'ñ' => 'n',
            'À' => 'A', 'Á' => 'A', 'Â' => 'A', 'Ã' => 'A', 'Ä' => 'A',
            'È' => 'E', 'É' => 'E', 'Ê' => 'E', 'Ë' => 'E',
            'Ì' => 'I', 'Í' => 'I', 'Î' => 'I', 'Ï' => 'I',
            'Ò' => 'O', 'Ó' => 'O', 'Ô' => 'O', 'Õ' => 'O', 'Ö' => 'O',
            'Ù' => 'U', 'Ú' => 'U', 'Û' => 'U', 'Ü' => 'U',
            'Ç' => 'C', 'Ñ' => 'N',
        ];
        
        return strtr($string, $accents);
    }

    /**
     * Extrair apenas o nome do medicamento (sem concentração)
     */
    public static function extractNameOnly($fullName)
    {
        if (empty($fullName)) {
            return '';
        }

        $name = trim($fullName);
        
        // Remover concentrações (ex: 500mg, 20mg, 10mg/ml, 0,03MG, 100UI/ML)
        $name = preg_replace('/\s(\d+(\.\d+)?(mg|ml|g|ui|mcg|%)\/?(ml)?(\s*-\s*ação prolongada)?)/i', '', $name);
        
        // Remover formas farmacêuticas comuns
        $forms = [
            'cápsula', 'comprimido', 'gotas', 'xarope', 'solução', 'suspensão',
            'pó', 'sachê', 'ampola', 'frasco-ampola', 'pomada', 'creme', 'gel',
            'spray nasal', 'colírio', 'adesivo', 'supositório', 'óvulo',
            'ação prolongada', 'cartela com \d+ comprimidos', 'cartelas com \d+ comprimidos'
        ];
        
        foreach ($forms as $form) {
            $name = preg_replace('/\s' . preg_quote($form, '/') . '/i', '', $name);
        }
        
        // Remover " - " e " + " se estiverem no final
        $name = preg_replace('/(\s[-+]\s*)+$/', '', $name);
        
        return trim($name);
    }

    /**
     * Gerar palavras-chave para busca
     */
    public static function generateSearchKeywords($nomeProduto, $principioAtivo = null)
    {
        $keywords = [];
        
        // Adicionar nome do produto
        $keywords[] = self::normalizeName($nomeProduto);
        
        // Adicionar nome sem concentração
        $nomeLimpo = self::extractNameOnly($nomeProduto);
        if ($nomeLimpo !== $nomeProduto) {
            $keywords[] = self::normalizeName($nomeLimpo);
        }
        
        // Adicionar princípio ativo se disponível
        if (!empty($principioAtivo)) {
            $keywords[] = self::normalizeName($principioAtivo);
        }
        
        // Adicionar palavras individuais
        $words = explode(' ', $nomeProduto);
        foreach ($words as $word) {
            $word = trim($word);
            if (strlen($word) > 2) {
                $keywords[] = self::normalizeName($word);
            }
        }
        
        return implode(' ', array_unique($keywords));
    }

    /**
     * Buscar medicamentos por termo (otimizado)
     */
    public static function search($query, $limit = 10)
    {
        if (empty($query) || strlen($query) < 2) {
            return collect([]);
        }

        $normalizedQuery = self::normalizeName($query);
        
        // Buscar apenas registros ativos e válidos
        $queryBuilder = self::where('is_active', true)
            ->where('situacao_registro', 'VÁLIDO');

        // Busca usando LIKE no nome normalizado (mais rápido)
        $queryBuilder->where(function($q) use ($normalizedQuery) {
            $q->where('nome_normalizado', 'LIKE', "%{$normalizedQuery}%")
              ->orWhere('search_keywords', 'LIKE', "%{$normalizedQuery}%");
        });

        return $queryBuilder
            ->orderByRaw("CASE 
                WHEN nome_normalizado LIKE ? THEN 1 
                WHEN nome_normalizado LIKE ? THEN 2 
                ELSE 3 
            END", ["{$normalizedQuery}%", "%{$normalizedQuery}%"])
            ->limit($limit)
            ->get();
    }

    /**
     * Scope para medicamentos ativos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                    ->where('situacao_registro', 'VÁLIDO');
    }

    /**
     * Scope para busca por nome
     */
    public function scopeByName($query, $name)
    {
        $normalized = self::normalizeName($name);
        return $query->where('nome_normalizado', 'LIKE', "%{$normalized}%");
    }
}







