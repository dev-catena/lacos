#!/bin/bash

# Script para copiar arquivos para o servidor
# Execute na sua máquina local

echo "📦 Copiando arquivos para o servidor..."

# Configurações
SERVER="darley@192.168.0.20"
REMOTE_HOME="~"

echo "1. Copiando migrations..."
scp create_plans_table.php ${SERVER}:${REMOTE_HOME}/
scp create_user_plans_table.php ${SERVER}:${REMOTE_HOME}/

echo "2. Copiando Model..."
scp Plan.php ${SERVER}:${REMOTE_HOME}/

echo "3. Copiando Controller..."
scp PlanController.php ${SERVER}:${REMOTE_HOME}/

echo ""
echo "✅ Arquivos copiados para ~/ no servidor"
echo ""
echo "📋 Próximos passos no servidor:"
echo "   ssh darley@192.168.0.20"
echo "   sudo mv ~/create_plans_table.php /var/www/lacos-backend/"
echo "   sudo mv ~/create_user_plans_table.php /var/www/lacos-backend/"
echo "   sudo mv ~/Plan.php /var/www/lacos-backend/app/Models/"
echo "   sudo mv ~/PlanController.php /var/www/lacos-backend/app/Http/Controllers/Api/"
echo "   cd /var/www/lacos-backend"
echo "   sudo php artisan migrate --path=create_plans_table.php"
echo "   sudo php artisan migrate --path=create_user_plans_table.php"

