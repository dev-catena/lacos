# 🌍 Geocodificação de Farmácias Populares

## O que é Geocodificação?

Geocodificação é o processo de converter endereços em coordenadas geográficas (latitude e longitude). Isso é necessário para:

- Calcular distâncias entre o usuário e as farmácias
- Mostrar farmácias mais próximas
- Exibir no mapa

## API Utilizada

Este script usa a **API Nominatim** do OpenStreetMap, que é:
- ✅ Gratuita
- ✅ Não requer chave de API
- ✅ Cobre todo o Brasil
- ⚠️  Tem limite de 1 requisição por segundo

## Como Usar

### 1. Após importar as farmácias

Primeiro, importe as farmácias usando o script de importação:

```bash
cd /var/www/lacos-backend
php importador_farmacias_oficial.php
```

### 2. Executar geocodificação

```bash
cd /var/www/lacos-backend
php geocodificar_farmacias.php
```

Por padrão, o script processa **100 farmácias** por vez (para respeitar o rate limit).

### 3. Processar mais farmácias

Para processar um número específico:

```bash
php geocodificar_farmacias.php 200
```

### 4. Processar em lotes

Como a API tem limite de 1 req/seg, é recomendado processar em lotes:

```bash
# Lote 1: 100 farmácias
php geocodificar_farmacias.php 100

# Aguardar alguns minutos...

# Lote 2: mais 100
php geocodificar_farmacias.php 100

# E assim por diante...
```

## Características do Script

- ✅ **Respeita rate limit**: Aguarda 1.2 segundos entre requisições
- ✅ **User-Agent obrigatório**: Nominatim exige User-Agent identificado
- ✅ **Tratamento de erros**: Pula farmácias sem endereço ou com falha
- ✅ **Progresso em tempo real**: Mostra progresso e estatísticas
- ✅ **Processamento incremental**: Pode ser executado várias vezes

## Exemplo de Saída

```
═══════════════════════════════════════════════════════════
🌍 GEOCODIFICADOR DE FARMÁCIAS POPULARES
═══════════════════════════════════════════════════════════

⚙️  Configurações:
   Limite: 100 farmácias
   Delay entre requisições: 1.2s
   API: Nominatim (OpenStreetMap)

📊 Encontradas 100 farmácias sem coordenadas

🔄 Iniciando geocodificação...

[1/100] (1.0%) J CRUZ LTDA - BRASILEIA/AC... ✅ -9.9567, -67.1850
[2/100] (2.0%) EMPREENDIMENTOS PAGUE MENOS S/A - BRASILEIA/AC... ✅ -9.9567, -67.1850
...

═══════════════════════════════════════════════════════════
📊 RESUMO DA GEOCODIFICAÇÃO
═══════════════════════════════════════════════════════════
Total processadas: 100
✅ Geocodificadas com sucesso: 95
⚠️  Sem endereço (puladas): 2
❌ Falhas: 3
═══════════════════════════════════════════════════════════

📊 Farmácias restantes sem coordenadas: 500

💡 Para continuar, execute novamente:
   php geocodificar_farmacias.php [limite]
   Exemplo: php geocodificar_farmacias.php 100
```

## Tempo Estimado

- **100 farmácias**: ~2 minutos (1.2s por farmácia)
- **1000 farmácias**: ~20 minutos
- **5000 farmácias**: ~1h40min

## Alternativas

### Google Maps Geocoding API

Se você tiver uma chave de API do Google Maps, pode ser mais rápido:

```php
$url = "https://maps.googleapis.com/maps/api/geocode/json?" . http_build_query([
    'address' => $fullAddress,
    'key' => 'SUA_CHAVE_API',
]);
```

**Vantagens:**
- Mais rápido (sem delay obrigatório)
- Mais preciso
- Permite processar em lote

**Desvantagens:**
- Requer chave de API
- Tem limites de uso (pode ter custos)

## Verificar Resultados

Após geocodificar, verifique quantas farmácias têm coordenadas:

```bash
cd /var/www/lacos-backend
php artisan tinker

# No tinker:
App\Models\PopularPharmacy::whereNotNull('latitude')->count();
App\Models\PopularPharmacy::whereNull('latitude')->count();
```

## Dicas

1. **Execute em horários de menor tráfego** para não sobrecarregar a API
2. **Processe em lotes pequenos** (50-100 por vez)
3. **Verifique periodicamente** quantas ainda faltam
4. **Farmácias sem endereço** não podem ser geocodificadas - serão puladas






