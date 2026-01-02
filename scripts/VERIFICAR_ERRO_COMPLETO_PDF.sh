#!/bin/bash

# Script para verificar o erro completo nos logs

set -e

echo "🔍 VERIFICANDO ERRO COMPLETO NOS LOGS"
echo "======================================"
echo ""

BACKEND_PATH="/var/www/lacos-backend"
LOG_FILE="${BACKEND_PATH}/storage/logs/laravel.log"

echo "📋 Últimas 50 linhas do log:"
echo ""
tail -50 "$LOG_FILE" | grep -A 5 -B 5 "PDF\|certificate\|Storage::put\|output" || echo "Nenhuma entrada relacionada encontrada"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 Erros recentes (últimas 100 linhas):"
echo ""
tail -100 "$LOG_FILE" | grep -i "error\|exception\|fatal" | tail -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 Entradas relacionadas a PDF (últimas 200 linhas):"
echo ""
tail -200 "$LOG_FILE" | grep -i "pdf\|certificate\|prescription" | tail -30

echo ""
echo "💡 Para ver o log em tempo real:"
echo "   tail -f ${LOG_FILE}"
echo ""










