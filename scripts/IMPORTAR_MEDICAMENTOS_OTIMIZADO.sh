#!/bin/bash

# Script completo: processa CSV localmente e importa otimizado no servidor
# Reduz tempo de importação de 16h para alguns minutos

set -e

CSV_FILE="scripts/DADOS_ABERTOS_MEDICAMENTOS.csv"
PROCESSED_CSV="/tmp/medicamentos_processados.csv"

SERVER_HOST="193.203.182.22"
SERVER_PORT="63022"
SERVER_USER="darley"
SERVER_PASS="yhvh77"

echo "🚀 Importação Otimizada de Medicamentos"
echo "   Processando localmente e importando no servidor"
echo ""

# Verificar arquivo
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Arquivo não encontrado: $CSV_FILE"
    exit 1
fi

echo "📊 Processando CSV localmente..."
echo "   Isso remove duplicatas e normaliza dados ANTES de enviar ao servidor"
echo ""

# Criar script Python otimizado
python3 << 'PYTHON_SCRIPT'
import csv
import sys
import re
from collections import OrderedDict

def normalize_name(name):
    """Normalizar nome do medicamento"""
    if not name:
        return ''
    normalized = name.lower()
    accents = {
        'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
        'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
        'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
        'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
        'ç': 'c', 'ñ': 'n',
    }
    for acc, rep in accents.items():
        normalized = normalized.replace(acc, rep)
    normalized = re.sub(r'[^a-z0-9\s]', ' ', normalized)
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized.strip()

def parse_date(date_str):
    """Converter data DD/MM/YYYY para YYYY-MM-DD"""
    if not date_str or date_str.strip() == '':
        return None
    try:
        parts = date_str.strip().split('/')
        if len(parts) == 3:
            day, month, year = parts
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except:
        pass
    return None

input_file = 'scripts/DADOS_ABERTOS_MEDICAMENTOS.csv'
output_file = '/tmp/medicamentos_processados.csv'

seen = set()
processed = []
duplicates = 0
errors = 0
line_num = 0

print("📥 Lendo e processando CSV...")

with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.reader(f, delimiter=';')
    header = next(reader)
    
    # Mapear colunas
    col_map = {}
    for i, col in enumerate(header):
        col_upper = col.upper().strip().replace('"', '')
        if 'NOME_PRODUTO' in col_upper:
            col_map['nome_produto'] = i
        elif 'PRINCIPIO_ATIVO' in col_upper:
            col_map['principio_ativo'] = i
        elif 'TIPO_PRODUTO' in col_upper:
            col_map['tipo_produto'] = i
        elif 'CATEGORIA_REGULATORIA' in col_upper:
            col_map['categoria_regulatoria'] = i
        elif 'NUMERO_REGISTRO_PRODUTO' in col_upper:
            col_map['numero_registro_produto'] = i
        elif 'DATA_VENCIMENTO_REGISTRO' in col_upper:
            col_map['data_vencimento_registro'] = i
        elif 'SITUACAO_REGISTRO' in col_upper:
            col_map['situacao_registro'] = i
        elif 'CLASSE_TERAPEUTICA' in col_upper:
            col_map['classe_terapeutica'] = i
        elif 'EMPRESA_DETENTORA_REGISTRO' in col_upper:
            col_map['empresa_detentora_registro'] = i
        elif 'DATA_FINALIZACAO_PROCESSO' in col_upper:
            col_map['data_finalizacao_processo'] = i
        elif 'NUMERO_PROCESSO' in col_upper:
            col_map['numero_processo'] = i
    
    for row in reader:
        line_num += 1
        if line_num % 5000 == 0:
            print(f"   Processadas: {line_num:,} linhas | Únicos: {len(processed):,} | Duplicatas: {duplicates:,}")
        
        try:
            if len(row) < len(header):
                continue
            
            nome_produto = row[col_map.get('nome_produto', 1)].strip().replace('"', '') if col_map.get('nome_produto') is not None else ''
            if not nome_produto:
                continue
            
            numero_registro = row[col_map.get('numero_registro_produto', 4)].strip().replace('"', '') if col_map.get('numero_registro_produto') is not None else ''
            situacao = row[col_map.get('situacao_registro', 9)].strip().replace('"', '') if col_map.get('situacao_registro') is not None else ''
            
            nome_normalizado = normalize_name(nome_produto)
            key = f"{nome_normalizado}|{numero_registro}"
            
            if key in seen:
                duplicates += 1
                continue
            
            seen.add(key)
            
            data = {
                'tipo_produto': row[col_map.get('tipo_produto', 0)].strip().replace('"', '') if col_map.get('tipo_produto') is not None else '',
                'nome_produto': nome_produto,
                'nome_normalizado': nome_normalizado,
                'principio_ativo': row[col_map.get('principio_ativo', 10)].strip().replace('"', '') if col_map.get('principio_ativo') is not None else '',
                'categoria_regulatoria': row[col_map.get('categoria_regulatoria', 3)].strip().replace('"', '') if col_map.get('categoria_regulatoria') is not None else '',
                'numero_registro_produto': numero_registro,
                'data_vencimento_registro': parse_date(row[col_map.get('data_vencimento_registro', 5)].strip().replace('"', '') if col_map.get('data_vencimento_registro') is not None else ''),
                'numero_processo': row[col_map.get('numero_processo', 6)].strip().replace('"', '') if col_map.get('numero_processo') is not None else '',
                'classe_terapeutica': row[col_map.get('classe_terapeutica', 7)].strip().replace('"', '') if col_map.get('classe_terapeutica') is not None else '',
                'empresa_detentora_registro': row[col_map.get('empresa_detentora_registro', 8)].strip().replace('"', '') if col_map.get('empresa_detentora_registro') is not None else '',
                'data_finalizacao_processo': parse_date(row[col_map.get('data_finalizacao_processo', 2)].strip().replace('"', '') if col_map.get('data_finalizacao_processo') is not None else ''),
                'situacao_registro': situacao,
                'is_active': 1 if situacao == 'VÁLIDO' else 0,
            }
            
            processed.append(data)
            
        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"   ⚠️  Erro na linha {line_num}: {str(e)[:50]}")

print(f"\n✅ Processamento concluído!")
print(f"   Linhas processadas: {line_num:,}")
print(f"   Registros únicos: {len(processed):,}")
print(f"   Duplicatas removidas: {duplicates:,}")
print(f"   Erros: {errors:,}")

# Escrever CSV processado
print(f"\n📝 Escrevendo CSV processado...")
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=[
        'tipo_produto', 'nome_produto', 'nome_normalizado', 'principio_ativo',
        'categoria_regulatoria', 'numero_registro_produto', 'data_vencimento_registro',
        'numero_processo', 'classe_terapeutica', 'empresa_detentora_registro',
        'data_finalizacao_processo', 'situacao_registro', 'is_active'
    ], delimiter=';')
    writer.writeheader()
    writer.writerows(processed)

print(f"✅ CSV processado salvo em: {output_file}")
PYTHON_SCRIPT

if [ $? -ne 0 ]; then
    echo "❌ Erro ao processar CSV"
    exit 1
fi

echo ""
echo "📤 Copiando arquivos para o servidor..."
echo ""

# Copiar CSV processado
sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "$PROCESSED_CSV" "$SERVER_USER@$SERVER_HOST:/tmp/medicamentos_processados.csv"

# Copiar comando otimizado
sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "backend-laravel/app/Console/Commands/ImportMedicationsFast.php" "$SERVER_USER@$SERVER_HOST:/tmp/ImportMedicationsFast.php"

echo "✅ Arquivos copiados"
echo ""
echo "📝 Execute no servidor:"
echo "   sudo cp /tmp/ImportMedicationsFast.php /var/www/lacos-backend/app/Console/Commands/"
echo "   cd /var/www/lacos-backend"
echo "   composer dump-autoload"
echo "   php artisan medications:import-fast /tmp/medicamentos_processados.csv"
echo ""





