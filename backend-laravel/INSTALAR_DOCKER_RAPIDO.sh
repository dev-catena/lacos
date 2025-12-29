#!/bin/bash

# Script simplificado para instalar Docker rapidamente
# Usa método mais direto sem muitas verificações

set +e
export DEBIAN_FRONTEND=noninteractive

echo "🐳 Instalando Docker (método rápido)..."
echo ""

# Verificar se já está instalado
if command -v docker &> /dev/null; then
    echo "✅ Docker já está instalado"
    docker --version
    exit 0
fi

echo "📥 Atualizando pacotes..."
apt-get update -y -qq 2>&1 | grep -v "^W:" || true

echo "📦 Instalando Docker via script oficial..."
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
sh /tmp/get-docker.sh

# Verificar instalação
if command -v docker &> /dev/null; then
    echo "✅ Docker instalado!"
    docker --version
    
    # Iniciar Docker
    systemctl start docker 2>/dev/null || service docker start 2>/dev/null
    systemctl enable docker 2>/dev/null || true
    
    echo "✅ Docker iniciado e configurado"
else
    echo "❌ Erro ao instalar Docker"
    exit 1
fi


