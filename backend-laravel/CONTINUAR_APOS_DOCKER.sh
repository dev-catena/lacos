#!/bin/bash

# Script para continuar instalação após Docker já estar instalado
# Use este script se Docker já foi instalado mas Evolution API não

set -e

echo "💬 Continuando instalação da Evolution API..."
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "   Execute primeiro: sudo bash INSTALAR_DOCKER_E_EVOLUTION_API.sh"
    exit 1
fi

echo "✅ Docker encontrado"
docker --version
echo ""

# Verificar se Docker está rodando
if ! docker ps &>/dev/null; then
    echo "⚠️  Docker não está rodando. Tentando iniciar..."
    systemctl start docker 2>/dev/null || service docker start 2>/dev/null || {
        echo "❌ Não foi possível iniciar Docker"
        echo "   Tente: sudo systemctl start docker"
        exit 1
    }
    sleep 2
    echo "✅ Docker iniciado"
fi

# Variáveis de configuração
CONTAINER_NAME="evolution-api-lacos"
API_PORT="8080"
API_KEY=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1)
INSTANCE_NAME="lacos-2fa"
EVOLUTION_IMAGE="${EVOLUTION_IMAGE:-atendai/evolution-api:latest}"

echo "📋 Configurações:"
echo "   Container: $CONTAINER_NAME"
echo "   Porta: $API_PORT"
echo "   Instance: $INSTANCE_NAME"
echo "   API Key: $API_KEY"
echo "   Imagem: $EVOLUTION_IMAGE"
echo ""

# Verificar se container já existe
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "⚠️  Container $CONTAINER_NAME já existe!"
    read -p "Deseja remover e recriar? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "🗑️  Removendo container existente..."
        docker stop $CONTAINER_NAME 2>/dev/null || true
        docker rm $CONTAINER_NAME 2>/dev/null || true
    else
        echo "✅ Usando container existente"
        echo ""
        echo "📝 Para iniciar o container:"
        echo "   docker start $CONTAINER_NAME"
        echo ""
        echo "📝 Para ver logs:"
        echo "   docker logs -f $CONTAINER_NAME"
        exit 0
    fi
fi

# Verificar se porta está em uso
if netstat -tuln 2>/dev/null | grep -q ":${API_PORT} " || ss -tuln 2>/dev/null | grep -q ":${API_PORT} "; then
    echo "⚠️  Porta $API_PORT já está em uso!"
    read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Instalação cancelada"
        exit 1
    fi
fi

# Criar container Evolution API
echo "🚀 Criando container Evolution API..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $API_PORT:8080 \
  -e AUTHENTICATION_API_KEY=$API_KEY \
  -e DATABASE_ENCRYPTED=true \
  -e QRCODE_LIMIT=30 \
  -e QRCODE_COLOR=#198754 \
  "$EVOLUTION_IMAGE"

if [ $? -eq 0 ]; then
    echo "✅ Container criado com sucesso!"
    echo ""
    echo "⏳ Aguardando inicialização (15 segundos)..."
    sleep 15
    
    # Verificar se container está rodando
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✅ Container está rodando!"
    else
        echo "⚠️  Container pode não estar rodando. Verifique:"
        echo "   docker ps -a | grep $CONTAINER_NAME"
        echo "   docker logs $CONTAINER_NAME"
    fi
    
    echo ""
    echo "=========================================="
    echo "✅ Evolution API instalada!"
    echo "=========================================="
    echo ""
    echo "📝 Próximos passos:"
    echo ""
    echo "1. Criar instância WhatsApp:"
    echo "   curl -X POST http://localhost:$API_PORT/instance/create \\"
    echo "     -H \"apikey: $API_KEY\" \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d '{\"instanceName\": \"$INSTANCE_NAME\", \"token\": \"token-secreto\", \"qrcode\": true}'"
    echo ""
    echo "2. Obter QR Code para conectar:"
    echo "   curl http://localhost:$API_PORT/instance/connect/$INSTANCE_NAME \\"
    echo "     -H \"apikey: $API_KEY\""
    echo ""
    echo "3. Adicionar ao .env do Laravel:"
    echo "   WHATSAPP_API_URL=http://localhost:$API_PORT"
    echo "   WHATSAPP_API_KEY=$API_KEY"
    echo "   WHATSAPP_INSTANCE_NAME=$INSTANCE_NAME"
    echo ""
    echo "4. Rodar migration:"
    echo "   php artisan migrate"
    echo ""
    echo "5. Limpar cache:"
    echo "   php artisan config:clear"
    echo ""
    echo "📊 Comandos úteis:"
    echo "   Ver logs: docker logs -f $CONTAINER_NAME"
    echo "   Parar: docker stop $CONTAINER_NAME"
    echo "   Iniciar: docker start $CONTAINER_NAME"
    echo "   Status: docker ps | grep $CONTAINER_NAME"
    echo ""
else
    echo "❌ Erro ao criar container!"
    echo ""
    echo "Verifique os logs:"
    echo "   docker logs $CONTAINER_NAME"
    exit 1
fi

