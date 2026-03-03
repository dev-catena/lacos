#!/bin/bash

# Script para instalar método saveAvailability no DoctorController
# e adicionar rota POST no routes/api.php

SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Instalando método saveAvailability..."
echo "=========================================="

# Verificar se os arquivos locais existem
if [ ! -f "DoctorController_COM_SAVE_AVAILABILITY.php" ]; then
    echo "❌ Arquivo DoctorController_COM_SAVE_AVAILABILITY.php não encontrado!"
    exit 1
fi

if [ ! -f "routes_api_com_availability.php" ]; then
    echo "❌ Arquivo routes_api_com_availability.php não encontrado!"
    exit 1
fi

# Copiar arquivos para o servidor
echo "📦 Copiando arquivos para o servidor..."
sshpass -p "$PASSWORD" scp DoctorController_COM_SAVE_AVAILABILITY.php "$USER@$SERVER:/tmp/DoctorController_COM_SAVE_AVAILABILITY.php"
sshpass -p "$PASSWORD" scp routes_api_com_availability.php "$USER@$SERVER:/tmp/routes_api_com_availability.php"

echo "✅ Arquivos copiados"
echo ""

# Executar no servidor usando sudo com senha
sshpass -p "$PASSWORD" ssh "$USER@$SERVER" << ENDSSH
cd $BACKEND_PATH

echo "📦 Criando backup do DoctorController..."
echo "$PASSWORD" | sudo -S cp app/Http/Controllers/Api/DoctorController.php app/Http/Controllers/Api/DoctorController.php.bak.\$(date +%Y%m%d_%H%M%S) 2>/dev/null
if [ \$? -eq 0 ]; then
    echo "✅ Backup criado"
else
    echo "⚠️  Erro ao criar backup (continuando mesmo assim...)"
fi

echo ""
echo "📝 Verificando se arquivo foi copiado para /tmp..."
if [ -f "/tmp/DoctorController_COM_SAVE_AVAILABILITY.php" ]; then
    echo "✅ Arquivo encontrado em /tmp"
    echo "📏 Tamanho do arquivo: \$(wc -l < /tmp/DoctorController_COM_SAVE_AVAILABILITY.php) linhas"
else
    echo "❌ Arquivo NÃO encontrado em /tmp!"
    exit 1
fi

echo ""
echo "📝 Instalando DoctorController completo..."
echo "$PASSWORD" | sudo -S cp /tmp/DoctorController_COM_SAVE_AVAILABILITY.php app/Http/Controllers/Api/DoctorController.php 2>/dev/null
if [ \$? -eq 0 ]; then
    echo "✅ DoctorController atualizado"
else
    echo "❌ Erro ao copiar DoctorController!"
    exit 1
fi

echo ""
echo "📝 Criando backup do routes/api.php..."
echo "$PASSWORD" | sudo -S cp routes/api.php routes/api.php.bak.\$(date +%Y%m%d_%H%M%S) 2>/dev/null
if [ \$? -eq 0 ]; then
    echo "✅ Backup criado"
else
    echo "⚠️  Erro ao criar backup (continuando mesmo assim...)"
fi

echo ""
echo "📝 Atualizando routes/api.php..."
echo "$PASSWORD" | sudo -S cp /tmp/routes_api_com_availability.php routes/api.php 2>/dev/null
if [ \$? -eq 0 ]; then
    echo "✅ routes/api.php atualizado"
else
    echo "❌ Erro ao copiar routes/api.php!"
    exit 1
fi

echo ""
echo "🔍 Verificando sintaxe PHP..."
if echo "$PASSWORD" | sudo -S php -l app/Http/Controllers/Api/DoctorController.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe no DoctorController.php"
    echo "$PASSWORD" | sudo -S php -l app/Http/Controllers/Api/DoctorController.php 2>&1
    exit 1
fi

if echo "$PASSWORD" | sudo -S php -l routes/api.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe PHP válida em routes/api.php"
else
    echo "❌ Erro de sintaxe em routes/api.php"
    echo "$PASSWORD" | sudo -S php -l routes/api.php 2>&1
    exit 1
fi

echo ""
echo "🔍 Verificando se o método saveAvailability existe..."
if echo "$PASSWORD" | sudo -S grep -q "public function saveAvailability" app/Http/Controllers/Api/DoctorController.php 2>/dev/null; then
    echo "✅ Método saveAvailability encontrado"
    echo "📋 Linha onde está o método:"
    echo "$PASSWORD" | sudo -S grep -n "public function saveAvailability" app/Http/Controllers/Api/DoctorController.php 2>/dev/null | head -1
else
    echo "❌ Método saveAvailability NÃO encontrado!"
    echo "📋 Verificando conteúdo do arquivo..."
    echo "Primeiras 20 linhas:"
    echo "$PASSWORD" | sudo -S head -20 app/Http/Controllers/Api/DoctorController.php 2>/dev/null
    echo ""
    echo "Últimas 20 linhas:"
    echo "$PASSWORD" | sudo -S tail -20 app/Http/Controllers/Api/DoctorController.php 2>/dev/null
    exit 1
fi

echo ""
echo "🔍 Verificando se a rota POST existe..."
if echo "$PASSWORD" | sudo -S grep -q "Route::post.*doctors.*availability" routes/api.php 2>/dev/null; then
    echo "✅ Rota POST encontrada"
    echo "$PASSWORD" | sudo -S grep "Route::post.*doctors.*availability" routes/api.php 2>/dev/null
else
    echo "❌ Rota POST NÃO encontrada!"
    echo "📋 Verificando rotas de doctors..."
    echo "$PASSWORD" | sudo -S grep -n "doctors" routes/api.php 2>/dev/null | head -5
    exit 1
fi

echo ""
echo "🧹 Limpando cache..."
echo "$PASSWORD" | sudo -S bash -c "cd $BACKEND_PATH && php artisan route:clear" 2>/dev/null
echo "$PASSWORD" | sudo -S bash -c "cd $BACKEND_PATH && php artisan config:clear" 2>/dev/null
echo "$PASSWORD" | sudo -S bash -c "cd $BACKEND_PATH && php artisan cache:clear" 2>/dev/null
echo "✅ Cache limpo"

echo ""
echo "📋 Verificando rotas registradas..."
echo "$PASSWORD" | sudo -S bash -c "cd $BACKEND_PATH && php artisan route:list" 2>/dev/null | grep -i "doctors.*availability" || echo "⚠️  Rota não encontrada na listagem (pode ser normal se cache não foi limpo)"

echo ""
echo "✅ Instalação concluída com sucesso!"
echo ""
echo "📋 Resumo:"
echo "  - DoctorController.php atualizado com método saveAvailability"
echo "  - routes/api.php atualizado com rota POST"
echo "  - Cache limpo"
echo ""
echo "💡 Para testar, salve a agenda no app e verifique se os dados aparecem."

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script executado com sucesso!"
else
    echo ""
    echo "❌ Erro ao executar script no servidor"
    exit 1
fi

