#!/bin/bash

# Script de deploy das alterações de produtos para o servidor
# Servidor: 10.102.0.103:63022
# Usuário: darley

SERVER="10.102.0.103"
PORT="63022"
USER="darley"
WEBSITE_PATH="/var/www/lacos-website"

echo "🚀 Iniciando deploy das alterações de produtos..."

# Arquivos a serem copiados
FILES=(
  "website/src/components/ProductsManagement.jsx"
  "website/src/services/supplierService.js"
)

# Copiar cada arquivo
for file in "${FILES[@]}"; do
  echo "📤 Copiando $file..."
  scp -P $PORT "$file" $USER@$SERVER:$WEBSITE_PATH/${file#website/}
  
  if [ $? -eq 0 ]; then
    echo "✅ $file copiado com sucesso!"
  else
    echo "❌ Erro ao copiar $file"
    exit 1
  fi
done

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📝 Próximos passos (execute no servidor):"
echo "   ssh -p $PORT $USER@$SERVER"
echo "   cd $WEBSITE_PATH"
echo "   npm run build  # ou o comando de build que você usa"
echo "   # Reiniciar o serviço web se necessário"

