#!/usr/bin/env node

/**
 * Script para importar lista completa de medicamentos da ANVISA
 * 
 * Este script pode:
 * 1. Baixar dados da ANVISA (se disponível)
 * 2. Processar arquivos CSV/Excel/TXT baixados manualmente
 * 3. Extrair nomes de medicamentos de PDFs
 * 4. Gerar lista JSON formatada
 * 
 * Uso:
 *   node scripts/importar_medicamentos_anvisa.js --fonte <fonte> [opções]
 * 
 * Fontes disponíveis:
 *   - csv: Arquivo CSV baixado da ANVISA
 *   - txt: Arquivo TXT (um por linha)
 *   - pdf: Arquivo PDF (requer pdf-parse)
 *   - url: URL para baixar dados
 * 
 * Exemplos:
 *   node scripts/importar_medicamentos_anvisa.js --fonte csv --arquivo medicamentos.csv
 *   node scripts/importar_medicamentos_anvisa.js --fonte txt --arquivo lista.txt
 *   node scripts/importar_medicamentos_anvisa.js --fonte url --url "https://..."
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Parse argumentos
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    fonte: null,
    arquivo: null,
    url: null,
    saida: path.join(__dirname, '../src/data/medications.json'),
    backup: true,
    coluna: 0, // Coluna do CSV (0 = primeira)
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--fonte' && args[i + 1]) {
      options.fonte = args[i + 1];
      i++;
    } else if (arg === '--arquivo' && args[i + 1]) {
      options.arquivo = args[i + 1];
      i++;
    } else if (arg === '--url' && args[i + 1]) {
      options.url = args[i + 1];
      i++;
    } else if (arg === '--saida' && args[i + 1]) {
      options.saida = args[i + 1];
      i++;
    } else if (arg === '--coluna' && args[i + 1]) {
      options.coluna = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--no-backup') {
      options.backup = false;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
${colors.cyan}📋 Importador de Medicamentos da ANVISA${colors.reset}

${colors.yellow}Uso:${colors.reset}
  node scripts/importar_medicamentos_anvisa.js --fonte <fonte> [opções]

${colors.yellow}Fontes disponíveis:${colors.reset}
  csv    - Arquivo CSV baixado da ANVISA
  txt    - Arquivo TXT (um medicamento por linha)
  url    - URL para baixar dados automaticamente

${colors.yellow}Opções:${colors.reset}
  --fonte <tipo>        Tipo de fonte (csv, txt, url)
  --arquivo <caminho>   Caminho do arquivo local
  --url <url>           URL para baixar (quando fonte=url)
  --saida <caminho>     Arquivo de saída JSON (padrão: src/data/medications.json)
  --coluna <numero>     Coluna do CSV com nome do medicamento (padrão: 0)
  --no-backup          Não criar backup do arquivo atual
  --help, -h            Mostrar esta ajuda

${colors.yellow}Exemplos:${colors.reset}
  # Importar de CSV
  node scripts/importar_medicamentos_anvisa.js --fonte csv --arquivo medicamentos.csv

  # Importar de TXT
  node scripts/importar_medicamentos_anvisa.js --fonte txt --arquivo lista.txt

  # Baixar e importar de URL
  node scripts/importar_medicamentos_anvisa.js --fonte url --url "https://..."

${colors.yellow}Fontes de dados da ANVISA:${colors.reset}
  1. Lista de Medicamentos de Referência (LMR)
     https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/medicamentos-de-referencia

  2. Bulário Eletrônico
     https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/bulario-eletronico

  3. Consulta de Medicamentos
     https://consultas.anvisa.gov.br/#/medicamentos/

${colors.yellow}Nota:${colors.reset}
  A ANVISA não disponibiliza uma API pública direta. Você precisará:
  1. Baixar os dados manualmente do site
  2. Ou usar este script para processar arquivos baixados
  3. Ou implementar web scraping (requer permissão)
`);
}

// Fazer backup do arquivo atual
function createBackup(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const backupPath = `${filePath}.backup.${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  log(`✅ Backup criado: ${backupPath}`, 'green');
}

// Baixar arquivo de URL
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    log(`📥 Baixando de: ${url}`, 'blue');
    
    const file = fs.createWriteStream(outputPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Seguir redirect
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Erro HTTP: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        log(`✅ Download concluído: ${outputPath}`, 'green');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(outputPath);
      reject(err);
    });
  });
}

// Processar CSV
function processCSV(filePath, columnIndex = 0) {
  log('📊 Processando CSV...', 'blue');
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const medications = new Set();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Detectar separador (vírgula ou ponto-e-vírgula)
    const separator = line.includes(';') ? ';' : ',';
    const columns = line.split(separator);
    
    if (columns.length <= columnIndex) continue;
    
    let medication = columns[columnIndex].trim();
    
    // Remover aspas
    medication = medication.replace(/^["']|["']$/g, '');
    
    // Filtrar cabeçalhos
    const lower = medication.toLowerCase();
    if (lower.includes('nome') || 
        lower.includes('medicamento') ||
        lower.includes('denominação') ||
        medication === 'Nome' ||
        medication.length < 2) {
      continue;
    }
    
    if (medication.length > 0) {
      medications.add(medication);
    }
  }
  
  return Array.from(medications);
}

// Processar TXT
function processTXT(filePath) {
  log('📝 Processando TXT...', 'blue');
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const medications = new Set();
  
  for (const line of lines) {
    const medication = line.trim();
    if (medication.length > 0 && medication.length < 200) {
      medications.add(medication);
    }
  }
  
  return Array.from(medications);
}

// Normalizar nomes de medicamentos
function normalizeMedicationName(name) {
  // Remover espaços extras
  let normalized = name.trim();
  
  // Remover caracteres especiais problemáticos
  normalized = normalized.replace(/[\r\n\t]/g, ' ');
  
  // Normalizar espaços múltiplos
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized;
}

// Limpar e filtrar medicamentos
function cleanMedications(medications) {
  const cleaned = [];
  const seen = new Set();
  
  for (const med of medications) {
    const normalized = normalizeMedicationName(med);
    
    if (normalized.length < 2 || normalized.length > 200) {
      continue;
    }
    
    // Ignorar linhas que parecem ser cabeçalhos ou metadados
    const lower = normalized.toLowerCase();
    if (lower.includes('total:') ||
        lower.includes('página') ||
        lower.includes('data:') ||
        lower.startsWith('http') ||
        lower.includes('@')) {
      continue;
    }
    
    // Usar lowercase para detectar duplicatas
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      cleaned.push(normalized);
    }
  }
  
  return cleaned;
}

// Processar e salvar
async function processAndSave(medications, outputPath) {
  log(`🧹 Limpando e normalizando ${medications.length} medicamentos...`, 'blue');
  
  const cleaned = cleanMedications(medications);
  
  log(`📊 Removendo duplicatas...`, 'blue');
  const unique = [...new Set(cleaned)];
  
  log(`🔤 Ordenando alfabeticamente...`, 'blue');
  unique.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  
  log(`💾 Salvando em: ${outputPath}`, 'blue');
  const json = JSON.stringify(unique, null, 2);
  fs.writeFileSync(outputPath, json, 'utf8');
  
  log(`\n✅ Importação concluída!`, 'green');
  log(`   Total de medicamentos: ${unique.length}`, 'green');
  log(`   Duplicatas removidas: ${medications.length - unique.length}`, 'yellow');
  log(`   Arquivo salvo: ${outputPath}`, 'green');
  
  return unique;
}

// Main
async function main() {
  const options = parseArgs();
  
  if (!options.fonte) {
    log('❌ Erro: --fonte é obrigatório', 'red');
    showHelp();
    process.exit(1);
  }
  
  let medications = [];
  let tempFile = null;
  
  try {
    // Criar backup se solicitado
    if (options.backup && fs.existsSync(options.saida)) {
      createBackup(options.saida);
    }
    
    // Processar conforme fonte
    switch (options.fonte.toLowerCase()) {
      case 'csv':
        if (!options.arquivo) {
          log('❌ Erro: --arquivo é obrigatório para fonte CSV', 'red');
          process.exit(1);
        }
        if (!fs.existsSync(options.arquivo)) {
          log(`❌ Erro: Arquivo não encontrado: ${options.arquivo}`, 'red');
          process.exit(1);
        }
        medications = processCSV(options.arquivo, options.coluna);
        break;
        
      case 'txt':
        if (!options.arquivo) {
          log('❌ Erro: --arquivo é obrigatório para fonte TXT', 'red');
          process.exit(1);
        }
        if (!fs.existsSync(options.arquivo)) {
          log(`❌ Erro: Arquivo não encontrado: ${options.arquivo}`, 'red');
          process.exit(1);
        }
        medications = processTXT(options.arquivo);
        break;
        
      case 'url':
        if (!options.url) {
          log('❌ Erro: --url é obrigatório para fonte URL', 'red');
          process.exit(1);
        }
        tempFile = path.join(__dirname, `temp_download_${Date.now()}.tmp`);
        await downloadFile(options.url, tempFile);
        
        // Tentar detectar formato
        if (options.url.endsWith('.csv') || options.url.includes('csv')) {
          medications = processCSV(tempFile, options.coluna);
        } else {
          medications = processTXT(tempFile);
        }
        break;
        
      default:
        log(`❌ Erro: Fonte desconhecida: ${options.fonte}`, 'red');
        log('   Fontes disponíveis: csv, txt, url', 'yellow');
        process.exit(1);
    }
    
    if (medications.length === 0) {
      log('⚠️  Nenhum medicamento encontrado!', 'yellow');
      log('   Verifique se o arquivo está no formato correto.', 'yellow');
      process.exit(1);
    }
    
    // Processar e salvar
    await processAndSave(medications, options.saida);
    
    // Limpar arquivo temporário
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  main();
}

module.exports = { processCSV, processTXT, cleanMedications };







