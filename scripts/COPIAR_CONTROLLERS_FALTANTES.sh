#!/bin/bash

# Script para copiar controllers faltantes da raiz do backend-laravel

set -e

PROJECT_DIR="/home/darley/lacos/backend-laravel"
CONTROLLERS_DIR="$PROJECT_DIR/app/Http/Controllers/Api"

echo "=========================================="
echo "📁 COPIANDO CONTROLLERS DA RAIZ"
echo "=========================================="
echo ""

# Lista de controllers que podem estar na raiz
CONTROLLERS=(
    "DoctorController"
    "CaregiverController"
    "EmergencyContactController"
    "MessageController"
)

COPIED=0

for controller in "${CONTROLLERS[@]}"; do
    # Verificar se está na raiz
    if [ -f "$PROJECT_DIR/${controller}.php" ]; then
        echo "✅ Encontrado na raiz: ${controller}.php"
        cp "$PROJECT_DIR/${controller}.php" "$CONTROLLERS_DIR/${controller}.php"
        echo "   ✅ Copiado para: $CONTROLLERS_DIR"
        COPIED=$((COPIED + 1))
    else
        echo "   ❌ Não encontrado: ${controller}.php"
    fi
done

echo ""
echo "=========================================="
echo "📊 Resumo: $COPIED controller(s) copiado(s)"
echo "=========================================="
echo ""












