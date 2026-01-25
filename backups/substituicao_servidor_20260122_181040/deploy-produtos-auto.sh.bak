#!/usr/bin/expect -f

# Script de deploy automático usando expect
# Uso: ./deploy-produtos-auto.sh

set SERVER "193.203.182.22"
set PORT "63022"
set USER "darley"
set PASSWORD "yhvh77"
set TIMEOUT 30

# Arquivos a copiar
set FILES {
    "website/src/components/ProductsManagement.jsx"
    "website/src/services/supplierService.js"
}

puts "🚀 Iniciando deploy automático..."

# Copiar ProductsManagement.jsx
spawn scp -P $PORT website/src/components/ProductsManagement.jsx $USER@$SERVER:/var/www/lacos-website/src/components/ProductsManagement.jsx
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
    timeout {
        puts "Timeout ao copiar ProductsManagement.jsx"
        exit 1
    }
}

# Copiar supplierService.js
spawn scp -P $PORT website/src/services/supplierService.js $USER@$SERVER:/var/www/lacos-website/src/services/supplierService.js
expect {
    "password:" {
        send "$PASSWORD\r"
        expect eof
    }
    timeout {
        puts "Timeout ao copiar supplierService.js"
        exit 1
    }
}

puts "✅ Arquivos copiados com sucesso!"
puts ""
puts "📝 Próximos passos:"
puts "   1. Conecte ao servidor: ssh -p $PORT $USER@$SERVER"
puts "   2. Execute: cd /var/www/lacos-website && npm run build"
puts "   3. Reinicie o serviço web se necessário"

