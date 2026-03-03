#!/bin/bash

# Script para executar os testes do web-admin

echo "🚀 Preparando ambiente para testes do Web-Admin..."

# Verificar se está em um ambiente virtual
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Nenhum ambiente virtual ativo. Criando um..."
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
fi

# Instalar dependências
echo "📦 Instalando dependências..."
pip install -q -r requirements.txt

# Verificar se o web-admin está rodando
echo "🔍 Verificando se o web-admin está acessível..."
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "⚠️  Web-admin não está acessível em http://localhost:5173"
    echo "💡 Certifique-se de que o web-admin está rodando antes de executar os testes"
    read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Verificar se a API está acessível
echo "🔍 Verificando se a API está acessível..."
if ! curl -s http://localhost:8000/api/gateway/status > /dev/null 2>&1; then
    echo "⚠️  API não está acessível em http://localhost:8000/api"
    echo "💡 Certifique-se de que o backend está rodando antes de executar os testes"
    read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Executar testes
echo ""
echo "🧪 Executando testes..."
echo "=" | head -c 60 && echo ""
python3 test_webadmin.py

echo ""
echo "✅ Testes concluídos!"






