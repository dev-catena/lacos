#!/bin/bash
#########################################
# Correção PRECISA do campo created_by
# Remove da validação e adiciona no create
#########################################

echo "🔧 CORREÇÃO PRECISA DO created_by"
echo ""

cd /var/www/lacos-backend

# 1. BACKUP
echo "📦 1/3 - Backup..."
cp app/Http/Controllers/Api/GroupController.php \
   app/Http/Controllers/Api/GroupController.php.backup_final_$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado!"
echo ""

# 2. REMOVER LINHA INCORRETA (linha 40 - validação)
echo "📝 2/3 - Removendo created_by da validação (linha 40)..."
sed -i "/^            'accompanied_photo' => 'nullable|string',$/a\\            'health_info' => 'nullable|array'," \
    app/Http/Controllers/Api/GroupController.php
sed -i "/^            'created_by' => \$request->user()->id,$/d" \
    app/Http/Controllers/Api/GroupController.php

# 3. ADICIONAR NO LUGAR CERTO (após accompanied_photo no create)
echo "📝 3/3 - Adicionando created_by no Group::create()..."
sed -i "/            'accompanied_photo' => \$request->accompanied_photo,$/a\\            'created_by' => \$request->user()->id," \
    app/Http/Controllers/Api/GroupController.php

# Verificar sintaxe
php -l app/Http/Controllers/Api/GroupController.php > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe PHP correta!"
else
    echo "❌ Erro de sintaxe! Restaurando backup..."
    cp app/Http/Controllers/Api/GroupController.php.backup_final_* app/Http/Controllers/Api/GroupController.php
    exit 1
fi
echo ""

# Limpar caches
echo "🔄 Limpando caches..."
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
php artisan route:clear > /dev/null 2>&1
systemctl restart php8.2-fpm
echo "✅ Caches limpos!"
echo ""

# VERIFICAÇÃO
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Verificação - Validação (NÃO deve ter created_by):"
sed -n '32,42p' app/Http/Controllers/Api/GroupController.php
echo ""
echo "📋 Verificação - Create (DEVE ter created_by):"
sed -n '44,56p' app/Http/Controllers/Api/GroupController.php
echo ""
echo "🧪 TESTE AGORA NO APP!"
echo ""

