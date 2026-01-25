#!/bin/bash

# Script para buscar arquivo no backup
# Uso: ./BUSCAR_ARQUIVO_BACKUP.sh <nome_arquivo>

set -e

# Verificar múltiplos locais de backup
BACKUP_DIRS=(
    "/home/darley/lacos/backup"
    "/home/darley/lacos/backups"
    "/home/darley/lacos_backups"
)
FILE_NAME=$1

if [ -z "$FILE_NAME" ]; then
    echo "Uso: $0 <nome_arquivo>"
    echo ""
    echo "Exemplos:"
    echo "  $0 AuthController"
    echo "  $0 User.php"
    echo "  $0 WhatsAppService"
    exit 1
fi

# Remover extensão se houver
FILE_NAME_NO_EXT="${FILE_NAME%.php}"

echo "=========================================="
echo "🔍 BUSCANDO ARQUIVO NO BACKUP"
echo "=========================================="
echo ""
echo "Procurando: $FILE_NAME"
echo ""

# Encontrar diretório de backup válido
BACKUP_DIR=""
for dir in "${BACKUP_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        BACKUP_DIR="$dir"
        break
    fi
done

if [ -z "$BACKUP_DIR" ]; then
    echo "❌ Nenhum diretório de backup encontrado!"
    echo ""
    echo "Locais verificados:"
    for dir in "${BACKUP_DIRS[@]}"; do
        echo "   - $dir"
    done
    exit 1
fi

echo "✅ Usando backup: $BACKUP_DIR"
echo ""

# Buscar arquivo
echo "🔍 Buscando no backup..."
FOUND_FILES=$(find "$BACKUP_DIR" -type f -iname "*${FILE_NAME_NO_EXT}*" 2>/dev/null)

# Se não encontrar, verificar dentro de arquivos tar.gz
if [ -z "$FOUND_FILES" ]; then
    echo "🔍 Verificando dentro de arquivos .tar.gz..."
    for tar_file in "$BACKUP_DIR"/*.tar.gz; do
        if [ -f "$tar_file" ]; then
            echo "   Verificando: $(basename "$tar_file")"
            TAR_RESULT=$(tar -tzf "$tar_file" 2>/dev/null | grep -i "${FILE_NAME_NO_EXT}" | head -5)
            if [ -n "$TAR_RESULT" ]; then
                echo "   ✅ Encontrado dentro do arquivo!"
                echo "$TAR_RESULT" | sed 's/^/      /'
                FOUND_FILES="$tar_file"
            fi
        fi
    done
fi

if [ -z "$FOUND_FILES" ]; then
    echo "❌ Arquivo não encontrado no backup"
    echo ""
    echo "💡 Tentando buscar variações..."
    
    # Buscar por partes do nome
    find "$BACKUP_DIR" -type f -iname "*${FILE_NAME_NO_EXT:0:5}*" 2>/dev/null | head -10
else
    echo "✅ Arquivos encontrados:"
    echo ""
    
    COUNT=0
    while IFS= read -r file; do
        COUNT=$((COUNT + 1))
        echo "[$COUNT] $file"
        ls -lh "$file" | awk '{print "    Tamanho: " $5 " | Modificado: " $6 " " $7}'
        
        # Mostrar tipo de arquivo
        if [[ "$file" == *"Controller"* ]]; then
            echo "    Tipo: Controller"
        elif [[ "$file" == *"Model"* ]] || [[ "$file" == *"/Models/"* ]]; then
            echo "    Tipo: Model"
        elif [[ "$file" == *"migration"* ]] || [[ "$file" == *"/migrations/"* ]]; then
            echo "    Tipo: Migration"
        elif [[ "$file" == *"Service"* ]] || [[ "$file" == *"/Services/"* ]]; then
            echo "    Tipo: Service"
        fi
        echo ""
    done <<< "$FOUND_FILES"
    
    echo "📋 Total encontrado: $COUNT arquivo(s)"
    echo ""
    echo "💡 Para copiar um arquivo:"
    echo "   cp [caminho_completo] [destino]"
    echo ""
    echo "💡 Ou use o script:"
    echo "   ./VERIFICAR_BACKUP_ANTES_CRIAR.sh <tipo> <nome>"
fi

echo ""
echo "=========================================="

