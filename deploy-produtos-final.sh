#!/usr/bin/expect -f

# Script de deploy: copia arquivos para home do usuário
# Depois você precisa mover para o diretório correto com sudo

set timeout 60
set SERVER "193.203.182.22"
set PORT "63022"
set USER "darley"
set PASSWORD "yhvh77"

puts "🚀 Copiando arquivos para o servidor..."

# Criar diretório temporário no home
spawn ssh -p $PORT $USER@$SERVER "mkdir -p ~/deploy-temp/src/components ~/deploy-temp/src/services"
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
}

# Copiar ProductsManagement.jsx
puts "📤 Copiando ProductsManagement.jsx..."
spawn scp -P $PORT website/src/components/ProductsManagement.jsx $USER@$SERVER:~/deploy-temp/src/components/ProductsManagement.jsx
expect {
    "password:" {
        send "$PASSWORD\r"
        expect eof
    }
    timeout {
        puts "❌ Timeout"
        exit 1
    }
}

# Copiar supplierService.js
puts "📤 Copiando supplierService.js..."
spawn scp -P $PORT website/src/services/supplierService.js $USER@$SERVER:~/deploy-temp/src/services/supplierService.js
expect {
    "password:" {
        send "$PASSWORD\r"
        expect eof
    }
    timeout {
        puts "❌ Timeout"
        exit 1
    }
}

puts ""
puts "✅ Arquivos copiados para ~/deploy-temp/"
puts ""
puts "📝 Execute no servidor:"
puts "   ssh -p $PORT $USER@$SERVER"
puts "   sudo cp -r ~/deploy-temp/src /var/www/lacos-website/"
puts "   cd /var/www/lacos-website"
puts "   sudo npm install  # se necessário"
puts "   sudo npm run build"
puts "   sudo systemctl restart nginx  # ou apache2"

