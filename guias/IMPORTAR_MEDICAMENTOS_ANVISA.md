# 📥 Como Importar Medicamentos da ANVISA para o Banco de Dados

## ✅ O que foi criado

### Backend (Laravel)

1. **Migration** (`2024_12_20_000001_create_medication_catalog_table.php`)
   - Tabela `medication_catalog` com índices otimizados
   - Campos: nome_produto, nome_normalizado, principio_ativo, etc.
   - Índices para busca rápida (nome_normalizado, search_keywords)
   - Full-text search para busca avançada

2. **Model** (`MedicationCatalog.php`)
   - Métodos de normalização de nomes
   - Busca otimizada com remoção de duplicatas
   - Extração de nome sem concentração
   - Geração de palavras-chave para busca

3. **Controller** (`MedicationCatalogController.php`)
   - `GET /api/medications/search?q={query}&limit={limit}` - Busca de medicamentos
   - `GET /api/medications/info?name={nome}` - Informações completas
   - `GET /api/medications/stats` - Estatísticas do catálogo

4. **Comando Artisan** (`ImportMedicationsFromCSV`)
   - Importa CSV da ANVISA
   - Remove duplicatas automaticamente
   - Processa em chunks para performance
   - Normaliza e indexa dados

### Frontend (React Native)

1. **Serviço atualizado** (`medicationSearchService.js`)
   - Busca primeiro na API do backend
   - Fallback para lista local se API falhar
   - Mantém funcionalidade de Farmácia Popular

## 🚀 Como Importar

### Método 1: Usar Script Automático (RECOMENDADO)

```bash
cd /home/darley/lacos
./scripts/IMPORTAR_MEDICAMENTOS_ANVISA.sh
```

O script:
1. Verifica se o arquivo CSV existe
2. Executa a migration se necessário
3. Importa os medicamentos
4. Mostra estatísticas

### Método 2: Importação Manual

```bash
cd /home/darley/lacos/backend-laravel

# 1. Executar migration
php artisan migrate --path=database/migrations/2024_12_20_000001_create_medication_catalog_table.php

# 2. Importar CSV
php artisan medications:import ../scripts/DADOS_ABERTOS_MEDICAMENTOS.csv --chunk=1000

# 3. Verificar estatísticas
php artisan tinker --execute="
    \$total = DB::table('medication_catalog')->count();
    \$active = DB::table('medication_catalog')->where('is_active', true)->where('situacao_registro', 'VÁLIDO')->count();
    echo 'Total: ' . \$total . PHP_EOL;
    echo 'Ativos: ' . \$active . PHP_EOL;
"
```

## 📊 Otimizações Implementadas

### 1. Eliminação de Duplicatas

- **No banco:** Ignora registros com mesmo `nome_normalizado` e `numero_registro_produto`
- **Na busca:** Remove duplicatas por nome (sem concentração) antes de retornar
- **Resultado:** Cada medicamento aparece apenas uma vez na lista

### 2. Índices para Performance

- `nome_normalizado` - Busca rápida por nome
- `search_keywords` - Busca por palavras-chave
- `is_active` + `situacao_registro` - Filtro de registros válidos
- Full-text search - Busca avançada em múltiplos campos

### 3. Normalização de Dados

- Remove acentos para busca case-insensitive
- Extrai nome sem concentração para exibição
- Gera palavras-chave para busca parcial

## 🔍 Funcionalidades Mantidas

### ✅ Farmácia Popular

A funcionalidade de Farmácia Popular **continua funcionando**:

1. **Verificação:** O método `isFarmaciaPopular()` no `medicationSearchService.js` verifica se o medicamento está na lista
2. **Badge:** Aparece badge "Disponível na Farmácia Popular" quando aplicável
3. **Farmácias Próximas:** Componente `PopularPharmacies` mostra farmácias populares próximas

**Nada mudou** - a funcionalidade está intacta!

### ✅ Busca Otimizada

- Busca primeiro no banco de dados (mais rápido)
- Fallback para lista local se necessário
- Remove duplicatas automaticamente
- Mostra apenas nome (sem concentração) na lista

## 📝 Estrutura do CSV

O CSV deve ter as seguintes colunas (separadas por `;`):

```
TIPO_PRODUTO;NOME_PRODUTO;DATA_FINALIZACAO_PROCESSO;CATEGORIA_REGULATORIA;
NUMERO_REGISTRO_PRODUTO;DATA_VENCIMENTO_REGISTRO;NUMERO_PROCESSO;
CLASSE_TERAPEUTICA;EMPRESA_DETENTORA_REGISTRO;SITUACAO_REGISTRO;PRINCIPIO_ATIVO
```

## 🔧 Opções do Comando de Importação

```bash
php artisan medications:import <arquivo> [opções]

Opções:
  --chunk=1000          Tamanho do chunk (padrão: 1000)
  --skip-duplicates     Pular duplicatas sem avisar
```

## 📊 Estatísticas Após Importação

Após importar, você pode verificar:

```bash
# Via API
curl http://193.203.182.22/api/medications/stats

# Via Tinker
php artisan tinker
>>> DB::table('medication_catalog')->count();
>>> DB::table('medication_catalog')->where('is_active', true)->count();
```

## 🧪 Testar a API

```bash
# Buscar medicamentos
curl "http://193.203.182.22/api/medications/search?q=paracetamol&limit=10"

# Informações de um medicamento
curl "http://193.203.182.22/api/medications/info?name=Paracetamol"

# Estatísticas
curl "http://193.203.182.22/api/medications/stats"
```

## ⚠️ Importante

1. **Backup:** O comando não cria backup automático. Faça backup do banco antes de importar grandes volumes
2. **Performance:** Importação de 36.000+ registros pode levar alguns minutos
3. **Duplicatas:** O sistema remove duplicatas automaticamente
4. **Ativos:** Apenas registros com `SITUACAO_REGISTRO = 'VÁLIDO'` são marcados como ativos

## 🔄 Atualização Futura

Para atualizar a lista no futuro:

```bash
# Limpar tabela (opcional)
php artisan tinker --execute="DB::table('medication_catalog')->truncate();"

# Reimportar
php artisan medications:import ../scripts/DADOS_ABERTOS_MEDICAMENTOS.csv
```

## ✅ Checklist de Importação

- [ ] Migration executada
- [ ] CSV verificado
- [ ] Importação executada
- [ ] Estatísticas verificadas
- [ ] API testada
- [ ] App testado (busca funcionando)
- [ ] Farmácia Popular funcionando





