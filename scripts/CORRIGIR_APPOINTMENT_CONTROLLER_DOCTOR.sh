#!/bin/bash

# Script para corrigir AppointmentController para carregar doctorUser corretamente

SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Corrigindo AppointmentController para carregar doctorUser..."
echo "================================================================"

# Verificar se o arquivo local existe
if [ ! -f "AppointmentController_CORRIGIDO.php" ]; then
    echo "❌ Arquivo AppointmentController_CORRIGIDO.php não encontrado!"
    exit 1
fi

# Copiar arquivo para o servidor
echo "📦 Copiando arquivo para o servidor..."
sshpass -p "$PASSWORD" scp AppointmentController_CORRIGIDO.php "$USER@$SERVER:/tmp/AppointmentController_CORRIGIDO.php"

echo "✅ Arquivo copiado"
echo ""

# Executar no servidor
sshpass -p "$PASSWORD" ssh "$USER@$SERVER" << ENDSSH
cd $BACKEND_PATH

echo "📦 Criando backup do AppointmentController..."
echo "$PASSWORD" | sudo -S cp app/Http/Controllers/Api/AppointmentController.php app/Http/Controllers/Api/AppointmentController.php.bak.\$(date +%Y%m%d_%H%M%S) 2>/dev/null
if [ \$? -eq 0 ]; then
    echo "✅ Backup criado"
else
    echo "⚠️  Erro ao criar backup (continuando mesmo assim...)"
fi

echo ""
echo "📝 Atualizando AppointmentController..."
echo "$PASSWORD" | sudo -S cp /tmp/AppointmentController_CORRIGIDO.php app/Http/Controllers/Api/AppointmentController.php 2>/dev/null
if [ \$? -eq 0 ]; then
    echo "✅ AppointmentController atualizado"
else
    echo "❌ Erro ao copiar AppointmentController!"
    exit 1
fi

echo ""
echo "🔍 Verificando sintaxe PHP..."
if echo "$PASSWORD" | sudo -S php -l app/Http/Controllers/Api/AppointmentController.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe no AppointmentController.php"
    echo "$PASSWORD" | sudo -S php -l app/Http/Controllers/Api/AppointmentController.php 2>&1
    exit 1
fi

echo ""
echo "🔍 Verificando se o método index usa doctorUser..."
if echo "$PASSWORD" | sudo -S grep -q "with(\['doctorUser'" app/Http/Controllers/Api/AppointmentController.php 2>/dev/null; then
    echo "✅ Método index usa doctorUser corretamente"
    echo "📋 Linha encontrada:"
    echo "$PASSWORD" | sudo -S grep -n "with(\['doctorUser'" app/Http/Controllers/Api/AppointmentController.php 2>/dev/null | head -1
else
    echo "❌ Método index NÃO usa doctorUser!"
    echo "📋 Verificando método index..."
    echo "$PASSWORD" | sudo -S grep -A 5 "public function index" app/Http/Controllers/Api/AppointmentController.php 2>/dev/null | head -10
    exit 1
fi

echo ""
echo "🧹 Limpando cache..."
echo "$PASSWORD" | sudo -S bash -c "cd $BACKEND_PATH && php artisan route:clear" 2>/dev/null
echo "$PASSWORD" | sudo -S bash -c "cd $BACKEND_PATH && php artisan config:clear" 2>/dev/null
echo "$PASSWORD" | sudo -S bash -c "cd $BACKEND_PATH && php artisan cache:clear" 2>/dev/null
echo "✅ Cache limpo"

echo ""
echo "✅ Correção concluída com sucesso!"
echo ""
echo "📋 Resumo:"
echo "  - AppointmentController.php atualizado para usar doctorUser"
echo "  - Cache limpo"
echo ""
echo "💡 Agora os appointments devem retornar o nome do médico corretamente."

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script executado com sucesso!"
else
    echo ""
    echo "❌ Erro ao executar script no servidor"
    exit 1
fi


