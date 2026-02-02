#!/bin/bash

# Script para restaurar expo-dev-client no app.json

cd /home/darley/lacos || exit 1

echo "🔧 Restaurando expo-dev-client no app.json"
echo "==========================================="
echo ""

# Listar backups
echo "📦 Backups disponíveis:"
ls -lt app.json.backup.* 2>/dev/null | head -5 | awk '{print $9}' | nl

if [ $? -ne 0 ] || [ -z "$(ls app.json.backup.* 2>/dev/null)" ]; then
    echo "❌ Nenhum backup encontrado!"
    exit 1
fi

echo ""
read -p "Escolha o número do backup para restaurar [1]: " NUMERO
NUMERO=${NUMERO:-1}

BACKUP=$(ls -t app.json.backup.* 2>/dev/null | sed -n "${NUMERO}p")

if [ -z "$BACKUP" ] || [ ! -f "$BACKUP" ]; then
    echo "❌ Backup não encontrado!"
    exit 1
fi

echo ""
echo "📝 Restaurando de: $BACKUP"
cp "$BACKUP" app.json
echo "✅ app.json restaurado"
echo ""
echo "⚠️  Lembre-se de executar: npx expo prebuild (se necessário)"

