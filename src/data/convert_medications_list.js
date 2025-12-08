#!/usr/bin/env node

/**
 * Script para converter lista de medicamentos para JSON
 * 
 * Uso:
 *   node convert_medications_list.js <arquivo_entrada> [arquivo_saida]
 * 
 * Exemplos:
 *   node convert_medications_list.js lista.txt
 *   node convert_medications_list.js lista.txt medications.json
 *   node convert_medications_list.js lista.csv medications.json
 */

const fs = require('fs');
const path = require('path');

// Obter argumentos da linha de comando
const inputFile = process.argv[2];
const outputFile = process.argv[3] || path.join(__dirname, 'medications.json');

if (!inputFile) {
  console.error('❌ Erro: Arquivo de entrada não especificado');
  console.log('\nUso:');
  console.log('  node convert_medications_list.js <arquivo_entrada> [arquivo_saida]');
  console.log('\nExemplos:');
  console.log('  node convert_medications_list.js lista.txt');
  console.log('  node convert_medications_list.js lista.txt medications.json');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Erro: Arquivo não encontrado: ${inputFile}`);
  process.exit(1);
}

console.log('📋 Convertendo lista de medicamentos...');
console.log(`   Entrada: ${inputFile}`);
console.log(`   Saída: ${outputFile}\n`);

try {
  // Ler arquivo de entrada
  const content = fs.readFileSync(inputFile, 'utf8');
  
  let medications = [];
  
  // Detectar formato e processar
  if (inputFile.endsWith('.csv')) {
    // CSV: assumir que o nome está na primeira coluna
    console.log('📊 Processando como CSV...');
    const lines = content.split('\n');
    medications = lines
      .map(line => {
        // Remover aspas e pegar primeira coluna
        const firstCol = line.split(',')[0].trim();
        return firstCol.replace(/^["']|["']$/g, '');
      })
      .filter(name => {
        // Filtrar cabeçalhos e linhas vazias
        const lower = name.toLowerCase();
        return name.length > 0 
          && !lower.includes('nome')
          && !lower.includes('medicamento')
          && !lower.includes('medicament')
          && name !== 'Nome';
      });
  } else {
    // Texto: um medicamento por linha
    console.log('📝 Processando como texto (um por linha)...');
    medications = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }
  
  // Remover duplicatas (case-insensitive)
  const seen = new Set();
  const unique = [];
  for (const med of medications) {
    const lower = med.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(med);
    }
  }
  
  // Ordenar alfabeticamente
  unique.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  
  // Criar JSON
  const json = JSON.stringify(unique, null, 2);
  
  // Salvar arquivo
  fs.writeFileSync(outputFile, json, 'utf8');
  
  console.log('✅ Conversão concluída!');
  console.log(`   Total de medicamentos: ${unique.length}`);
  console.log(`   Duplicatas removidas: ${medications.length - unique.length}`);
  console.log(`   Arquivo salvo: ${outputFile}`);
  
} catch (error) {
  console.error('❌ Erro ao converter:', error.message);
  process.exit(1);
}






