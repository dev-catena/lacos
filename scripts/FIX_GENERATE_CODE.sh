#!/bin/bash

# Script para corrigir erro de generateUniqueCode() no GroupController

echo "🔧 Corrigindo GroupController..."

cd /var/www/lacos-backend

# Backup
cp app/Http/Controllers/Api/GroupController.php app/Http/Controllers/Api/GroupController.php.backup.$(date +%s)
echo "✅ Backup criado"

# Ver linha 46 (onde está o erro)
echo "📋 Linha 46 atual:"
sed -n '46p' app/Http/Controllers/Api/GroupController.php

# Verificar se tem generateUniqueCode
if grep -q "generateUniqueCode" app/Http/Controllers/Api/GroupController.php; then
    echo "❌ Encontrou generateUniqueCode() - precisa corrigir"
    
    # Substituir generateUniqueCode() por geração inline
    sed -i "s/Group::generateUniqueCode()/strtoupper(substr(md5(uniqid(rand(), true)), 0, 8))/g" app/Http/Controllers/Api/GroupController.php
    
    echo "✅ Substituído por geração inline de código"
else
    echo "✅ Não encontrou generateUniqueCode() - já está correto"
fi

# Verificar sintaxe PHP
echo "🔍 Verificando sintaxe..."
php -l app/Http/Controllers/Api/GroupController.php

if [ $? -eq 0 ]; then
    echo "✅ Sintaxe correta!"
    
    # Limpar cache
    echo "🧹 Limpando cache..."
    php artisan cache:clear
    php artisan config:clear
    php artisan route:clear
    
    echo "✅ Cache limpo"
    
    # Reiniciar PHP-FPM
    echo "🔄 Reiniciando PHP-FPM..."
    systemctl restart php8.2-fpm
    
    echo "✅ PHP-FPM reiniciado"
    
    echo ""
    echo "🎉 CORREÇÃO CONCLUÍDA!"
    echo ""
    echo "Teste agora criar o grupo no app"
else
    echo "❌ ERRO DE SINTAXE!"
    echo "Restaurando backup..."
    cp app/Http/Controllers/Api/GroupController.php.backup.* app/Http/Controllers/Api/GroupController.php
    echo "❌ Backup restaurado - correção falhou"
fi

