#!/usr/bin/expect -f

# Script completo de deploy: copia arquivos fonte e faz build no servidor
set timeout 60
set SERVER "10.102.0.103"
set PORT "63022"
set USER "darley"
set PASSWORD "yhvh77"
set WEBSITE_PATH "/var/www/lacos-website"

puts "🚀 Iniciando deploy completo..."

# Verificar se o diretório src existe no servidor, se não, criar
spawn ssh -p $PORT $USER@$SERVER "mkdir -p $WEBSITE_PATH/src/components $WEBSITE_PATH/src/services"
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
spawn scp -P $PORT website/src/components/ProductsManagement.jsx $USER@$SERVER:$WEBSITE_PATH/src/components/ProductsManagement.jsx
expect {
    "password:" {
        send "$PASSWORD\r"
        expect eof
    }
    timeout {
        puts "❌ Timeout ao copiar ProductsManagement.jsx"
        exit 1
    }
}

# Copiar supplierService.js
puts "📤 Copiando supplierService.js..."
spawn scp -P $PORT website/src/services/supplierService.js $USER@$SERVER:$WEBSITE_PATH/src/services/supplierService.js
expect {
    "password:" {
        send "$PASSWORD\r"
        expect eof
    }
    timeout {
        puts "❌ Timeout ao copiar supplierService.js"
        exit 1
    }
}

puts "✅ Arquivos copiados!"
puts ""
puts "📝 Próximos passos:"
puts "   1. Conecte ao servidor: ssh -p $PORT $USER@$SERVER"
puts "   2. Execute:"
puts "      cd $WEBSITE_PATH"
puts "      npm install  # se necessário"
puts "      npm run build"
puts "   3. Reinicie o serviço web se necessário"

