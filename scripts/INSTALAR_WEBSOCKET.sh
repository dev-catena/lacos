#!/bin/bash

echo "🔌 Instalando WebSocket (Laravel Broadcasting)..."

# Instalar dependências
echo "📦 Instalando pusher/pusher-php-server..."
composer require pusher/pusher-php-server

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure as credenciais do Pusher no arquivo .env:"
echo "   BROADCAST_DRIVER=pusher"
echo "   PUSHER_APP_ID=your-app-id"
echo "   PUSHER_APP_KEY=your-app-key"
echo "   PUSHER_APP_SECRET=your-app-secret"
echo "   PUSHER_APP_CLUSTER=us2"
echo ""
echo "2. Obtenha as credenciais em: https://pusher.com"
echo ""
echo "3. Configure no frontend (React Native):"
echo "   Crie arquivo .env com:"
echo "   EXPO_PUBLIC_PUSHER_KEY=your-pusher-key"
echo "   EXPO_PUBLIC_PUSHER_CLUSTER=us2"
echo ""
echo "4. Teste a conexão abrindo o app do paciente e cuidador"
echo ""








