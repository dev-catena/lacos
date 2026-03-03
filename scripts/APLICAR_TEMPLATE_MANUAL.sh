#!/bin/bash

# Script para aplicar o template do certificado manualmente no servidor
# Use este script quando a conexão SSH estiver disponível

SSH_USER="darley"
SSH_HOST="192.168.0.20"
BACKEND_DIR="/var/www/lacos-backend"
TEMPLATE_DIR="$BACKEND_DIR/resources/views/prescriptions"
TEMPLATE_FILE="$TEMPLATE_DIR/certificate.blade.php"

echo "📋 ============================================"
echo "📋 APLICAR TEMPLATE DO CERTIFICADO"
echo "📋 ============================================"
echo ""
echo "📁 Arquivo local: scripts/TEMPLATE_CERTIFICADO_FINAL.blade.php"
echo "📁 Destino no servidor: $TEMPLATE_FILE"
echo ""
echo "Para aplicar manualmente, execute no servidor:"
echo ""
echo "1. Conecte ao servidor:"
echo "   ssh ${SSH_USER}@${SSH_HOST}"
echo ""
echo "2. Crie o diretório se não existir:"
echo "   mkdir -p $TEMPLATE_DIR"
echo ""
echo "3. Faça backup do template atual:"
echo "   if [ -f $TEMPLATE_FILE ]; then"
echo "     cp $TEMPLATE_FILE ${TEMPLATE_FILE}.backup.\$(date +%Y%m%d_%H%M%S)"
echo "   fi"
echo ""
echo "4. Copie o template:"
echo "   # Opção 1: Via SCP (do seu computador local):"
echo "   scp scripts/TEMPLATE_CERTIFICADO_FINAL.blade.php ${SSH_USER}@${SSH_HOST}:$TEMPLATE_FILE"
echo ""
echo "   # Opção 2: Ou crie o arquivo diretamente no servidor"
echo ""
echo "5. Ajuste permissões:"
echo "   chown www-data:www-data $TEMPLATE_FILE"
echo "   chmod 644 $TEMPLATE_FILE"
echo ""
echo "6. Limpe o cache do Laravel:"
echo "   cd $BACKEND_DIR"
echo "   php artisan view:clear"
echo "   php artisan cache:clear"
echo ""
echo "✅ Template aplicado com sucesso!"
echo ""















