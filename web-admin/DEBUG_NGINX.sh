#!/bin/bash

# Script para debugar problemas do Nginx
SERVER="193.203.182.22"
USER="darley"
PASSWORD="yhvh77"

echo "🔍 Debug detalhado do Nginx..."
echo ""

echo "1️⃣ Verificando todos os server blocks ativos..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    echo 'Arquivos em sites-enabled:'
    ls -la /etc/nginx/sites-enabled/
    echo ''
    echo 'Conteúdo de todos os server blocks ativos:'
    for file in /etc/nginx/sites-enabled/*; do
        echo '---' \$file '---'
        cat \$file 2>/dev/null | grep -A 5 'server_name' || echo 'Erro ao ler'
        echo ''
    done
"

echo ""
echo "2️⃣ Verificando qual server block está respondendo na porta 80..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    export SUDO_PASS='$PASSWORD'
    echo 'Testando resposta do Nginx:'
    echo \"\$SUDO_PASS\" | sudo -S nginx -T 2>/dev/null | grep -A 10 'server_name.*admin.lacosapp.com' || echo 'Não encontrado'
"

echo ""
echo "3️⃣ Testando acesso local no servidor..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    echo 'Teste 1: Acessando com Host admin.lacosapp.com:'
    curl -H 'Host: admin.lacosapp.com' http://localhost -I 2>&1 | head -10
    echo ''
    echo 'Teste 2: Acessando diretamente pelo IP:'
    curl http://localhost -I -H 'Host: admin.lacosapp.com' 2>&1 | head -10
    echo ''
    echo 'Teste 3: Acessando sem Host header:'
    curl http://localhost -I 2>&1 | head -10
"

echo ""
echo "4️⃣ Verificando firewall..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    echo 'Status do UFW:'
    export SUDO_PASS='$PASSWORD'
    echo \"\$SUDO_PASS\" | sudo -S ufw status 2>&1 || echo 'UFW não instalado ou não ativo'
    echo ''
    echo 'Portas 80 e 443 abertas?'
    echo \"\$SUDO_PASS\" | sudo -S netstat -tlnp 2>/dev/null | grep -E ':(80|443)' || ss -tlnp | grep -E ':(80|443)'
"

echo ""
echo "5️⃣ Verificando logs de acesso recentes..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    export SUDO_PASS='$PASSWORD'
    echo 'Últimas 10 linhas do log de acesso:'
    echo \"\$SUDO_PASS\" | sudo -S tail -10 /var/log/nginx/admin-lacosapp-access.log 2>/dev/null || echo 'Nenhum acesso registrado ainda'
    echo ''
    echo 'Últimas 10 linhas do log de erro:'
    echo \"\$SUDO_PASS\" | sudo -S tail -10 /var/log/nginx/admin-lacosapp-error.log 2>/dev/null || echo 'Nenhum erro'
"

echo ""
echo "6️⃣ Verificando se há algum problema no nginx.conf principal..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    export SUDO_PASS='$PASSWORD'
    echo 'Configuração include de sites-enabled:'
    echo \"\$SUDO_PASS\" | sudo -S grep -r 'include.*sites-enabled' /etc/nginx/ 2>/dev/null | head -5
"

echo ""
echo "✅ Debug concluído!"


