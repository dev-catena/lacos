#!/bin/bash

echo "🔍 Testando API de Clientes..."
echo ""

cd /var/www/lacos-backend || exit 1

echo "📋 Verificando se o método getClients retorna photo_url..."
echo ""

# Verificar o código do método
echo "Código do método getClients (linhas com photo):"
grep -A 5 -B 5 "photo" app/Http/Controllers/Api/CaregiverController.php | grep -A 10 "getClients" | head -20

echo ""
echo "✅ Verificação concluída"
echo ""
echo "💡 Dica: Se os clientes não têm foto, o campo photo_url será null"
echo "   Verifique no banco de dados se os usuários têm o campo 'photo' preenchido:"
echo ""
echo "   mysql -u root -p -e \"SELECT id, name, photo FROM users WHERE name IN ('Biza Vo', 'Cuidador bom');\" lacos_db"

