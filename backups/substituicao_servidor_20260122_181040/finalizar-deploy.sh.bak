#!/usr/bin/expect -f

# Script para finalizar o deploy no servidor
set timeout 120
set SERVER "193.203.182.22"
set PORT "63022"
set USER "darley"
set PASSWORD "yhvh77"

puts "🔧 Finalizando deploy no servidor..."

# Copiar arquivos com sudo
spawn ssh -p $PORT $USER@$SERVER "sudo cp -r ~/deploy-temp/src /var/www/lacos-website/"
expect {
    "password:" {
        send "$PASSWORD\r"
        expect eof
    }
    "sudo password" {
        send "$PASSWORD\r"
        expect eof
    }
    timeout {
        puts "❌ Timeout"
        exit 1
    }
}

puts "✅ Arquivos movidos para /var/www/lacos-website/src/"
puts ""
puts "📝 Próximos passos (execute manualmente no servidor):"
puts "   ssh -p $PORT $USER@$SERVER"
puts "   cd /var/www/lacos-website"
puts "   sudo npm install  # se necessário"
puts "   sudo npm run build"
puts "   sudo systemctl restart nginx  # ou apache2"

