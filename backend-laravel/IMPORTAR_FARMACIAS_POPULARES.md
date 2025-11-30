# 📋 Como Importar Dados de Farmácias Populares

## 1. Baixar o Arquivo Oficial

O Ministério da Saúde disponibiliza a lista oficial de farmácias credenciadas ao Programa Farmácia Popular do Brasil (PFPB) em formato Excel:

**Link oficial:** https://www.gov.br/saude/pt-br/composicao/sectics/farmacia-popular/publicacoes/farmacias_credenciadas_pfpb_atualizada.xlsx

## 2. Converter Excel para CSV

Após baixar o arquivo Excel, converta-o para CSV para facilitar a importação. Você pode usar:

- LibreOffice Calc: Abrir o Excel → Salvar como CSV
- Google Sheets: Fazer upload → Download como CSV
- Script Python (veja exemplo abaixo)

## 3. Estrutura Esperada do CSV

O CSV deve ter as seguintes colunas (ajuste conforme o arquivo oficial):

```
Nome da Farmácia,Endereço,Bairro,Cidade,Estado,CEP,Telefone
```

## 4. Script de Importação

Crie um script PHP para importar os dados. Exemplo básico:

```php
<?php
// importar_farmacias.php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\PopularPharmacy;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Ler arquivo CSV
$csvFile = __DIR__ . '/farmacias_populares.csv';
$handle = fopen($csvFile, 'r');

if ($handle === false) {
    die("Erro ao abrir arquivo CSV\n");
}

// Pular cabeçalho
fgetcsv($handle);

$count = 0;
while (($data = fgetcsv($handle)) !== false) {
    // Ajustar índices conforme a estrutura do seu CSV
    $name = trim($data[0] ?? '');
    $address = trim($data[1] ?? '');
    $neighborhood = trim($data[2] ?? '');
    $city = trim($data[3] ?? '');
    $state = trim($data[4] ?? '');
    $zipCode = trim($data[5] ?? '');
    $phone = trim($data[6] ?? '');

    if (empty($name) || empty($city) || empty($state)) {
        continue; // Pular linhas inválidas
    }

    // Verificar se já existe
    $exists = PopularPharmacy::where('name', $name)
        ->where('city', $city)
        ->where('address', $address)
        ->first();

    if ($exists) {
        continue;
    }

    // Criar registro (sem coordenadas por enquanto)
    PopularPharmacy::create([
        'name' => $name,
        'address' => $address,
        'neighborhood' => $neighborhood,
        'city' => $city,
        'state' => strtoupper($state),
        'zip_code' => $zipCode,
        'phone' => $phone,
        'latitude' => null, // Será preenchido depois com geocodificação
        'longitude' => null,
        'is_active' => true,
    ]);

    $count++;
}

fclose($handle);

echo "Importadas {$count} farmácias\n";
```

## 5. Geocodificação (Opcional mas Recomendado)

Para calcular distâncias, você precisa das coordenadas (latitude/longitude) de cada farmácia. Você pode usar:

### Opção A: API do Google Maps Geocoding
```php
// geocodificar_farmacias.php

use App\Models\PopularPharmacy;

$pharmacies = PopularPharmacy::whereNull('latitude')->get();

foreach ($pharmacies as $pharmacy) {
    $address = "{$pharmacy->address}, {$pharmacy->city}, {$pharmacy->state}";
    
    // Usar API do Google Maps (requer chave de API)
    $url = "https://maps.googleapis.com/maps/api/geocode/json?address=" . 
           urlencode($address) . "&key=SUA_CHAVE_API";
    
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    
    if ($data['status'] === 'OK' && !empty($data['results'])) {
        $location = $data['results'][0]['geometry']['location'];
        
        $pharmacy->update([
            'latitude' => $location['lat'],
            'longitude' => $location['lng'],
        ]);
        
        echo "Geocodificado: {$pharmacy->name}\n";
        
        // Aguardar para não exceder limite da API
        sleep(1);
    }
}
```

### Opção B: API Nominatim (OpenStreetMap - Gratuita)
```php
// Similar ao Google, mas usando Nominatim
$url = "https://nominatim.openstreetmap.org/search?q=" . 
       urlencode($address) . "&format=json&limit=1";
```

## 6. Executar Importação

```bash
cd /var/www/lacos-backend
php importar_farmacias.php
php geocodificar_farmacias.php  # Se optar por geocodificar
```

## Notas Importantes

1. **Rate Limiting**: APIs de geocodificação têm limites. Use com moderação.
2. **Validação**: Valide os dados antes de inserir.
3. **Atualização**: Execute periodicamente para manter os dados atualizados.
4. **Backup**: Faça backup antes de executar scripts de importação em massa.

