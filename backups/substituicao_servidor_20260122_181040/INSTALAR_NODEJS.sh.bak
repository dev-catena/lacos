#!/bin/bash

echo "🔧 Instalando Node.js e npm no servidor..."
echo ""

# Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update

# Instalar dependências
echo "📦 Instalando dependências..."
sudo apt install -y curl gnupg2 software-properties-common

# Adicionar repositório NodeSource (Node.js 20.x LTS)
echo "📦 Adicionando repositório NodeSource..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
echo "📦 Instalando Node.js..."
sudo apt install -y nodejs

# Verificar instalação
echo ""
echo "✅ Verificando instalação..."
node --version
npm --version
npx --version

echo ""
echo "✅ Node.js, npm e npx instalados com sucesso!"
echo ""
echo "📋 Versões instaladas:"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo "   npx: $(npx --version)"

