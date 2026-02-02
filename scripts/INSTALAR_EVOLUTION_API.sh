#!/bin/bash

# Script para instalar Evolution API (WhatsApp) via Docker
# Este script instala e configura a Evolution API para uso com 2FA

set -e

echo "💬 Instalando Evolution API para WhatsApp 2FA..."
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "   Instale o Docker primeiro: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker encontrado"
echo ""

# Variáveis de configuração
CONTAINER_NAME="evolution-api-lacos"
API_PORT="8080"
API_KEY=$(openssl rand -hex 32)
INSTANCE_NAME="lacos-2fa"

echo "📋 Configurações:"
echo "   Container: $CONTAINER_NAME"
echo "   Porta: $API_PORT"
echo "   Instance: $INSTANCE_NAME"
echo "   API Key: $API_KEY"
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

echo "⚠️  Atenção: a imagem 'atendai/evolution-api:latest' (Evolution API v2) exige banco de dados."
echo "   Se você tentar rodar sem banco, pode ocorrer: 'Database provider invalid'."
echo ""
echo "✅ Use o script com PostgreSQL:"
echo "   sudo bash INSTALAR_EVOLUTION_API_COM_POSTGRES.sh"
echo ""
echo "Se você está rodando via /tmp no servidor:"
echo "   sudo bash /tmp/INSTALAR_EVOLUTION_API_COM_POSTGRES.sh"
echo ""
exit 0

