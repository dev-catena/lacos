#!/bin/bash

echo "🔧 Corrigindo método getClients no CaregiverController..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# 1. Fazer backup
echo "📦 Criando backup..."
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# 2. Verificar se tem use DB
echo "🔍 Verificando imports necessários..."
if ! grep -q "use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE"; then
    echo "❌ Use DB não encontrado - adicionando..."
    # Adicionar após outros use statements
    sudo sed -i "/^use Illuminate\\Support\\Facades\\Auth;/a use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE"
    echo "✅ Use DB adicionado"
else
    echo "✅ Use DB já existe"
fi
echo ""

# 3. Verificar se método existe
if grep -q "public function getClients" "$CONTROLLER_FILE"; then
    echo "✅ Método getClients encontrado"
    echo "📝 Verificando se está completo..."
    
    # Verificar se tem try/catch e DB::table
    if grep -q "DB::table.*group_members" "$CONTROLLER_FILE" && grep -A 5 "public function getClients" "$CONTROLLER_FILE" | grep -q "try"; then
        echo "✅ Método parece estar completo"
    else
        echo "⚠️  Método pode estar incompleto ou com erro"
        echo "📝 Verificando logs do Laravel para mais detalhes..."
        echo ""
        echo "Últimas linhas do log de erros:"
        tail -20 storage/logs/laravel.log 2>/dev/null || echo "Log não encontrado"
    fi
else
    echo "❌ Método getClients NÃO encontrado!"
    echo "📝 Você precisa adicionar o método manualmente ou usar o script completo"
fi
echo ""

# 4. Verificar sintaxe PHP
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe detectado:"
    php -l "$CONTROLLER_FILE"
    echo ""
    echo "🔄 Restaurando backup..."
    sudo cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi
echo ""

# 5. Limpar cache
echo "🧹 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

# 6. Verificar rotas
echo "📋 Verificando se a rota está registrada..."
if php artisan route:list | grep -q "caregivers/clients"; then
    echo "✅ Rota encontrada:"
    php artisan route:list | grep "caregivers/clients"
else
    echo "❌ Rota não encontrada - verifique routes/api.php"
fi
echo ""

echo "✅ Verificação concluída!"
echo ""
echo "💡 Se o erro persistir, verifique:"
echo "   1. Logs do Laravel: tail -f storage/logs/laravel.log"
echo "   2. Se o método getClients existe e está completo"
echo "   3. Se a tabela group_members existe no banco de dados"
echo ""


