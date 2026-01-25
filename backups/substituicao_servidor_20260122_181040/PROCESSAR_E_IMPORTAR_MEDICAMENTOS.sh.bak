#!/bin/bash

# Script para processar CSV localmente e fazer importação otimizada no servidor
# Processa o CSV, remove duplicatas, normaliza dados e faz bulk insert

set -e

CSV_FILE="scripts/DADOS_ABERTOS_MEDICAMENTOS.csv"
PROCESSED_CSV="/tmp/medicamentos_processados.csv"
SQL_FILE="/tmp/medicamentos_import.sql"

echo "🚀 Processando CSV localmente para importação otimizada"
echo ""

# Verificar se o arquivo existe
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Arquivo não encontrado: $CSV_FILE"
    exit 1
fi

echo "📊 Processando CSV..."
echo "   Arquivo: $CSV_FILE"
echo ""

# Contar linhas totais
TOTAL_LINES=$(wc -l < "$CSV_FILE")
echo "   Total de linhas: $TOTAL_LINES"
echo ""

# Criar script Python para processar o CSV
cat > /tmp/processar_csv.py << 'PYTHON_SCRIPT'
import csv
import sys
import re
from collections import OrderedDict

def normalize_name(name):
    """Normalizar nome do medicamento"""
    if not name:
        return ''
    # Converter para lowercase
    normalized = name.lower()
    # Remover acentos básicos
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
    # Remover caracteres especiais
    normalized = re.sub(r'[^a-z0-9\s]', ' ', normalized)
    # Remover espaços múltiplos
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

# Ler CSV e processar
input_file = sys.argv[1]
output_file = sys.argv[2]

seen = set()
processed = []
duplicates = 0
errors = 0

print("📥 Lendo e processando CSV...")

with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.reader(f, delimiter=';')
    
    # Ler cabeçalho
    header = next(reader)
    
    # Mapear colunas
    col_map = {}
    for i, col in enumerate(header):
        col_upper = col.upper().strip()
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
    
    line_num = 0
    for row in reader:
        line_num += 1
        if line_num % 10000 == 0:
            print(f"   Processadas: {line_num:,} linhas...")
        
        try:
            if len(row) < len(header):
                continue
            
            nome_produto = row[col_map.get('nome_produto', 0)].strip() if col_map.get('nome_produto') is not None else ''
            if not nome_produto:
                continue
            
            numero_registro = row[col_map.get('numero_registro_produto', 4)].strip() if col_map.get('numero_registro_produto') is not None else ''
            situacao = row[col_map.get('situacao_registro', 9)].strip() if col_map.get('situacao_registro') is not None else ''
            
            # Criar chave única
            nome_normalizado = normalize_name(nome_produto)
            key = f"{nome_normalizado}|{numero_registro}"
            
            if key in seen:
                duplicates += 1
                continue
            
            seen.add(key)
            
            # Preparar dados
            data = {
                'tipo_produto': row[col_map.get('tipo_produto', 0)].strip() if col_map.get('tipo_produto') is not None else '',
                'nome_produto': nome_produto,
                'nome_normalizado': nome_normalizado,
                'principio_ativo': row[col_map.get('principio_ativo', 10)].strip() if col_map.get('principio_ativo') is not None else '',
                'categoria_regulatoria': row[col_map.get('categoria_regulatoria', 3)].strip() if col_map.get('categoria_regulatoria') is not None else '',
                'numero_registro_produto': numero_registro,
                'data_vencimento_registro': parse_date(row[col_map.get('data_vencimento_registro', 5)].strip() if col_map.get('data_vencimento_registro') is not None else ''),
                'numero_processo': row[col_map.get('numero_processo', 6)].strip() if col_map.get('numero_processo') is not None else '',
                'classe_terapeutica': row[col_map.get('classe_terapeutica', 7)].strip() if col_map.get('classe_terapeutica') is not None else '',
                'empresa_detentora_registro': row[col_map.get('empresa_detentora_registro', 8)].strip() if col_map.get('empresa_detentora_registro') is not None else '',
                'data_finalizacao_processo': parse_date(row[col_map.get('data_finalizacao_processo', 2)].strip() if col_map.get('data_finalizacao_processo') is not None else ''),
                'situacao_registro': situacao,
                'is_active': 1 if situacao == 'VÁLIDO' else 0,
            }
            
            processed.append(data)
            
        except Exception as e:
            errors += 1
            if errors <= 10:  # Mostrar apenas os primeiros 10 erros
                print(f"   Erro na linha {line_num}: {e}")

print(f"\n✅ Processamento concluído!")
print(f"   Linhas processadas: {line_num:,}")
print(f"   Registros únicos: {len(processed):,}")
print(f"   Duplicatas: {duplicates:,}")
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

# Executar processamento
python3 /tmp/processar_csv.py "$CSV_FILE" "$PROCESSED_CSV"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao processar CSV"
    exit 1
fi

echo ""
echo "✅ CSV processado com sucesso!"
echo "   Arquivo: $PROCESSED_CSV"
echo ""

# Copiar para servidor
echo "📤 Copiando CSV processado para o servidor..."
SERVER_HOST="193.203.182.22"
SERVER_PORT="63022"
SERVER_USER="darley"
SERVER_PASS="yhvh77"

sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "$PROCESSED_CSV" "$SERVER_USER@$SERVER_HOST:/tmp/medicamentos_processados.csv"

if [ $? -eq 0 ]; then
    echo "✅ CSV copiado para o servidor"
    echo ""
    echo "📝 Próximo passo: Execute no servidor:"
    echo "   cd /var/www/lacos-backend"
    echo "   php artisan medications:import-fast /tmp/medicamentos_processados.csv"
else
    echo "❌ Erro ao copiar CSV para o servidor"
    exit 1
fi







