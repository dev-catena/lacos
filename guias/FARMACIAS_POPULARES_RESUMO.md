# 🏥 Implementação de Farmácias Populares - Resumo

## ✅ O que foi implementado:

### Backend (Laravel)

1. **Migration** (`create_popular_pharmacies_table.php`)
   - Tabela `popular_pharmacies` com campos:
     - Nome, endereço, bairro, cidade, estado, CEP, telefone
     - Latitude e longitude para busca por proximidade
     - Campo `is_active` para ativar/desativar farmácias

2. **Modelo** (`PopularPharmacy.php`)
   - Método `distanceFrom()` para calcular distância usando fórmula de Haversine
   - Scopes para buscar farmácias ativas e por localização

3. **Controller** (`PopularPharmacyController.php`)
   - `getNearby()` - Busca farmácias próximas usando coordenadas (raio em km)
   - `getByLocation()` - Busca farmácias por cidade/estado
   - `index()` - Lista todas as farmácias com paginação

4. **Rotas** (`api_routes_corrected.php`)
   - `GET /api/popular-pharmacies` - Listar farmácias
   - `GET /api/popular-pharmacies/nearby?latitude={lat}&longitude={lon}&radius={km}` - Farmácias próximas
   - `GET /api/popular-pharmacies/by-location?city={cidade}&state={uf}` - Por localização

### Frontend (React Native)

1. **Serviço** (`popularPharmacyService.js`)
   - `getNearbyPharmacies()` - Busca usando localização do usuário
   - `getNearbyPharmaciesByCoordinates()` - Busca usando coordenadas fornecidas
   - `getPharmaciesByLocation()` - Busca por cidade/estado
   - `openInMaps()` - Abre endereço no Google Maps
   - `callPharmacy()` - Liga para a farmácia

2. **Componente** (`PopularPharmacies.js`)
   - Exibe lista de farmácias populares próximas
   - Mostra distância, endereço, telefone
   - Botões para ver no mapa e ligar
   - Loading e tratamento de erros

3. **Integração** (`MedicationDetailsScreen.js`)
   - Componente `PopularPharmacies` exibido quando o medicamento é da Farmácia Popular
   - Aparece na seção "Preço e Farmácias"

## 📋 Próximos Passos:

### 1. Baixar Dados Oficiais

O Ministério da Saúde disponibiliza a lista oficial em:
**https://www.gov.br/saude/pt-br/composicao/sectics/farmacia-popular/publicacoes/farmacias_credenciadas_pfpb_atualizada.xlsx**

### 2. Converter e Importar Dados

1. Baixar o arquivo Excel
2. Converter para CSV
3. Usar o script de importação (ver `IMPORTAR_FARMACIAS_POPULARES.md`)
4. Opcionalmente, geocodificar endereços para obter coordenadas

### 3. Executar Instalação

```bash
cd /home/darley/lacos/backend-laravel
./INSTALAR_FARMACIAS_POPULARES.sh
```

### 4. Popular Banco de Dados

Após instalar, você precisará:
1. Baixar o arquivo oficial do Ministério da Saúde
2. Converter para CSV
3. Criar e executar script de importação (exemplo em `IMPORTAR_FARMACIAS_POPULARES.md`)
4. Opcional: Geocodificar endereços para obter coordenadas

## 🔧 Estrutura da Tabela

```sql
CREATE TABLE popular_pharmacies (
    id BIGINT PRIMARY KEY,
    name VARCHAR(200),
    address VARCHAR(500),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## 📱 Como Funciona no App

1. Usuário visualiza detalhes de um medicamento
2. Se o medicamento é da Farmácia Popular, aparece badge verde
3. Abaixo do badge, lista de farmácias populares próximas (até 5, dentro de 10km)
4. Cada farmácia mostra:
   - Nome
   - Distância em km
   - Endereço completo
   - Telefone
   - Botão "Ver no mapa"
   - Botão "Ligar" (se tiver telefone)

## 🚀 Endpoints da API

### Buscar Farmácias Próximas
```
GET /api/popular-pharmacies/nearby?latitude=-19.9167&longitude=-43.9345&radius=10&limit=5
```

Resposta:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Farmácia Popular Central",
      "address": "Rua X, 123",
      "neighborhood": "Centro",
      "city": "Belo Horizonte",
      "state": "MG",
      "zip_code": "30000-000",
      "phone": "(31) 3333-4444",
      "latitude": -19.9167,
      "longitude": -43.9345,
      "distance": 2.5
    }
  ],
  "count": 1
}
```

## ⚠️ Observações Importantes

1. **Geocodificação**: Para calcular distâncias precisas, é necessário ter coordenadas (latitude/longitude) de cada farmácia. Use APIs de geocodificação (Google Maps, Nominatim) para converter endereços em coordenadas.

2. **Rate Limiting**: APIs de geocodificação têm limites. Use com moderação ao popular o banco.

3. **Atualização**: A lista de farmácias populares deve ser atualizada periodicamente conforme o Ministério da Saúde atualiza os dados.

4. **Permissões**: O app solicita permissão de localização para buscar farmácias próximas.







