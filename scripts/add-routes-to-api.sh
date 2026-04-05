#!/bin/bash

##############################################
# Script para Adicionar Rotas ao api.php
##############################################

SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"

echo "🛣️ Adicionando Rotas ao api.php"
echo "=================================="
echo ""

# Executar comando remoto para adicionar rotas
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" << 'ENDSSH'
# Backup do arquivo original
echo "📋 Criando backup do api.php..."
sudo cp /var/www/lacos-backend/routes/api.php /var/www/lacos-backend/routes/api.php.backup

# Adicionar imports no topo do arquivo (se não existirem)
echo "📝 Adicionando imports..."
sudo sed -i '/^use/a use App\\Http\\Controllers\\Api\\MediaController;\nuse App\\Http\\Controllers\\Api\\AlertController;' /var/www/lacos-backend/routes/api.php

# Adicionar rotas antes do último }); do arquivo
echo "🔧 Adicionando rotas..."
sudo sed -i '/^});/i \
    \
    // ==================== MÍDIAS ====================\
    \
    // Listar mídias de um grupo\
    Route::get('\''/groups/{groupId}/media'\'', [MediaController::class, '\''index'\'']);\
    \
    // Postar nova mídia\
    Route::post('\''/groups/{groupId}/media'\'', [MediaController::class, '\''store'\'']);\
    \
    // Deletar mídia\
    Route::delete('\''/media/{mediaId}'\'', [MediaController::class, '\''destroy'\'']);\
    \
    \
    // ==================== ALERTAS ====================\
    \
    // Listar alertas ativos\
    Route::get('\''/groups/{groupId}/alerts/active'\'', [AlertController::class, '\''getActiveAlerts'\'']);\
    \
    // Marcar medicamento como tomado\
    Route::post('\''/alerts/{alertId}/taken'\'', [AlertController::class, '\''markMedicationTaken'\'']);\
    \
    // Dispensar alerta\
    Route::post('\''/alerts/{alertId}/dismiss'\'', [AlertController::class, '\''dismissAlert'\'']);\
' /var/www/lacos-backend/routes/api.php

echo "✅ Rotas adicionadas com sucesso!"
echo ""
echo "📄 Arquivo backup salvo em:"
echo "   /var/www/lacos-backend/routes/api.php.backup"
echo ""
ENDSSH

echo ""
echo "✅ Concluído!"
echo ""
echo "Para verificar as rotas:"
echo "  ssh $USER@$SERVER"
echo "  cat /var/www/lacos-backend/routes/api.php"
echo ""

