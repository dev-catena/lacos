#!/bin/bash

# Script para corrigir erro de sintaxe em routes/api.php
# O erro está na linha 84 onde há "/ Doctors & Medical" ao invés de "// Doctors & Medical"

echo "🔧 Corrigindo routes/api.php..."

cd /var/www/lacos-backend

# Fazer backup
cp routes/api.php routes/api.php.backup.$(date +%Y%m%d_%H%M%S)

# Corrigir o comentário na linha 84
# Substituir "/ Doctors & Medical" por "// Doctors & Medical"
sed -i 's|^[[:space:]]*/[[:space:]]*Doctors[[:space:]]*&[[:space:]]*Medical[[:space:]]*$|    // Doctors \& Medical|' routes/api.php

# Verificar sintaxe PHP
echo ""
echo "📋 Verificando sintaxe PHP..."
php -l routes/api.php

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Arquivo corrigido com sucesso!"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Limpar cache: php artisan config:clear && php artisan route:clear"
    echo "   2. Testar rotas: php artisan route:list | grep payment"
else
    echo ""
    echo "❌ Ainda há erros. Verifique manualmente o arquivo routes/api.php"
    echo "   Backup salvo em: routes/api.php.backup.*"
fi

