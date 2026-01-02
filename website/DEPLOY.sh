#!/bin/bash

# Script de deploy do site LaçosApp
# Uso: ./DEPLOY.sh

set -e

echo "🚀 Iniciando deploy do site LaçosApp..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório website/"
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Build do projeto
echo "🏗️  Construindo o projeto..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    echo "❌ Erro: Build falhou. A pasta dist/ não foi criada."
    exit 1
fi

echo "✅ Build concluído com sucesso!"
echo ""
echo "📁 Arquivos prontos para deploy em: $(pwd)/dist"
echo ""
echo "💡 Próximos passos:"
echo "   1. Copie os arquivos da pasta dist/ para o servidor web"
echo "   2. Configure o servidor para servir index.html para todas as rotas (SPA)"
echo "   3. Configure o domínio lacosapp.com para apontar para este diretório"
echo ""
echo "📝 Exemplo de configuração Nginx:"
echo "   server {"
echo "       listen 80;"
echo "       server_name lacosapp.com www.lacosapp.com;"
echo "       root /var/www/lacos-website/dist;"
echo "       index index.html;"
echo "       location / {"
echo "           try_files \$uri \$uri/ /index.html;"
echo "       }"
echo "   }"


