#!/bin/bash

# Script para corrigir o problema de doctor_id na tabela documents

set -e

echo "🔧 CORRIGINDO PROBLEMA DE DOCTOR_ID EM DOCUMENTS"
echo "================================================="
echo ""

BACKEND_PATH="/var/www/lacos-backend"
CONTROLLER_FILE="${BACKEND_PATH}/app/Http/Controllers/Api/PrescriptionController.php"

cd "$BACKEND_PATH" || exit 1

echo "1️⃣ Verificando como doctor_id está sendo usado..."

# Verificar se está usando doctor_id da tabela doctors ou users
grep -A 30 "Document::create" "$CONTROLLER_FILE" | grep -A 5 "doctor_id"

echo ""
echo "2️⃣ Verificando estrutura da tabela documents..."
echo "   Execute no MySQL:"
echo "   DESCRIBE documents;"
echo "   SELECT id FROM doctors WHERE id = 28;"
echo "   SELECT id FROM users WHERE id = 28 AND profile = 'doctor';"
echo ""

echo "3️⃣ Verificando o código do PrescriptionController..."
# Procurar onde Document::create é chamado
if grep -q "Document::create" "$CONTROLLER_FILE"; then
    echo "   ✅ Document::create encontrado"
    echo ""
    echo "   Contexto ao redor:"
    grep -B 10 -A 20 "Document::create" "$CONTROLLER_FILE" | head -35
else
    echo "   ⚠️  Document::create não encontrado"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "💡 DIAGNÓSTICO"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "O problema é que doctor_id = 28 não existe na tabela 'doctors'."
echo ""
echo "Possíveis soluções:"
echo "1. Verificar se o ID 28 existe na tabela users (pode ser que o médico"
echo "   esteja na tabela users, não em doctors)"
echo "2. Alterar o código para usar NULL em doctor_id se não existir"
echo "3. Criar o registro na tabela doctors se necessário"
echo ""
echo "Execute para verificar:"
echo "   mysql -u root -p lacos -e \"SELECT id, name FROM users WHERE id = 28;\""
echo "   mysql -u root -p lacos -e \"SELECT id FROM doctors WHERE id = 28;\""
echo "   mysql -u root -p lacos -e \"DESCRIBE documents;\""
echo ""















