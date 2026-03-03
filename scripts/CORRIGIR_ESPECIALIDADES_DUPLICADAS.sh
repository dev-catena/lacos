#!/bin/bash

echo "🔧 Corrigindo especialidades médicas duplicadas..."
echo ""

SERVER_USER="darley"
SERVER_HOST="192.168.0.20"
SERVER_PASS="yhvh77"
SERVER_PATH="/var/www/lacos-backend"
CONTROLLER_FILE="app/Http/Controllers/Api/MedicalSpecialtyController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Criar backup
echo "📦 Criando backup..."
sshpass -p "$SERVER_PASS" ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && cp $CONTROLLER_FILE $BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Copiar arquivo corrigido para /tmp primeiro
echo "📝 Copiando controller corrigido..."
sshpass -p "$SERVER_PASS" scp MedicalSpecialtyController_CORRIGIDO.php "$SERVER_USER@$SERVER_HOST:/tmp/MedicalSpecialtyController_CORRIGIDO.php"

# Mover para o local correto
sshpass -p "$SERVER_PASS" ssh "$SERVER_USER@$SERVER_HOST" "sudo mv /tmp/MedicalSpecialtyController_CORRIGIDO.php $SERVER_PATH/$CONTROLLER_FILE && sudo chown www-data:www-data $SERVER_PATH/$CONTROLLER_FILE"
echo "✅ Controller atualizado"
echo ""

# Verificar sintaxe PHP
echo "🔍 Verificando sintaxe PHP..."
if sshpass -p "$SERVER_PASS" ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && php -l $CONTROLLER_FILE" | grep -q "No syntax errors"; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe detectado"
    sshpass -p "$SERVER_PASS" ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && php -l $CONTROLLER_FILE"
    echo "🔄 Restaurando backup..."
    sshpass -p "$SERVER_PASS" ssh "$SERVER_USER@$SERVER_HOST" "sudo cp $SERVER_PATH/$BACKUP_FILE $SERVER_PATH/$CONTROLLER_FILE && sudo chown www-data:www-data $SERVER_PATH/$CONTROLLER_FILE"
    exit 1
fi
echo ""

# Limpar cache
echo "🧹 Limpando cache..."
sshpass -p "$SERVER_PASS" ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && php artisan route:clear > /dev/null 2>&1 && php artisan config:clear > /dev/null 2>&1 && php artisan cache:clear > /dev/null 2>&1"
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído com sucesso!"
echo ""
echo "📋 Resumo:"
echo "   - Controller atualizado com DISTINCT para evitar duplicatas"
echo "   - Backup criado: $BACKUP_FILE"
echo "   - Cache limpo"
echo ""
echo "💡 A consulta agora usa:"
echo "   - SELECT DISTINCT id, name"
echo "   - ORDER BY name"
echo "   - Isso garante que não retorne especialidades duplicadas"
echo ""

