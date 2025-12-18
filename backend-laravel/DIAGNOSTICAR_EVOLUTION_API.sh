#!/bin/bash

# Script para diagnosticar problemas com Evolution API

CONTAINER_NAME="evolution-api-lacos"

echo "🔍 Diagnosticando Evolution API..."
echo ""

# Ver logs completos
echo "1️⃣ Logs completos do container:"
echo "=========================================="
docker logs $CONTAINER_NAME 2>&1 | tail -100
echo "=========================================="
echo ""

# Verificar recursos do sistema
echo "2️⃣ Recursos do sistema:"
echo "   Memória disponível:"
free -h | grep Mem
echo "   Espaço em disco:"
df -h / | tail -1
echo ""

# Verificar se há outros containers usando a porta
echo "3️⃣ Verificando porta 8080:"
if netstat -tuln 2>/dev/null | grep -q ":8080 " || ss -tuln 2>/dev/null | grep -q ":8080 "; then
    echo "⚠️  Porta 8080 está em uso:"
    netstat -tuln 2>/dev/null | grep ":8080 " || ss -tuln 2>/dev/null | grep ":8080 "
else
    echo "✅ Porta 8080 está livre"
fi
echo ""

# Tentar iniciar e capturar erro em tempo real
echo "4️⃣ Tentando iniciar e capturar erro em tempo real..."
docker start $CONTAINER_NAME
sleep 3

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "✅ Container iniciou!"
else
    echo "❌ Container não iniciou. Últimos logs:"
    docker logs $CONTAINER_NAME --tail 20 2>&1
fi

echo ""
echo "📋 Informações do container:"
docker inspect $CONTAINER_NAME --format='{{.State.Status}} - {{.State.Error}}' 2>/dev/null || echo "Erro ao inspecionar"

