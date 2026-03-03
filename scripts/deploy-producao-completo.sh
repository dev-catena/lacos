#!/bin/bash

# Script de deploy completo: build local + deploy para produção
# Uso: ./deploy-producao-completo.sh

set -e  # Parar em caso de erro

SERVER="192.168.0.20"
PORT="63022"
USER="darley"
PASSWORD="yhvh77"
LOCAL_PATH="/Users/darley/lacos/website"
REMOTE_PATH="/var/www/lacos-website"
BUILD_DIR="$LOCAL_PATH/dist"

echo "🚀 Iniciando deploy de produção..."
echo ""

# Passo 1: Verificar se estamos no diretório correto
if [ ! -f "$LOCAL_PATH/package.json" ]; then
    echo "❌ Erro: package.json não encontrado em $LOCAL_PATH"
    exit 1
fi

# Passo 2: Instalar dependências se necessário
echo "📦 Passo 1: Verificando dependências..."
cd "$LOCAL_PATH"
if [ ! -d "node_modules" ]; then
    echo "   Instalando dependências..."
    npm install
else
    echo "   ✅ Dependências já instaladas"
fi
echo ""

# Passo 3: Fazer build
echo "🔨 Passo 2: Fazendo build local..."
npm run build

if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Erro: Build falhou - pasta dist não encontrada"
    exit 1
fi

echo "✅ Build concluído!"
echo "   Arquivos gerados em: $BUILD_DIR"
echo ""

# Passo 4: Criar arquivo com comandos para executar no servidor
echo "📝 Passo 3: Preparando comandos para o servidor..."
cat > /tmp/deploy-commands.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
# Comandos para executar no servidor

REMOTE_PATH="/var/www/lacos-website"
DEPLOY_DIR="/tmp/lacos-deploy"

echo "🔧 Movendo arquivos para produção..."

# Fazer backup
if [ -d "$REMOTE_PATH" ]; then
    echo "💾 Criando backup..."
    sudo cp -r "$REMOTE_PATH" "${REMOTE_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Limpar diretório de produção
echo "🧹 Limpando diretório de produção..."
sudo rm -rf "$REMOTE_PATH"/*

# Copiar novos arquivos
echo "📤 Copiando novos arquivos..."
sudo cp -r "$DEPLOY_DIR"/* "$REMOTE_PATH/"

# Ajustar permissões
echo "🔐 Ajustando permissões..."
sudo chown -R www-data:www-data "$REMOTE_PATH"

# Limpar arquivos temporários
echo "🧹 Limpando arquivos temporários..."
sudo rm -rf "$DEPLOY_DIR"

echo "✅ Deploy concluído!"
echo ""
echo "🔄 Reinicie o serviço web:"
echo "   sudo systemctl restart nginx"
echo "   # ou"
echo "   sudo systemctl restart apache2"
DEPLOY_SCRIPT

echo "✅ Script de deploy criado em /tmp/deploy-commands.sh"
echo ""

# Passo 5: Enviar arquivos para o servidor
echo "📤 Passo 4: Enviando arquivos buildados para o servidor..."
echo "   Isso pode levar alguns minutos..."
echo ""

# Usar expect para automação
expect << EOF
set timeout 300
spawn ssh -p $PORT $USER@$SERVER "rm -rf /tmp/lacos-deploy && mkdir -p /tmp/lacos-deploy && chmod 777 /tmp/lacos-deploy"
expect {
    "password:" {
        send "$PASSWORD\r"
        expect eof
    }
    "yes/no" {
        send "yes\r"
        expect "password:"
        send "$PASSWORD\r"
        expect eof
    }
    eof
}

# Copiar arquivos (usar tar para evitar problemas com wildcards)
spawn bash -c "cd $BUILD_DIR && tar czf - ." | ssh -p $PORT $USER@$SERVER "cd /tmp/lacos-deploy && tar xzf -"
expect {
    "password:" {
        send "$PASSWORD\r"
        expect {
            timeout {
                puts "⏱️  Upload em andamento..."
            }
            eof
        }
    }
    "yes/no" {
        send "yes\r"
        expect "password:"
        send "$PASSWORD\r"
        expect {
            timeout {
                puts "⏱️  Upload em andamento..."
            }
            eof
        }
    }
    timeout {
        puts "⏱️  Upload em andamento (pode levar alguns minutos)..."
        expect eof
    }
    eof
}

# Enviar script de deploy
spawn scp -P $PORT /tmp/deploy-commands.sh $USER@$SERVER:~/deploy-commands.sh
expect {
    "password:" {
        send "$PASSWORD\r"
        expect eof
    }
    eof
}
EOF

echo ""
echo "✅ Arquivos enviados para /tmp/lacos-deploy no servidor!"
echo ""

# Passo 6: Instruções finais
echo "📝 Passo 5: Finalizar deploy no servidor"
echo ""
echo "Execute os seguintes comandos no servidor:"
echo ""
echo "   ssh -p $PORT $USER@$SERVER"
echo "   chmod +x ~/deploy-commands.sh"
echo "   ~/deploy-commands.sh"
echo ""
echo "Ou execute manualmente:"
echo "   sudo rm -rf $REMOTE_PATH/*"
echo "   sudo cp -r /tmp/lacos-deploy/* $REMOTE_PATH/"
echo "   sudo chown -R www-data:www-data $REMOTE_PATH"
echo "   sudo rm -rf /tmp/lacos-deploy"
echo "   sudo systemctl restart nginx"
echo ""
echo "✅ Deploy preparado com sucesso!"
echo ""

