#!/bin/bash

echo "🔧 Corrigindo photo_url no método getClients para retornar URL completa..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Verificar se o método existe
if ! grep -q "public function getClients" "$CONTROLLER_FILE"; then
    echo "❌ Método getClients não encontrado!"
    exit 1
fi

# Encontrar a linha onde está 'photo_url' => $client->photo_url no map
PHOTO_LINE=$(grep -n "'photo_url' => \$client->photo_url" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)

if [ -z "$PHOTO_LINE" ]; then
    echo "⚠️ Não foi possível encontrar a linha com photo_url no map"
    echo "📝 Tentando encontrar outra forma..."
    
    # Tentar encontrar a linha dentro do map function
    PHOTO_LINE=$(grep -n "photo_url.*photo_url" "$CONTROLLER_FILE" | grep -A 5 "map(function" | head -1 | cut -d: -f1)
fi

if [ -n "$PHOTO_LINE" ]; then
    echo "📝 Linha encontrada: $PHOTO_LINE"
    echo ""
    
    # Substituir as linhas de photo_url e photo para construir a URL completa
    echo "📝 Corrigindo photo_url e photo no método getClients..."
    
    # Substituir 'photo_url' => $client->photo_url,
    sudo sed -i "s/'photo_url' => \$client->photo_url,/'photo_url' => \$client->photo_url ? asset('storage\/' . \$client->photo_url) : null,/" "$CONTROLLER_FILE"
    
    # Substituir 'photo' => $client->photo_url,
    sudo sed -i "s/'photo' => \$client->photo_url,/'photo' => \$client->photo_url ? asset('storage\/' . \$client->photo_url) : null,/" "$CONTROLLER_FILE"
    
    echo "✅ Correções aplicadas no método getClients"
else
    echo "⚠️ Não foi possível encontrar as linhas para corrigir automaticamente"
    echo "📝 Você pode precisar editar manualmente o arquivo:"
    echo "   $CONTROLLER_FILE"
    echo ""
    echo "   Procure por:"
    echo "   'photo_url' => \$client->photo_url,"
    echo "   'photo' => \$client->photo_url,"
    echo ""
    echo "   E substitua por:"
    echo "   'photo_url' => \$client->photo_url ? asset('storage/' . \$client->photo_url) : null,"
    echo "   'photo' => \$client->photo_url ? asset('storage/' . \$client->photo_url) : null,"
fi

echo ""
echo "✅ Script concluído!"
echo ""
echo "💡 Verifique se o método asset() está disponível no controller"
echo "   (deve estar no topo: use Illuminate\Support\Facades\Asset; ou usar asset() diretamente)"













