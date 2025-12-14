# 📋 Como Atualizar a Lista de Medicamentos

## Estrutura

A lista completa de medicamentos está em `src/data/medications.json`.

## Formato do Arquivo JSON

O arquivo deve ser um array simples de strings:

```json
[
  "Losartana",
  "Enalapril",
  "Captopril",
  "..."
]
```

## Como Atualizar com a Lista de 7901 Medicamentos

### Opção 1: Converter de Texto para JSON (Recomendado)

Se você tem a lista em formato texto (um por linha), pode usar este script Node.js:

```bash
# Criar arquivo temporário com a lista (um medicamento por linha)
# Exemplo: lista_medicamentos.txt

# Converter para JSON
node -e "
const fs = require('fs');
const lines = fs.readFileSync('lista_medicamentos.txt', 'utf8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);
const json = JSON.stringify(lines, null, 2);
fs.writeFileSync('src/data/medications.json', json);
console.log('✅ Convertidos', lines.length, 'medicamentos');
"
```

### Opção 2: Converter de CSV para JSON

Se você tem a lista em CSV:

```bash
node -e "
const fs = require('fs');
const csv = fs.readFileSync('lista_medicamentos.csv', 'utf8');
const lines = csv.split('\n')
  .map(line => line.split(',')[0].trim().replace(/^\"/, '').replace(/\"$/, ''))
  .filter(line => line.length > 0 && line !== 'Nome');
const json = JSON.stringify(lines, null, 2);
fs.writeFileSync('src/data/medications.json', json);
console.log('✅ Convertidos', lines.length, 'medicamentos');
"
```

### Opção 3: Editar Manualmente

Se preferir, pode editar diretamente o arquivo `src/data/medications.json` e substituir o conteúdo pelo array completo.

## Verificação

Após atualizar, verifique se o arquivo está correto:

```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/medications.json', 'utf8'));
console.log('Total de medicamentos:', data.length);
console.log('Primeiros 5:', data.slice(0, 5));
"
```

## Performance

- A lista é carregada apenas uma vez (lazy loading)
- Fica em cache após o primeiro carregamento
- A busca é feita localmente (filtro em memória)
- Com 7901 itens, a busca ainda é muito rápida (< 10ms)

## Fallback

Se o arquivo JSON não for encontrado ou tiver erro, o sistema usa automaticamente uma lista reduzida de 47 medicamentos mais comuns.







