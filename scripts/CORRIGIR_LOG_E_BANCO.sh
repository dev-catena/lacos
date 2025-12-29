#!/bin/bash

# Script para corrigir permissões de log e verificar credenciais do banco
# Execute este script NO SERVIDOR onde está o backend Laravel

set -e

echo "🔧 Corrigindo permissões de log e verificando banco de dados..."
echo ""

# Tentar encontrar o diretório do projeto
PROJECT_DIR=""
POSSIBLE_PATHS=(
    "/var/www/lacos-backend"
    "$HOME/lacos-backend"
    "$(pwd)"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/artisan" ]; then
        PROJECT_DIR="$path"
        echo "✅ Projeto encontrado em: $PROJECT_DIR"
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    echo "❌ Não foi possível encontrar o projeto Laravel"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1
echo "📂 Diretório atual: $(pwd)"
echo ""

# 1. Corrigir permissões do arquivo de log
echo "1️⃣ Corrigindo permissões do arquivo de log..."
if [ -f "storage/logs/laravel.log" ]; then
    sudo chown www-data:www-data storage/logs/laravel.log
    sudo chmod 664 storage/logs/laravel.log
    echo "✅ Permissões do arquivo de log corrigidas"
else
    echo "📝 Criando arquivo de log..."
    sudo touch storage/logs/laravel.log
    sudo chown www-data:www-data storage/logs/laravel.log
    sudo chmod 664 storage/logs/laravel.log
    echo "✅ Arquivo de log criado"
fi
echo ""

# 2. Corrigir permissões do diretório de logs
echo "2️⃣ Corrigindo permissões do diretório de logs..."
sudo chown -R www-data:www-data storage/logs
sudo chmod -R 775 storage/logs
echo "✅ Permissões do diretório corrigidas"
echo ""

# 3. Verificar se .env existe
echo "3️⃣ Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📝 Criando .env a partir do .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Arquivo .env criado"
        echo "⚠️  IMPORTANTE: Configure as credenciais do banco de dados no .env"
    else
        echo "❌ Arquivo .env.example também não encontrado!"
        exit 1
    fi
else
    echo "✅ Arquivo .env encontrado"
fi
echo ""

# 4. Verificar credenciais do banco de dados
echo "4️⃣ Verificando credenciais do banco de dados..."
if [ -f ".env" ]; then
    # Extrair credenciais do .env
    DB_CONNECTION=$(grep "^DB_CONNECTION=" .env | cut -d '=' -f2 | tr -d ' ' || echo "mysql")
    DB_HOST=$(grep "^DB_HOST=" .env | cut -d '=' -f2 | tr -d ' ' || echo "localhost")
    DB_PORT=$(grep "^DB_PORT=" .env | cut -d '=' -f2 | tr -d ' ' || echo "3306")
    DB_DATABASE=$(grep "^DB_DATABASE=" .env | cut -d '=' -f2 | tr -d ' ' || echo "")
    DB_USERNAME=$(grep "^DB_USERNAME=" .env | cut -d '=' -f2 | tr -d ' ' || echo "")
    DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2 | tr -d ' ' || echo "")
    
    echo "📋 Configuração atual do banco:"
    echo "   Host: $DB_HOST"
    echo "   Port: $DB_PORT"
    echo "   Database: $DB_DATABASE"
    echo "   Username: $DB_USERNAME"
    echo "   Password: [oculto]"
    echo ""
    
    # Testar conexão
    echo "🔍 Testando conexão com o banco de dados..."
    if [ -n "$DB_DATABASE" ] && [ -n "$DB_USERNAME" ]; then
        # Tentar conectar usando mysql client
        if command -v mysql &> /dev/null; then
            if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT 1;" "$DB_DATABASE" 2>/dev/null; then
                echo "✅ Conexão com banco de dados OK!"
            else
                echo "❌ Erro ao conectar com banco de dados!"
                echo ""
                echo "⚠️  Possíveis problemas:"
                echo "   1. Credenciais incorretas no .env"
                echo "   2. Usuário do banco não existe"
                echo "   3. Senha incorreta"
                echo "   4. Banco de dados não existe"
                echo "   5. Host/porta incorretos"
                echo ""
                echo "📝 Para corrigir:"
                echo "   1. Edite o arquivo .env:"
                echo "      nano .env"
                echo ""
                echo "   2. Verifique estas linhas:"
                echo "      DB_CONNECTION=mysql"
                echo "      DB_HOST=127.0.0.1"
                echo "      DB_PORT=3306"
                echo "      DB_DATABASE=nome_do_banco"
                echo "      DB_USERNAME=usuario_do_banco"
                echo "      DB_PASSWORD=senha_do_banco"
                echo ""
                echo "   3. Após corrigir, execute novamente este script"
            fi
        else
            echo "⚠️  mysql client não instalado, não é possível testar conexão"
            echo "   Mas as credenciais parecem estar configuradas"
        fi
    else
        echo "❌ Credenciais do banco não estão configuradas no .env!"
        echo "   DB_DATABASE ou DB_USERNAME estão vazios"
    fi
else
    echo "⚠️  Arquivo .env não encontrado, não é possível verificar credenciais"
fi
echo ""

# 5. Corrigir permissões de toda a estrutura storage
echo "5️⃣ Corrigindo permissões de toda a estrutura storage..."
sudo chown -R www-data:www-data storage
sudo chmod -R 775 storage
# Logs precisam ser mais permissivos para escrita
sudo chmod -R 777 storage/logs
echo "✅ Permissões corrigidas"
echo ""

# 6. Limpar cache (sem tentar escrever no log primeiro)
echo "6️⃣ Limpando cache do Laravel..."
# Remover arquivos de cache manualmente para evitar erro de log
sudo rm -rf bootstrap/cache/*.php 2>/dev/null || true
sudo rm -rf storage/framework/cache/* 2>/dev/null || true
sudo rm -rf storage/framework/views/* 2>/dev/null || true
sudo rm -rf storage/framework/sessions/* 2>/dev/null || true

# Agora tentar limpar via artisan (pode dar erro se banco estiver errado, mas não importa)
sudo -u www-data php artisan config:clear 2>/dev/null || php artisan config:clear 2>/dev/null || true
sudo -u www-data php artisan cache:clear 2>/dev/null || php artisan cache:clear 2>/dev/null || true
echo "✅ Cache limpo"
echo ""

echo "✅ Correção concluída!"
echo ""
echo "📋 Resumo:"
echo "  ✅ Permissões do log corrigidas"
echo "  ✅ Estrutura storage corrigida"
echo "  ✅ Cache limpo"
echo ""
echo "⚠️  IMPORTANTE:"
if [ -n "$DB_DATABASE" ] && [ -n "$DB_USERNAME" ]; then
    echo "  - Verifique se as credenciais do banco estão corretas no .env"
    echo "  - Se o erro de banco persistir, edite o .env e corrija as credenciais"
else
    echo "  - Configure as credenciais do banco no arquivo .env"
fi
echo ""
echo "🧪 Para testar:"
echo "  1. Verifique se consegue escrever no log:"
echo "     sudo -u www-data php -r \"file_put_contents('storage/logs/test.log', 'test');\""
echo ""
echo "  2. Teste conexão com banco:"
echo "     php artisan tinker"
echo "     DB::connection()->getPdo();"
echo "     exit"

