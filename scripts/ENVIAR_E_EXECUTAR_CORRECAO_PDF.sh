#!/bin/bash

# Script para enviar e executar correção do PDFService.php no servidor

SERVIDOR="darley@lacos"
SENHA="yhvh77"
SCRIPT_LOCAL="VERIFICAR_E_CORRIGIR_PDF.sh"
SCRIPT_REMOTO="/tmp/VERIFICAR_E_CORRIGIR_PDF.sh"

echo "📤 Enviando script para o servidor..."
sshpass -p "$SENHA" scp "$SCRIPT_LOCAL" "$SERVIDOR:$SCRIPT_REMOTO"

if [ $? -eq 0 ]; then
    echo "✅ Script enviado!"
    echo ""
    echo "🚀 Executando no servidor..."
    sshpass -p "$SENHA" ssh "$SERVIDOR" "chmod +x $SCRIPT_REMOTO && bash $SCRIPT_REMOTO"
else
    echo "❌ Erro ao enviar script"
    exit 1
fi





