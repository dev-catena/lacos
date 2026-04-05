#!/bin/bash

# Script para adicionar is_creator ao método index do GroupController

set -e

cd /var/www/lacos-backend

echo "🔧 Adicionando is_creator ao método index do GroupController..."
echo ""

FILE="app/Http/Controllers/Api/GroupController.php"

# Fazer backup
sudo cp "$FILE" "$FILE.backup.$(date +%s)" 2>/dev/null || cp "$FILE" "/tmp/GroupController.backup.$(date +%s)"
echo "✅ Backup criado"

# Ler o arquivo
CONTENT=$(cat "$FILE")

# Procurar e substituir a linha que adiciona is_admin
# Padrão: $group->is_admin = $member && $member->role === 'admin';
# Adicionar: $group->is_creator = $group->created_by === $user->id;

if echo "$CONTENT" | grep -q "\$group->is_admin = \$member && \$member->role === 'admin';"; then
    # Substituir usando sed com sudo se necessário
    sudo sed -i "/\$group->is_admin = \$member && \$member->role === 'admin';/a\\            \$group->is_creator = \$group->created_by === \$user->id;" "$FILE" 2>/dev/null || sed -i "/\$group->is_admin = \$member && \$member->role === 'admin';/a\\            \$group->is_creator = \$group->created_by === \$user->id;" "$FILE"
    echo "✅ is_creator adicionado"
else
    echo "⚠️  Padrão exato não encontrado. Tentando padrão alternativo..."
    
    # Tentar padrão mais flexível
    if echo "$CONTENT" | grep -q "is_admin.*member.*role"; then
        # Encontrar a linha e adicionar após ela
        LINE_NUM=$(grep -n "is_admin.*member.*role" "$FILE" | head -1 | cut -d: -f1)
        if [ -n "$LINE_NUM" ]; then
            sudo sed -i "${LINE_NUM}a\\            \$group->is_creator = \$group->created_by === \$user->id;" "$FILE" 2>/dev/null || sed -i "${LINE_NUM}a\\            \$group->is_creator = \$group->created_by === \$user->id;" "$FILE"
            echo "✅ is_creator adicionado na linha $((LINE_NUM + 1))"
        else
            echo "❌ Não foi possível encontrar a linha"
            exit 1
        fi
    else
        echo "❌ Padrão não encontrado. Verificando conteúdo..."
        grep -A 3 -B 3 "is_admin" "$FILE" | head -10
        exit 1
    fi
fi

# Verificar sintaxe
echo ""
echo "🔍 Verificando sintaxe..."
if php -l "$FILE" 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe OK"
else
    echo "❌ Erro de sintaxe!"
    php -l "$FILE"
    exit 1
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
echo "✅ Cache limpo"

echo ""
echo "✅ Concluído!"

