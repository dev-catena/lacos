#!/bin/bash

# Script para iniciar o Expo no diretório correto
# Uso: ./scripts/INICIAR_EXPO.sh [opções]

# Ir para o diretório do projeto
cd "$(dirname "$0")/.." || exit 1

echo "📱 Iniciando Expo no diretório: $(pwd)"
echo ""

# Verificar se o expo está instalado
if ! npm list expo > /dev/null 2>&1; then
    echo "❌ Expo não encontrado. Instalando dependências..."
    npm install
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules não encontrado. Instalando dependências..."
    npm install
fi

# Iniciar o Expo com as opções passadas
echo "🚀 Iniciando Expo..."
echo ""

# Se não houver argumentos, usar o script padrão
if [ $# -eq 0 ]; then
    npm start
else
    # Passar todos os argumentos para o npm start
    npm start "$@"
fi






