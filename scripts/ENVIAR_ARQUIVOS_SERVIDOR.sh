#!/bin/bash

# Script para enviar arquivos novos para o servidor
# Requer SSH_PASS como variável de ambiente

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
REMOTE_PATH="/var/www/lacos-backend"
LOCAL_PATH="$(pwd)"

echo "📤 Enviando arquivos para o servidor..."
echo ""

# Verificar se SSH_PASS está definida
if [ -z "$SSH_PASS" ]; then
  echo "❌ Erro: A variável de ambiente SSH_PASS não está definida."
  echo "   Por favor, defina-a antes de executar o script: export SSH_PASS=\"sua_senha_ssh\""
  exit 1
fi

# Criar lista de arquivos para enviar
FILES=(
  # Migrations
  "database/migrations/2024_01_15_000003_create_supplier_products_table.php"
  "database/migrations/2024_01_15_000004_create_orders_table.php"
  "database/migrations/2024_01_15_000005_create_order_items_table.php"
  "database/migrations/2024_01_15_000006_create_conversations_table.php"
  "database/migrations/2024_01_15_000007_create_messages_table.php"
  
  # Models
  "app/Models/SupplierProduct.php"
  "app/Models/Order.php"
  "app/Models/OrderItem.php"
  "app/Models/Conversation.php"
  "app/Models/Message.php"
  
  # Controllers
  "app/Http/Controllers/Api/SupplierProductController.php"
  "app/Http/Controllers/Api/SupplierOrderController.php"
  "app/Http/Controllers/Api/SupplierMessageController.php"
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
  echo "❌ Alguns arquivos não foram encontrados localmente!"
  echo "   Certifique-se de estar no diretório backend-laravel"
  exit 1
fi

echo ""
echo "📤 Enviando arquivos..."

# Enviar cada arquivo via /tmp primeiro
for file in "${FILES[@]}"; do
  echo "   📄 Enviando: $file"
  
  FILENAME=$(basename "$file")
  REMOTE_TMP="/tmp/$FILENAME"
  REMOTE_DEST="$REMOTE_PATH/$file"
  REMOTE_DIR=$(dirname "$REMOTE_DEST")
  
  # Enviar para /tmp
  sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" "$file" "$SSH_USER"@"$SSH_HOST":"$REMOTE_TMP"
  
  if [ $? -eq 0 ]; then
    # Mover do /tmp para destino final com sudo
    sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER"@"$SSH_HOST" "
      export SUDO_PASS='$SSH_PASS';
      echo \"\$SUDO_PASS\" | sudo -S mkdir -p $REMOTE_DIR &&
      echo \"\$SUDO_PASS\" | sudo -S mv $REMOTE_TMP $REMOTE_DEST &&
      echo \"\$SUDO_PASS\" | sudo -S chown www-data:www-data $REMOTE_DEST &&
      echo \"\$SUDO_PASS\" | sudo -S chmod 644 $REMOTE_DEST &&
      echo 'OK' || echo 'FAIL'
    " | grep -q "OK" && echo "      ✅ Enviado com sucesso" || echo "      ❌ Erro ao enviar"
  else
    echo "      ❌ Erro ao enviar para /tmp"
  fi
done

echo ""
echo "🔄 Atualizando arquivos modificados..."

# Arquivos que podem ter sido modificados
MODIFIED_FILES=(
  "app/Models/Supplier.php"
  "routes/api.php"
)

for file in "${MODIFIED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   📄 Atualizando: $file"
    FILENAME=$(basename "$file")
    REMOTE_TMP="/tmp/$FILENAME"
    REMOTE_DEST="$REMOTE_PATH/$file"
    
    # Enviar para /tmp
    sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" "$file" "$SSH_USER"@"$SSH_HOST":"$REMOTE_TMP"
    
    if [ $? -eq 0 ]; then
      # Mover do /tmp para destino final com sudo
      sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER"@"$SSH_HOST" "
        export SUDO_PASS='$SSH_PASS';
        echo \"\$SUDO_PASS\" | sudo -S mv $REMOTE_TMP $REMOTE_DEST &&
        echo \"\$SUDO_PASS\" | sudo -S chown www-data:www-data $REMOTE_DEST &&
        echo \"\$SUDO_PASS\" | sudo -S chmod 644 $REMOTE_DEST &&
        echo 'OK' || echo 'FAIL'
      " | grep -q "OK" && echo "      ✅ Atualizado com sucesso" || echo "      ❌ Erro ao atualizar"
    else
      echo "      ❌ Erro ao enviar para /tmp"
    fi
  fi
done

echo ""
echo "🔧 Ajustando permissões no servidor..."
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER"@"$SSH_HOST" "
  export SUDO_PASS='$SSH_PASS';
  cd $REMOTE_PATH && 
  echo \"\$SUDO_PASS\" | sudo -S chown -R www-data:www-data app/Models database/migrations app/Http/Controllers routes 2>/dev/null &&
  echo \"\$SUDO_PASS\" | sudo -S find app/Models database/migrations app/Http/Controllers routes -type f -name '*.php' -exec chmod 644 {} \; 2>/dev/null &&
  echo 'Permissões ajustadas'
"

echo ""
echo "✅ Upload concluído!"
echo ""
echo "💡 Próximos passos no servidor:"
echo "   1. cd /var/www/lacos-backend"
echo "   2. sudo -u www-data php artisan migrate --force"
echo "   3. sudo -u www-data php artisan config:clear"
echo "   4. sudo -u www-data php artisan route:clear"

