#!/bin/bash

# Script para enviar arquivos da Loja para o servidor
# Requer SSH_PASS como variável de ambiente

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
REMOTE_PATH="/var/www/lacos-backend"
LOCAL_PATH="$(pwd)"

echo "📤 Enviando arquivos da Loja para o servidor..."
echo ""

# Verificar se SSH_PASS está definida
if [ -z "$SSH_PASS" ]; then
  echo "❌ Erro: A variável de ambiente SSH_PASS não está definida."
  echo "   Por favor, defina-a antes de executar o script: export SSH_PASS=\"sua_senha_ssh\""
  exit 1
fi

# Criar lista de arquivos para enviar
FILES=(
  # Migration
  "database/migrations/2024_01_15_000008_add_store_fields_to_supplier_products.php"
  
  # Models atualizados
  "app/Models/SupplierProduct.php"
  
  # Controllers
  "app/Http/Controllers/Api/StoreController.php"
  
  # Rotas atualizadas
  "routes/api.php"
  
  # Scripts
  "CORRIGIR_E_MIGRAR_LOJA.sh"
)

# Verificar quais arquivos existem localmente
echo "🔍 Verificando arquivos locais..."
MISSING_FILES=()
for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    MISSING_FILES+=("$file")
    echo "   ⚠️  Não encontrado: $file"
  else
    echo "   ✅ Encontrado: $file"
  fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
  echo ""
  echo "❌ Alguns arquivos não foram encontrados. Verifique os caminhos."
  exit 1
fi

echo ""
echo "📤 Enviando arquivos para o servidor..."

# Enviar cada arquivo
for file in "${FILES[@]}"; do
  echo "   📤 Enviando: $file"
  
  # Criar diretório temporário no servidor
  REMOTE_DIR=$(dirname "$file")
  sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "mkdir -p /tmp/lacos-deploy/$(dirname $file)"
  
  # Enviar para /tmp
  sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" -o StrictHostKeyChecking=no "$file" "$SSH_USER@$SSH_HOST:/tmp/lacos-deploy/$file"
  
  # Mover para o destino final com sudo
  sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "
    export SUDO_PASS='$SSH_PASS'
    echo \"\$SUDO_PASS\" | sudo -S mkdir -p $REMOTE_PATH/$(dirname $file)
    echo \"\$SUDO_PASS\" | sudo -S mv /tmp/lacos-deploy/$file $REMOTE_PATH/$file
    echo \"\$SUDO_PASS\" | sudo -S chown www-data:www-data $REMOTE_PATH/$file
  "
  
  echo "   ✅ Enviado: $file"
done

# Limpar diretório temporário
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "rm -rf /tmp/lacos-deploy"

echo ""
echo "✅ Todos os arquivos foram enviados com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Execute no servidor: cd /var/www/lacos-backend && ./CORRIGIR_E_MIGRAR_LOJA.sh"
echo "   2. Ou execute manualmente:"
echo "      sudo -u www-data php artisan config:clear"
echo "      sudo -u www-data php artisan cache:clear"
echo "      sudo -u www-data php artisan migrate --force --path=database/migrations/2024_01_15_000008_add_store_fields_to_supplier_products.php"



