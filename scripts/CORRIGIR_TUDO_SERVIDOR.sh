#!/bin/bash

# Script para corrigir permissões E verificar .env
# Não altera .env se já estiver correto, apenas mostra o que precisa ser corrigido

echo "🔧 Corrigindo permissões e verificando configuração..."

cd /var/www/lacos-backend || exit 1

echo "📁 Diretório: $(pwd)"
echo ""

# 1. Corrigir permissões do storage
echo "🔧 1. Corrigindo permissões do storage..."
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap/cache

# Criar/ajustar arquivo de log
if [ ! -f "storage/logs/laravel.log" ]; then
    sudo touch storage/logs/laravel.log
fi
sudo chmod 664 storage/logs/laravel.log
sudo chown www-data:www-data storage/logs/laravel.log

echo "✅ Permissões corrigidas"
echo ""

# 2. Verificar configuração do .env
echo "🔍 2. Verificando configuração do .env..."

if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

# Verificar configurações atuais
DB_CONNECTION=$(grep "^DB_CONNECTION=" .env | cut -d '=' -f2 | xargs)
DB_DATABASE=$(grep "^DB_DATABASE=" .env | cut -d '=' -f2 | xargs)
DB_USERNAME=$(grep "^DB_USERNAME=" .env | cut -d '=' -f2 | xargs)
DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2 | xargs)

echo "   Configuração atual:"
echo "   DB_CONNECTION=$DB_CONNECTION"
echo "   DB_DATABASE=$DB_DATABASE"
echo "   DB_USERNAME=$DB_USERNAME"
echo "   DB_PASSWORD=${DB_PASSWORD:0:3}*** (oculto)"
echo ""

# Verificar se precisa corrigir
NEEDS_FIX=false

if [ "$DB_CONNECTION" != "mysql" ]; then
    echo "⚠️  DB_CONNECTION deve ser 'mysql' (atual: $DB_CONNECTION)"
    NEEDS_FIX=true
fi

if [ "$DB_DATABASE" != "lacos" ]; then
    echo "⚠️  DB_DATABASE deve ser 'lacos' (atual: $DB_DATABASE)"
    NEEDS_FIX=true
fi

if [ "$DB_USERNAME" != "lacos" ]; then
    echo "⚠️  DB_USERNAME deve ser 'lacos' (atual: $DB_USERNAME)"
    NEEDS_FIX=true
fi

if [ "$DB_PASSWORD" != "Lacos2025Secure" ]; then
    echo "⚠️  DB_PASSWORD deve ser 'Lacos2025Secure' (atual: diferente)"
    NEEDS_FIX=true
fi

if [ "$NEEDS_FIX" = true ]; then
    echo ""
    echo "❌ Configuração do .env precisa ser corrigida!"
    echo ""
    echo "📝 Execute os seguintes comandos para corrigir:"
    echo ""
    echo "   sed -i 's/^DB_CONNECTION=.*/DB_CONNECTION=mysql/' .env"
    echo "   sed -i 's/^DB_DATABASE=.*/DB_DATABASE=lacos/' .env"
    echo "   sed -i 's/^DB_USERNAME=.*/DB_USERNAME=lacos/' .env"
    echo "   sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=Lacos2025Secure/' .env"
    echo ""
    echo "   OU edite manualmente o arquivo .env"
    echo ""
    read -p "   Deseja corrigir automaticamente agora? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        sed -i 's/^DB_CONNECTION=.*/DB_CONNECTION=mysql/' .env
        sed -i 's/^DB_DATABASE=.*/DB_DATABASE=lacos/' .env
        sed -i 's/^DB_USERNAME=.*/DB_USERNAME=lacos/' .env
        sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=Lacos2025Secure/' .env
        echo "✅ .env corrigido!"
    else
        echo "⚠️  Corrija o .env manualmente antes de continuar"
        exit 1
    fi
else
    echo "✅ Configuração do .env está correta!"
fi

echo ""
echo "🚀 3. Executando migrations..."
echo ""

# Executar migrations
php artisan migrate --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations executadas com sucesso!"
    echo ""
    echo "📊 Verificando tabelas criadas..."
    mysql -u lacos -p'Lacos2025Secure' lacos -e "SHOW TABLES;" 2>/dev/null | grep -E "(supplier_products|orders|order_items|conversations)" || echo "   (Algumas tabelas podem não ter sido criadas ainda)"
else
    echo ""
    echo "❌ Erro ao executar migrations!"
    exit 1
fi

echo ""
echo "✨ Processo concluído!"




