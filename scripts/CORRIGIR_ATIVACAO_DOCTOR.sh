#!/bin/bash

echo "🔧 Corrigindo método activate do AdminDoctorController para remover texto vazando..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/AdminDoctorController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Verificar se o arquivo existe
if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "❌ Arquivo AdminDoctorController.php não encontrado!"
    exit 1
fi

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Tentar copiar arquivo corrigido do /tmp (se foi enviado via scp)
TMP_FILE="/tmp/AdminDoctorController.php"
WORKSPACE_FILE="/home/darley/lacos/backend-laravel/AdminDoctorController.php"

if [ -f "$TMP_FILE" ]; then
    echo "📝 Copiando arquivo corrigido de /tmp..."
    sudo cp "$TMP_FILE" "$CONTROLLER_FILE"
    echo "✅ Arquivo copiado de /tmp com sucesso!"
elif [ -f "$WORKSPACE_FILE" ]; then
    echo "📝 Copiando arquivo corrigido do workspace..."
    sudo cp "$WORKSPACE_FILE" "$CONTROLLER_FILE"
    echo "✅ Arquivo copiado do workspace com sucesso!"
else
    echo "⚠️ Arquivo AdminDoctorController.php não encontrado em /tmp nem no workspace!"
    echo "📝 Você precisa copiar o arquivo corrigido para /tmp primeiro:"
    echo "   scp -P 63022 /caminho/local/AdminDoctorController.php root@10.102.0.103:/tmp/"
    echo ""
    echo "Ou edite o arquivo manualmente no servidor."
    exit 1
fi
echo ""

# Limpar cache do Laravel
echo "🧹 Limpando cache do Laravel..."
sudo php artisan config:clear
sudo php artisan cache:clear
sudo php artisan route:clear
sudo php artisan view:clear
echo "✅ Cache limpo!"
echo ""

echo "✅ Correção aplicada com sucesso!"
echo ""
echo "📋 Mudanças aplicadas:"
echo "   - Adicionada limpeza de output buffer no início do método activate()"
echo "   - Adicionada limpeza de output buffer antes de retornar a view HTML"
echo "   - Adicionadas flags JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES nos retornos JSON"
echo "   - View HTML agora retorna com header Content-Type correto"
echo ""
echo "🔄 Reinicie o servidor web se necessário:"
echo "   sudo systemctl restart nginx"
echo "   sudo systemctl restart php8.2-fpm"

