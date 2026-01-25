#!/bin/bash

# Script para instalar correções de validação do SupplierController
# Corrige mensagens de validação para português
#
# USO: Execute este script LOCALMENTE (na sua máquina)
# Ele fará SSH para o servidor remoto e instalará as correções
#
# Exemplo:
#   cd backend-laravel
#   export SSH_PASS="sua_senha_ssh"
#   ./INSTALAR_CORRECOES_VALIDACAO_FORNECEDOR.sh

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

# Verificar se SSH_PASS está definido
if [ -z "$SSH_PASS" ]; then
    echo "❌ Erro: Variável SSH_PASS não definida"
    echo ""
    echo "💡 Como usar:"
    echo "   export SSH_PASS=\"sua_senha_ssh\""
    echo "   ./INSTALAR_CORRECOES_VALIDACAO_FORNECEDOR.sh"
    echo ""
    exit 1
fi

echo "🔧 Instalando correções de validação do SupplierController..."
echo ""

# 1. Fazer backup do arquivo atual
echo "📦 Fazendo backup..."
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER"@"$SSH_HOST" "
  echo '$SSH_PASS' | sudo -S cp $BACKEND_PATH/app/Http/Controllers/Api/SupplierController.php $BACKEND_PATH/app/Http/Controllers/Api/SupplierController.php.bak.\$(date +%Y%m%d_%H%M%S) &&
  echo '✅ Backup criado'
"

# 2. Enviar arquivo corrigido para diretório temporário
echo "📤 Enviando arquivo corrigido..."
TEMP_FILE="/tmp/SupplierController.php"
sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" \
  app/Http/Controllers/Api/SupplierController.php \
  "$SSH_USER"@"$SSH_HOST":"$TEMP_FILE"

if [ $? -ne 0 ]; then
  echo "❌ Erro ao enviar arquivo. Abortando."
  exit 1
fi
echo "✅ Arquivo enviado para diretório temporário!"

# 3. Mover arquivo para local correto com sudo
echo "📁 Movendo arquivo para local correto..."
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER"@"$SSH_HOST" "
  echo '$SSH_PASS' | sudo -S mv $TEMP_FILE $BACKEND_PATH/app/Http/Controllers/Api/SupplierController.php &&
  echo '$SSH_PASS' | sudo -S chown www-data:www-data $BACKEND_PATH/app/Http/Controllers/Api/SupplierController.php &&
  echo '✅ Arquivo instalado!'
"

# 3. Verificar sintaxe PHP
echo "🔍 Verificando sintaxe PHP..."
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER"@"$SSH_HOST" "
  cd $BACKEND_PATH && 
  php -l app/Http/Controllers/Api/SupplierController.php
"

if [ $? -ne 0 ]; then
  echo "❌ Erro de sintaxe PHP detectado!"
  exit 1
fi
echo "✅ Sintaxe PHP válida!"

# 4. Limpar cache do Laravel
echo "🧹 Limpando cache do Laravel..."
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER"@"$SSH_HOST" "
  cd $BACKEND_PATH && 
  echo '$SSH_PASS' | sudo -S php artisan config:clear &&
  echo '$SSH_PASS' | sudo -S php artisan cache:clear &&
  echo '$SSH_PASS' | sudo -S php artisan route:clear
"
echo "✅ Cache limpo!"

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Correções aplicadas:"
echo "   - Mensagens de validação em português"
echo "   - Mensagens para campos obrigatórios"
echo "   - Mensagens para tamanhos máximos"
echo "   - Mensagens para tipos inválidos"
echo "   - Mensagens para formatos inválidos"
echo ""
echo "🧪 Execute os testes para verificar:"
echo "   cd testunit"
echo "   source venv/bin/activate"
echo "   python3 test_supplier_wizard.py https://gateway.lacosapp.com/api root@lacos.com yhvh77"

