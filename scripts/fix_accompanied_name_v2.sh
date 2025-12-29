#!/bin/bash
#########################################
# Script para corrigir erro de created_by
# Erro: Field 'created_by' doesn't have a default value
#########################################

echo "🔧 INICIANDO CORREÇÃO DO ERRO created_by..."
echo ""

# 1. BACKUP DO BANCO
echo "📦 1/5 - Fazendo backup do banco..."
mysqldump -u root -p lacos > backup_fix_created_by_$(date +%Y%m%d_%H%M%S).sql
if [ $? -eq 0 ]; then
    echo "✅ Backup criado com sucesso!"
else
    echo "❌ Erro ao criar backup. Abortando..."
    exit 1
fi
echo ""

# 2. MODIFICAR TABELA groups
echo "🗄️  2/5 - Modificando tabela groups..."
mysql lacos << 'SQL_FIX'
-- Tornar created_by nullable
ALTER TABLE `groups` MODIFY COLUMN created_by BIGINT UNSIGNED NULL;

-- Verificar estrutura
DESCRIBE `groups`;
SQL_FIX

if [ $? -eq 0 ]; then
    echo "✅ Tabela groups modificada com sucesso!"
else
    echo "❌ Erro ao modificar tabela. Abortando..."
    exit 1
fi
echo ""

# 3. BACKUP DO CONTROLLER
echo "💾 3/5 - Fazendo backup do controller..."
cp /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php \
   /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php.backup_$(date +%Y%m%d_%H%M%S)
echo "✅ Backup do controller criado!"
echo ""

# 4. MODIFICAR CONTROLLER
echo "📝 4/5 - Modificando GroupController.php..."

# Encontrar a linha com Group::create e adicionar created_by
sed -i '/accompanied_photo/a\            '\''created_by'\'' => $request->user()->id,' \
    /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php

# Verificar sintaxe PHP
php -l /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Controller modificado com sucesso!"
else
    echo "❌ Erro de sintaxe PHP. Restaurando backup..."
    cp /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php.backup_* \
       /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php
    exit 1
fi
echo ""

# 5. LIMPAR CACHES E REINICIAR
echo "🔄 5/5 - Limpando caches e reiniciando serviços..."
cd /var/www/lacos-backend

# Limpar caches do Laravel
php artisan cache:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan route:clear > /dev/null 2>&1
php artisan view:clear > /dev/null 2>&1

# Limpar OpCache do PHP
php -r "opcache_reset();" 2>/dev/null

# Reiniciar PHP-FPM
systemctl restart php8.2-fpm

echo "✅ Caches limpos e serviços reiniciados!"
echo ""

# VERIFICAÇÃO FINAL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CORREÇÃO CONCLUÍDA COM SUCESSO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Estrutura da coluna created_by:"
mysql lacos -e "SHOW COLUMNS FROM \`groups\` LIKE 'created_by';"
echo ""
echo "🔍 Trecho do controller modificado:"
grep -A 2 -B 2 "'created_by'" /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php | head -10
echo ""
echo "🧪 TESTE AGORA:"
echo "   Tente criar um novo grupo no app!"
echo ""

