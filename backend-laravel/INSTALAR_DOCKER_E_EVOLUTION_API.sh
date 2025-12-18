#!/bin/bash

# Script completo para instalar Docker e Evolution API
# Este script instala Docker (se necessário) e depois Evolution API

set -e

echo "🐳 Instalando Docker e Evolution API..."
echo ""

# ==================== 1. INSTALAR DOCKER ====================
echo "1️⃣ Verificando Docker..."

if command -v docker &> /dev/null; then
    echo "✅ Docker já está instalado"
    docker --version
else
    echo "📦 Docker não encontrado. Instalando..."
    echo ""
    
    # Atualizar pacotes (com timeout e feedback)
    echo "📥 Atualizando lista de pacotes (isso pode levar alguns minutos)..."
    export DEBIAN_FRONTEND=noninteractive
    timeout 300 apt-get update -qq || {
        echo "⚠️  Timeout ao atualizar pacotes. Tentando novamente..."
        apt-get update -qq || {
            echo "❌ Erro ao atualizar pacotes. Verifique sua conexão com a internet."
            exit 1
        }
    }
    echo "✅ Lista de pacotes atualizada"
    
    # Instalar dependências
    echo "📥 Instalando dependências..."
    timeout 300 apt-get install -y -qq \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        apt-transport-https || {
        echo "❌ Erro ao instalar dependências"
        exit 1
    }
    echo "✅ Dependências instaladas"
    
    # Adicionar chave GPG do Docker
    echo "🔑 Adicionando chave GPG do Docker..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL --max-time 30 https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg || {
        echo "❌ Erro ao baixar chave GPG do Docker"
        exit 1
    }
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "✅ Chave GPG adicionada"
    
    # Adicionar repositório Docker
    echo "📦 Adicionando repositório Docker..."
    ARCH=$(dpkg --print-architecture)
    CODENAME=$(lsb_release -cs)
    echo "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${CODENAME} stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    echo "✅ Repositório adicionado"
    
    # Atualizar pacotes novamente
    echo "📥 Atualizando lista de pacotes (após adicionar repositório Docker)..."
    timeout 300 apt-get update -qq || {
        echo "⚠️  Timeout ao atualizar pacotes. Tentando continuar..."
        apt-get update -qq || {
            echo "❌ Erro ao atualizar pacotes"
            exit 1
        }
    }
    echo "✅ Lista atualizada"
    
    # Instalar Docker
    echo "📦 Instalando Docker (isso pode levar alguns minutos)..."
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Verificar se instalou (mesmo que tenha dado warning)
    if command -v docker &> /dev/null || [ -f /usr/bin/docker ]; then
        echo "✅ Docker instalado"
    else
        echo "⚠️  Docker pode não ter sido instalado completamente"
        echo "   Tentando verificar novamente..."
        sleep 2
    fi
    
    # Iniciar Docker
    echo "🚀 Iniciando Docker..."
    systemctl daemon-reload 2>/dev/null || true
    systemctl start docker 2>/dev/null || service docker start 2>/dev/null || true
    systemctl enable docker 2>/dev/null || true
    sleep 3
    
    # Verificar instalação
    if command -v docker &> /dev/null || [ -f /usr/bin/docker ]; then
        echo "✅ Docker instalado com sucesso!"
        docker --version 2>/dev/null || echo "Docker instalado (versão não disponível)"
        
        # Verificar se docker está rodando
        if docker ps &>/dev/null 2>&1; then
            echo "✅ Docker está funcionando corretamente"
        else
            echo "⚠️  Docker instalado mas não está respondendo. Tentando iniciar..."
            systemctl start docker 2>/dev/null || service docker start 2>/dev/null || true
            sleep 3
            if docker ps &>/dev/null 2>&1; then
                echo "✅ Docker iniciado com sucesso"
            else
                echo "⚠️  Docker instalado mas pode precisar de reinicialização"
                echo "   Tente: sudo systemctl restart docker"
                echo "   Ou continue - pode funcionar mesmo assim"
            fi
        fi
    else
        echo "❌ Erro: Docker não foi instalado!"
        echo "   Verifique os logs:"
        echo "   journalctl -u docker"
        exit 1
    fi
fi

# Voltar para modo de erro estrito após instalação do Docker
set -e

echo ""

# ==================== 2. INSTALAR EVOLUTION API ====================
echo "2️⃣ Instalando Evolution API..."
echo ""

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
    echo "✅ Instalação concluída!"
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

