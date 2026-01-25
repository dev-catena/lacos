# 📥 Como Importar Lista Completa de Medicamentos da ANVISA

## 📋 Visão Geral

A ANVISA (Agência Nacional de Vigilância Sanitária) não disponibiliza uma API pública direta, mas fornece dados em diferentes formatos. Este guia explica como obter e importar esses dados.

## 🔍 Fontes de Dados da ANVISA

### 1. Lista de Medicamentos de Referência (LMR)
- **URL:** https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/medicamentos-de-referencia
- **Formato:** PDF (dividido em Grupo A e Grupo B)
- **Conteúdo:** Medicamentos inovadores registrados

### 2. Bulário Eletrônico
- **URL:** https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/bulario-eletronico
- **Formato:** PDF, consulta online
- **Conteúdo:** Bulas de medicamentos registrados

### 3. Consulta de Medicamentos
- **URL:** https://consultas.anvisa.gov.br/#/medicamentos/
- **Formato:** Interface web, possível exportar dados
- **Conteúdo:** Base completa de medicamentos registrados

### 4. RENAME (Relação Nacional de Medicamentos Essenciais)
- **URL:** Ministério da Saúde
- **Formato:** PDF/Excel
- **Conteúdo:** Lista de medicamentos essenciais

## 🚀 Método 1: Importar de Arquivo CSV/TXT (RECOMENDADO)

### Passo 1: Obter Dados

1. **Opção A: Baixar da ANVISA**
   - Acesse o site da ANVISA
   - Procure por "Lista de Medicamentos" ou "Consulta de Medicamentos"
   - Exporte os dados em CSV ou Excel
   - Converta para CSV se necessário

2. **Opção B: Usar Lista Pública**
   - Procure por listas públicas de medicamentos brasileiros
   - Verifique a fonte e data de atualização

### Passo 2: Importar com o Script

```bash
# Importar de CSV
node scripts/importar_medicamentos_anvisa.js \
  --fonte csv \
  --arquivo medicamentos_anvisa.csv \
  --coluna 0

# Importar de TXT (um por linha)
node scripts/importar_medicamentos_anvisa.js \
  --fonte txt \
  --arquivo lista_medicamentos.txt

# Especificar arquivo de saída
node scripts/importar_medicamentos_anvisa.js \
  --fonte csv \
  --arquivo medicamentos.csv \
  --saida src/data/medications.json
```

### Passo 3: Verificar Resultado

```bash
# Verificar quantos medicamentos foram importados
node -e "
const data = require('./src/data/medications.json');
console.log('Total:', data.length);
console.log('Primeiros 10:', data.slice(0, 10));
"
```

## 🚀 Método 2: Baixar Automaticamente de URL

Se você tiver uma URL direta para um arquivo CSV/TXT:

```bash
node scripts/importar_medicamentos_anvisa.js \
  --fonte url \
  --url "https://exemplo.com/medicamentos.csv"
```

## 📄 Método 3: Processar PDF (Avançado)

Para processar PDFs da ANVISA, você precisará:

1. **Instalar dependência:**
   ```bash
   npm install pdf-parse
   ```

2. **Criar script de extração:**
   ```javascript
   const pdf = require('pdf-parse');
   const fs = require('fs');
   
   const dataBuffer = fs.readFileSync('medicamentos.pdf');
   pdf(dataBuffer).then(data => {
     // Extrair nomes de medicamentos do texto
     const lines = data.text.split('\n');
     // Processar linhas...
   });
   ```

## 🔧 Opções do Script

```bash
--fonte <tipo>        # Tipo: csv, txt, url
--arquivo <caminho>    # Arquivo local
--url <url>           # URL para baixar
--saida <caminho>     # Arquivo de saída (padrão: src/data/medications.json)
--coluna <numero>     # Coluna do CSV (padrão: 0 = primeira)
--no-backup           # Não criar backup
--help                # Mostrar ajuda
```

## 📊 Exemplo Completo

### 1. Baixar dados da ANVISA manualmente

1. Acesse: https://consultas.anvisa.gov.br/#/medicamentos/
2. Faça uma busca ampla (ex: todos os medicamentos)
3. Exporte os resultados em CSV
4. Salve como `medicamentos_anvisa.csv`

### 2. Importar

```bash
cd /home/darley/lacos

# Importar
node scripts/importar_medicamentos_anvisa.js \
  --fonte csv \
  --arquivo medicamentos_anvisa.csv \
  --coluna 0

# Verificar
node -e "
const data = require('./src/data/medications.json');
console.log('✅ Total de medicamentos:', data.length);
"
```

### 3. Testar no App

Após importar, reinicie o app e teste a busca por medicamentos.

## ⚠️ Importante

### Limitações

1. **ANVISA não tem API pública:** Você precisa baixar dados manualmente
2. **Formatos variados:** Dados podem vir em PDF, Excel, CSV
3. **Atualizações:** Lista precisa ser atualizada periodicamente

### Dicas

1. **Backup automático:** O script cria backup antes de sobrescrever
2. **Validação:** Sempre verifique o resultado após importar
3. **Limpeza:** O script remove duplicatas e normaliza nomes
4. **Performance:** Listas com 10.000+ medicamentos ainda funcionam bem

### Estrutura Esperada do CSV

O CSV deve ter pelo menos uma coluna com nomes de medicamentos:

```csv
Nome do Medicamento,Outras Colunas...
Losartana,...
Amoxicilina,...
Paracetamol,...
```

Se o nome estiver em outra coluna, use `--coluna`:

```bash
# Se o nome estiver na 2ª coluna (índice 1)
--coluna 1
```

## 🔄 Atualização Periódica

Para manter a lista atualizada:

1. **Criar script de atualização:**
   ```bash
   #!/bin/bash
   # scripts/atualizar_medicamentos.sh
   
   echo "📥 Atualizando lista de medicamentos..."
   
   # Baixar dados atualizados (ajustar URL)
   # wget -O medicamentos.csv "https://..."
   
   # Importar
   node scripts/importar_medicamentos_anvisa.js \
     --fonte csv \
     --arquivo medicamentos.csv \
     --no-backup
   
   echo "✅ Atualização concluída!"
   ```

2. **Agendar atualização:**
   ```bash
   # Adicionar ao crontab (atualizar mensalmente)
   0 0 1 * * /home/darley/lacos/scripts/atualizar_medicamentos.sh
   ```

## 🆘 Troubleshooting

### Erro: "Arquivo não encontrado"
- Verifique o caminho do arquivo
- Use caminho absoluto se necessário

### Erro: "Nenhum medicamento encontrado"
- Verifique se o CSV tem cabeçalho (será ignorado)
- Verifique a coluna correta com `--coluna`
- Verifique se o arquivo não está vazio

### Muitos duplicatas
- O script remove duplicatas automaticamente
- Verifique se há variações de escrita (ex: "Losartana" vs "Losartana Potássica")

### Performance lenta
- Listas com 50.000+ itens podem ser lentas
- Considere filtrar apenas medicamentos ativos/essenciais

## 📚 Recursos Adicionais

- **ANVISA:** https://www.gov.br/anvisa/
- **Bulário Eletrônico:** https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/bulario-eletronico
- **RENAME:** Lista do Ministério da Saúde
- **Farmácia Popular:** Lista de medicamentos gratuitos

## 🎯 Próximos Passos

1. ✅ Baixar dados da ANVISA
2. ✅ Importar usando o script
3. ✅ Testar no app
4. 🔄 Configurar atualização periódica
5. 🔮 Implementar integração automática (futuro)







