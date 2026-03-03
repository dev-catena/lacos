# 💊 Implementar Busca de Preços de Medicamentos

Este documento explica como implementar a busca de preços reais de medicamentos usando o pacote `med_price_anvisa` no backend Laravel.

## 📦 Instalação do Pacote

No servidor, acesse o diretório do backend Laravel e instale o pacote:

```bash
cd /var/www/lacos-backend
composer require med_price_anvisa
```

Ou adicione ao `composer.json`:

```json
{
  "require": {
    "med_price_anvisa": "^1.0"
  }
}
```

## 🔧 Implementação do Controller

Crie ou atualize o `MedicationController` para adicionar o método de busca de preços:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MedicationController extends Controller
{
    // ... métodos existentes ...

    /**
     * Buscar preço de medicamento na ANVISA
     * GET /api/medications/price?name={nome_medicamento}
     */
    public function getPrice(Request $request)
    {
        try {
            $medicationName = $request->query('name');
            
            if (!$medicationName || strlen(trim($medicationName)) < 2) {
                return response()->json([
                    'success' => false,
                    'error' => 'Nome do medicamento inválido',
                ], 400);
            }

            // Usar o pacote med_price_anvisa
            // Nota: Ajuste conforme a documentação do pacote
            $medPriceAnvisa = new \MedPriceAnvisa();
            
            // Buscar medicamento
            $results = $medPriceAnvisa->search($medicationName);
            
            if (!$results || empty($results)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Medicamento não encontrado na base da ANVISA',
                ], 404);
            }

            // Pegar o primeiro resultado ou o mais relevante
            $medication = is_array($results) ? $results[0] : $results;
            
            // Extrair preço
            $price = $medication['preco'] ?? 
                    $medication['price'] ?? 
                    $medication['preco_fabricante'] ??
                    $medication['preco_maximo'] ??
                    null;

            if (!$price) {
                return response()->json([
                    'success' => false,
                    'error' => 'Preço não disponível para este medicamento',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'name' => $medication['nome'] ?? $medication['name'] ?? $medicationName,
                'price' => floatval($price),
                'presentation' => $medication['apresentacao'] ?? $medication['presentation'] ?? null,
                'manufacturer' => $medication['fabricante'] ?? $medication['manufacturer'] ?? null,
                'registration' => $medication['registro'] ?? $medication['registration'] ?? null,
                'source' => 'anvisa',
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao buscar preço de medicamento: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar preço: ' . $e->getMessage(),
            ], 500);
        }
    }
}
```

## 🛣️ Adicionar Rota

Adicione a rota no arquivo `routes/api.php` (ou `api_routes_corrected.php`):

```php
// Dentro do grupo de rotas autenticadas
Route::middleware('auth:sanctum')->group(function () {
    // ... outras rotas ...
    
    // Buscar preço de medicamento
    Route::get('/medications/price', [MedicationController::class, 'getPrice']);
    
    // ... outras rotas ...
});
```

## 📝 Notas Importantes

1. **Pacote pode não estar disponível para PHP**: O pacote `med_price_anvisa` pode ser apenas para Node.js. Se for o caso, você pode:
   - Criar um microserviço Node.js que usa o pacote
   - Usar uma API alternativa
   - Fazer scraping do site da ANVISA (com cuidado legal)

2. **Alternativa - API REST da ANVISA**: Verifique se a ANVISA oferece uma API REST oficial para consulta de preços.

3. **Cache**: Considere implementar cache para evitar muitas requisições à API da ANVISA.

4. **Rate Limiting**: Implemente rate limiting para evitar sobrecarga.

## ✅ Teste

Após implementar, teste o endpoint:

```bash
curl -X GET "http://192.168.0.20/api/medications/price?name=Losartana" \
  -H "Authorization: Bearer {seu_token}"
```

Resposta esperada:

```json
{
  "success": true,
  "name": "Losartana",
  "price": 25.50,
  "presentation": "Comprimido 50mg",
  "manufacturer": "Fabricante X",
  "registration": "123456789",
  "source": "anvisa"
}
```

## 🔄 Atualização do Frontend

O frontend já está preparado para usar este endpoint. Quando o backend estiver implementado, o serviço `medicationPriceService.js` automaticamente tentará buscar no backend primeiro.








