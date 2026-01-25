<?php

/**
 * Geocodificador de Farmácias Populares usando API Nominatim (OpenStreetMap)
 * 
 * Este script busca coordenadas (latitude/longitude) para farmácias que ainda não têm
 * 
 * USO:
 * php geocodificar_farmacias.php
 * 
 * IMPORTANTE:
 * - A API Nominatim tem limite de 1 requisição por segundo
 * - Use com moderação para não sobrecarregar o serviço
 * - Considere fazer em lotes pequenos
 */

require __DIR__ . '/vendor/autoload.php';

use App\Models\PopularPharmacy;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "═══════════════════════════════════════════════════════════\n";
echo "🌍 GEOCODIFICADOR DE FARMÁCIAS POPULARES\n";
echo "═══════════════════════════════════════════════════════════\n\n";

// Configurações
$state = strtoupper($argv[1] ?? 'MG'); // Estado a processar (padrão: MG - Minas Gerais)
$limit = $argv[2] ?? 100; // Limite de farmácias a processar (padrão: 100)
$delay = 1.2; // Delay entre requisições (segundos) - Nominatim pede 1 req/seg, usamos 1.2 para segurança
$userAgent = 'LacosApp/1.0 (contato@lacos.com.br)'; // User-Agent obrigatório para Nominatim

echo "⚙️  Configurações:\n";
echo "   Estado: {$state}\n";
echo "   Limite: {$limit} farmácias\n";
echo "   Delay entre requisições: {$delay}s\n";
echo "   API: Nominatim (OpenStreetMap)\n\n";

// Buscar farmácias sem coordenadas do estado especificado
$pharmacies = PopularPharmacy::where(function($query) {
        $query->whereNull('latitude')
              ->orWhereNull('longitude');
    })
    ->where('state', $state)
    ->where('is_active', true)
    ->limit($limit)
    ->get();

$total = $pharmacies->count();

if ($total === 0) {
    echo "✅ Todas as farmácias de {$state} já têm coordenadas!\n";
    
    // Mostrar estatísticas
    $totalState = PopularPharmacy::where('state', $state)
        ->where('is_active', true)
        ->count();
    $withCoords = PopularPharmacy::where('state', $state)
        ->whereNotNull('latitude')
        ->whereNotNull('longitude')
        ->where('is_active', true)
        ->count();
    
    echo "📊 Total de farmácias em {$state}: {$totalState}\n";
    echo "📊 Com coordenadas: {$withCoords}\n";
    exit(0);
}

echo "📊 Encontradas {$total} farmácias sem coordenadas\n\n";

// Estatísticas
$stats = [
    'total' => $total,
    'geocoded' => 0,
    'failed' => 0,
    'skipped' => 0,
];

/**
 * Geocodificar endereço usando Nominatim com múltiplas estratégias
 */
function geocodeAddress($address, $city, $state, $userAgent) {
    // Limpar e normalizar dados
    $address = trim($address);
    $city = trim($city);
    $state = strtoupper(trim($state));
    
    // Estratégias de busca (da mais específica para a mais genérica)
    $strategies = [];
    
    // Estratégia 1: Endereço completo + Cidade + Estado
    if (!empty($address) && !empty($city)) {
        $strategies[] = "{$address}, {$city}, {$state}, Brasil";
    }
    
    // Estratégia 2: Endereço + Cidade (sem estado)
    if (!empty($address) && !empty($city)) {
        $strategies[] = "{$address}, {$city}, Brasil";
    }
    
    // Estratégia 3: Só endereço + Estado
    if (!empty($address)) {
        $strategies[] = "{$address}, {$state}, Brasil";
    }
    
    // Estratégia 4: Cidade + Estado (sem endereço específico)
    if (!empty($city)) {
        $strategies[] = "{$city}, {$state}, Brasil";
        // Também tentar com "Centro" se não tiver endereço
        if (empty($address)) {
            $strategies[] = "Centro, {$city}, {$state}, Brasil";
        }
    }
    
    // Estratégia 5: Só cidade
    if (!empty($city)) {
        $strategies[] = "{$city}, Brasil";
    }
    
    // Remover duplicatas mantendo ordem
    $strategies = array_unique($strategies);
    
    // Tentar cada estratégia
    foreach ($strategies as $strategy) {
        $result = tryGeocode($strategy, $userAgent, $state);
        if ($result !== null) {
            return $result;
        }
        
        // Pequeno delay entre tentativas
        usleep(200000); // 0.2 segundos
    }
    
    return null;
}

/**
 * Tentar geocodificar um endereço específico
 */
function tryGeocode($query, $userAgent, $expectedState = null) {
    // URL da API Nominatim
    $url = "https://nominatim.openstreetmap.org/search?" . http_build_query([
        'q' => $query,
        'format' => 'json',
        'limit' => 3, // Pegar até 3 resultados para escolher o melhor
        'addressdetails' => 1,
        'countrycodes' => 'br', // Limitar ao Brasil
    ]);
    
    // Configurar contexto HTTP com User-Agent (obrigatório)
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'User-Agent: ' . $userAgent,
                'Accept: application/json',
                'Accept-Language: pt-BR,pt;q=0.9',
            ],
            'timeout' => 15,
        ],
    ]);
    
    // Fazer requisição
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        return null;
    }
    
    $data = json_decode($response, true);
    
    if (empty($data) || !is_array($data)) {
        return null;
    }
    
    // Se temos estado esperado, tentar encontrar resultado no estado correto
    if ($expectedState && count($data) > 1) {
        foreach ($data as $item) {
            $address = $item['address'] ?? [];
            $resultState = strtoupper($address['state'] ?? $address['state_code'] ?? '');
            
            if ($resultState === $expectedState || 
                (strlen($resultState) === 2 && $resultState === $expectedState)) {
                return [
                    'latitude' => (float) $item['lat'],
                    'longitude' => (float) $item['lon'],
                    'display_name' => $item['display_name'] ?? $query,
                    'confidence' => $item['importance'] ?? 0.5,
                ];
            }
        }
    }
    
    // Usar o primeiro resultado (geralmente o mais relevante)
    $result = $data[0];
    
    return [
        'latitude' => (float) $result['lat'],
        'longitude' => (float) $result['lon'],
        'display_name' => $result['display_name'] ?? $query,
        'confidence' => $result['importance'] ?? 0.5,
    ];
}

echo "🔄 Iniciando geocodificação...\n\n";

foreach ($pharmacies as $index => $pharmacy) {
    $current = $index + 1;
    $progress = round(($current / $total) * 100, 1);
    
    echo "[{$current}/{$total}] ({$progress}%) {$pharmacy->name} - {$pharmacy->city}/{$pharmacy->state}... ";
    
    // Verificar se tem endereço
    if (empty($pharmacy->address)) {
        echo "⚠️  Sem endereço\n";
        $stats['skipped']++;
        continue;
    }
    
    // Geocodificar
    $result = geocodeAddress(
        $pharmacy->address ?? '',
        $pharmacy->city ?? '',
        $pharmacy->state ?? '',
        $userAgent
    );
    
    if ($result === null) {
        // Tentar uma última vez com apenas cidade
        if (!empty($pharmacy->city)) {
            $result = tryGeocode(
                "{$pharmacy->city}, {$pharmacy->state}, Brasil",
                $userAgent,
                $pharmacy->state
            );
        }
        
        if ($result === null) {
            echo "❌ Não encontrado\n";
            $stats['failed']++;
            continue;
        }
    }
    
    // Validar coordenadas (deve estar no Brasil aproximadamente)
    $lat = $result['latitude'];
    $lon = $result['longitude'];
    
    // Brasil está aproximadamente entre -35 e 5 de latitude e -75 e -30 de longitude
    if ($lat < -35 || $lat > 5 || $lon < -75 || $lon > -30) {
        echo "⚠️  Coordenadas fora do Brasil ({$lat}, {$lon}) - ignorando\n";
        $stats['failed']++;
        continue;
    }
    
    // Atualizar coordenadas
    try {
        $pharmacy->update([
            'latitude' => $lat,
            'longitude' => $lon,
        ]);
        
        $confidence = isset($result['confidence']) ? round($result['confidence'], 2) : 'N/A';
        echo "✅ {$lat}, {$lon} (conf: {$confidence})\n";
        $stats['geocoded']++;
        
    } catch (\Exception $e) {
        echo "❌ Erro ao salvar: " . $e->getMessage() . "\n";
        $stats['failed']++;
    }
    
    // Aguardar entre requisições (respeitar rate limit)
    // Nominatim pede 1 req/seg, mas como tentamos múltiplas estratégias,
    // aumentamos o delay para evitar bloqueio
    if ($current < $total) {
        sleep($delay);
    }
}

// Resumo
echo "\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "📊 RESUMO DA GEOCODIFICAÇÃO\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "Total processadas: {$stats['total']}\n";
echo "✅ Geocodificadas com sucesso: {$stats['geocoded']}\n";
echo "⚠️  Sem endereço (puladas): {$stats['skipped']}\n";
echo "❌ Falhas: {$stats['failed']}\n";
echo "═══════════════════════════════════════════════════════════\n";

if ($stats['geocoded'] > 0) {
    $remaining = PopularPharmacy::where(function($query) {
            $query->whereNull('latitude')
                  ->orWhereNull('longitude');
        })
        ->where('state', $state)
        ->where('is_active', true)
        ->count();
    
    echo "\n📊 Farmácias restantes sem coordenadas em {$state}: {$remaining}\n";
    
    if ($remaining > 0) {
        echo "\n💡 Para continuar, execute novamente:\n";
        echo "   php geocodificar_farmacias.php [estado] [limite]\n";
        echo "   Exemplo: php geocodificar_farmacias.php MG 100\n";
        echo "   Exemplo: php geocodificar_farmacias.php SP 200\n";
    } else {
        echo "\n✅ Todas as farmácias de {$state} foram geocodificadas!\n";
    }
    
    // Mostrar estatísticas por estado
    echo "\n📊 Estatísticas por estado:\n";
    $states = PopularPharmacy::selectRaw('state, 
        COUNT(*) as total,
        SUM(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 ELSE 0 END) as com_coordenadas,
        SUM(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 ELSE 0 END) as sem_coordenadas
    ')
    ->where('is_active', true)
    ->groupBy('state')
    ->orderBy('state')
    ->get();
    
    foreach ($states as $stateStat) {
        $percent = $stateStat->total > 0 
            ? round(($stateStat->com_coordenadas / $stateStat->total) * 100, 1) 
            : 0;
        echo "   {$stateStat->state}: {$stateStat->com_coordenadas}/{$stateStat->total} ({$percent}%) geocodificadas\n";
    }
}

echo "\n";

