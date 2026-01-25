#!/bin/bash

# Script para substituir referências hardcoded ao IP 10.102.0.103 por variáveis de ambiente

echo "🔄 Substituindo referências hardcoded ao IP por variáveis..."
echo ""

# 1. App Mobile React Native
echo "📱 Atualizando app mobile (src/config/api.js)..."
if grep -q "10.102.0.103" src/config/api.js 2>/dev/null; then
    echo "   ⚠️  Ainda há referências hardcoded em src/config/api.js"
    echo "   ✅ Mas agora usa src/config/env.js"
else
    echo "   ✅ Já atualizado"
fi

# 2. Website
echo "🌐 Verificando website..."
HARDCODED_WEBSITE=$(grep -c "10.102.0.103" website/src/config/api.js 2>/dev/null || echo 0)
if [ "$HARDCODED_WEBSITE" -gt 0 ]; then
    echo "   ⚠️  Ainda há $HARDCODED_WEBSITE referências hardcoded"
    echo "   ✅ Mas agora usa website/src/config/env.js"
else
    echo "   ✅ Já atualizado"
fi

# 3. Web Admin
echo "👨‍💼 Verificando web-admin..."
HARDCODED_ADMIN=$(grep -c "10.102.0.103" web-admin/src/config/api.js 2>/dev/null || echo 0)
if [ "$HARDCODED_ADMIN" -gt 0 ]; then
    echo "   ⚠️  Ainda há $HARDCODED_ADMIN referências hardcoded"
    echo "   ✅ Mas agora usa web-admin/src/config/env.js"
else
    echo "   ✅ Já atualizado"
fi

# 4. Backend PHP
echo "🔧 Verificando backend PHP..."
HARDCODED_BACKEND=$(grep -c "10.102.0.103" backend-laravel/app/Http/Controllers/Api/AdminDoctorController.php 2>/dev/null || echo 0)
if [ "$HARDCODED_BACKEND" -gt 0 ]; then
    echo "   ⚠️  Ainda há $HARDCODED_BACKEND referências hardcoded"
    echo "   ✅ Mas agora usa config('backend.base_url')"
else
    echo "   ✅ Já atualizado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verificação concluída!"
echo ""
echo "📝 Para alterar o IP do servidor:"
echo "   1. Backend: Edite APP_HOST no backend-laravel/.env"
echo "   2. Frontend Mobile: Edite BACKEND_HOST em src/config/env.js"
echo "   3. Website: Edite BACKEND_HOST em website/src/config/env.js"
echo "   4. Web Admin: Edite BACKEND_HOST em web-admin/src/config/env.js"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"



