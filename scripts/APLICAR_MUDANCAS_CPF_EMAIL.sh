#!/bin/bash

# Script para aplicar mudanças de CPF/Email no servidor
# Envia arquivos e aplica mudanças automaticamente

SERVER="darley@193.203.182.22"
PORT="63022"
PASSWORD="yhvh77"
TMP_DIR="/tmp"
BACKEND_DIR="/var/www/lacos-backend"

echo "🚀 Aplicando mudanças de CPF/Email no servidor..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para enviar arquivo via scp
send_file() {
    local file=$1
    local dest=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Arquivo não encontrado: $file${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}📤 Enviando $file...${NC}"
    sshpass -p "$PASSWORD" scp -P "$PORT" "$file" "$SERVER:$dest"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $file enviado com sucesso${NC}"
        return 0
    else
        echo -e "${RED}❌ Erro ao enviar $file${NC}"
        return 1
    fi
}

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}❌ sshpass não está instalado.${NC}"
    echo "Instale com: sudo apt-get install sshpass"
    exit 1
fi

echo "📦 Enviando arquivos para o servidor..."
echo ""

# Enviar arquivos do backend
send_file "backend-laravel/add_cpf_to_users_table.php" "$TMP_DIR/add_cpf_to_users_table.php"
send_file "backend-laravel/AuthController_MODIFICADO_CPF_EMAIL.php" "$TMP_DIR/AuthController_MODIFICADO_CPF_EMAIL.php"

# Enviar arquivos do frontend (se necessário, mas normalmente já estão no repositório)
# send_file "src/utils/cpf.js" "$TMP_DIR/cpf.js"
# send_file "src/screens/Auth/ProfileSelectionScreen.js" "$TMP_DIR/ProfileSelectionScreen.js"

echo ""
echo "🔧 Aplicando mudanças no servidor..."
echo ""

# Script remoto para aplicar mudanças
sshpass -p "$PASSWORD" ssh -p "$PORT" "$SERVER" << 'ENDSSH'
#!/bin/bash

BACKEND_DIR="/var/www/lacos-backend"
TMP_DIR="/tmp"

echo "📁 Entrando no diretório do backend..."
cd "$BACKEND_DIR" || exit 1

# 1. Aplicar migração
echo ""
echo "1️⃣ Aplicando migração do CPF..."
if [ -f "$TMP_DIR/add_cpf_to_users_table.php" ]; then
    # Copiar migração para o diretório de migrations
    sudo cp "$TMP_DIR/add_cpf_to_users_table.php" database/migrations/$(date +%Y_%m_%d_%H%M%S)_add_cpf_to_users_table.php
    
    # Aplicar migração
    php artisan migrate --path=database/migrations/$(ls -t database/migrations/*add_cpf_to_users_table.php | head -1 | xargs basename)
    
    if [ $? -eq 0 ]; then
        echo "✅ Migração aplicada com sucesso"
    else
        echo "❌ Erro ao aplicar migração"
        exit 1
    fi
else
    echo "❌ Arquivo de migração não encontrado em $TMP_DIR"
    exit 1
fi

# 2. Fazer backup e substituir AuthController
echo ""
echo "2️⃣ Substituindo AuthController..."
if [ -f "$TMP_DIR/AuthController_MODIFICADO_CPF_EMAIL.php" ]; then
    # Fazer backup
    if [ -f "app/Http/Controllers/Api/AuthController.php" ]; then
        sudo cp app/Http/Controllers/Api/AuthController.php app/Http/Controllers/Api/AuthController.php.bak.$(date +%Y%m%d_%H%M%S)
        echo "✅ Backup do AuthController criado"
    fi
    
    # Copiar versão modificada
    sudo cp "$TMP_DIR/AuthController_MODIFICADO_CPF_EMAIL.php" app/Http/Controllers/Api/AuthController.php
    echo "✅ AuthController substituído"
else
    echo "❌ Arquivo AuthController_MODIFICADO_CPF_EMAIL.php não encontrado em $TMP_DIR"
    exit 1
fi

# 3. Adicionar rota para login com perfil
echo ""
echo "3️⃣ Adicionando rota /login/select-profile..."
ROUTES_FILE="routes/api.php"

# Verificar se a rota já existe
if grep -q "login/select-profile" "$ROUTES_FILE"; then
    echo "⚠️ Rota /login/select-profile já existe"
else
    # Encontrar onde adicionar a rota (após a rota de login)
    if grep -q "Route::post('/login'" "$ROUTES_FILE"; then
        # Adicionar após a rota de login
        sudo sed -i "/Route::post('\/login'/a\\    Route::post('/login/select-profile', [AuthController::class, 'loginWithProfile']);" "$ROUTES_FILE"
        echo "✅ Rota adicionada após /login"
    else
        # Adicionar no final do grupo de rotas de autenticação
        if grep -q "Route::group.*auth" "$ROUTES_FILE"; then
            sudo sed -i "/Route::group.*auth/,/});/a\\    Route::post('/login/select-profile', [AuthController::class, 'loginWithProfile']);" "$ROUTES_FILE"
            echo "✅ Rota adicionada no grupo de autenticação"
        else
            # Adicionar no final do arquivo
            echo "" | sudo tee -a "$ROUTES_FILE"
            echo "Route::post('/login/select-profile', [AuthController::class, 'loginWithProfile']);" | sudo tee -a "$ROUTES_FILE"
            echo "✅ Rota adicionada no final do arquivo"
        fi
    fi
fi

# 4. Limpar cache
echo ""
echo "4️⃣ Limpando cache do Laravel..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
echo "✅ Cache limpo"

echo ""
echo "✅ Todas as mudanças foram aplicadas com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Testar registro de médico com CPF"
echo "   2. Testar login com CPF (médico) e Email (outros perfis)"
echo "   3. Testar múltiplos perfis com mesmo email"

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Script executado com sucesso!${NC}"
else
    echo ""
    echo -e "${RED}❌ Erro ao executar script no servidor${NC}"
    exit 1
fi

echo ""
echo "🎉 Processo concluído!"






