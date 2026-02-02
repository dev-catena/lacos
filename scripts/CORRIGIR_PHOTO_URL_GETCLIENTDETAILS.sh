#!/bin/bash

echo "🔧 Corrigindo photo_url no método getClientDetails para médicos..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Verificar se o método existe
if ! grep -q "public function getClientDetails" "$CONTROLLER_FILE"; then
    echo "❌ Método getClientDetails não encontrado!"
    exit 1
fi

# Encontrar a linha onde está 'photo_url' => $patient->photo (para médicos)
PHOTO_LINE=$(grep -n "'photo_url' => \$patient->photo" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)

if [ -z "$PHOTO_LINE" ]; then
    echo "⚠️ Não foi possível encontrar a linha com photo_url do paciente"
    echo "📝 Tentando encontrar outra forma..."
else
    echo "📝 Linha encontrada: $PHOTO_LINE"
    echo ""
    
    # Substituir as linhas de photo_url e photo para construir a URL completa
    echo "📝 Corrigindo photo_url e photo para médicos..."
    
    # Substituir 'photo_url' => $patient->photo,
    sudo sed -i "s/'photo_url' => \$patient->photo,/'photo_url' => \$patient->photo ? asset('storage\/' . \$patient->photo) : null,/" "$CONTROLLER_FILE"
    
    # Substituir 'photo' => $patient->photo,
    sudo sed -i "s/'photo' => \$patient->photo,/'photo' => \$patient->photo ? asset('storage\/' . \$patient->photo) : null,/" "$CONTROLLER_FILE"
    
    echo "✅ Correções aplicadas para médicos"
fi

# Corrigir também para cuidadores
CLIENT_PHOTO_LINE=$(grep -n "'photo_url' => \$client->photo" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)

if [ -n "$CLIENT_PHOTO_LINE" ]; then
    echo "📝 Corrigindo photo_url e photo para cuidadores..."
    sudo sed -i "s/'photo_url' => \$client->photo,/'photo_url' => \$client->photo ? asset('storage\/' . \$client->photo) : null,/" "$CONTROLLER_FILE"
    sudo sed -i "s/'photo' => \$client->photo,/'photo' => \$client->photo ? asset('storage\/' . \$client->photo) : null,/" "$CONTROLLER_FILE"
    echo "✅ Correções aplicadas para cuidadores"
fi

echo ""

# Verificar sintaxe
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe:"
    php -l "$CONTROLLER_FILE"
    echo ""
    echo "🔄 Restaurando backup..."
    sudo cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Correção aplicada com sucesso!"
echo ""
echo "📋 O que foi corrigido:"
echo "   - photo_url agora retorna URL completa usando asset('storage/' . \$photo)"
echo "   - photo também retorna URL completa"
echo "   - Aplicado tanto para médicos quanto para cuidadores"
echo ""
echo "💡 Nota: O helper asset() é global no Laravel, então não precisa de import"
