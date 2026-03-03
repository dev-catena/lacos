#!/usr/bin/expect -f

# Script de deploy: build local + deploy dos arquivos buildados
set timeout 300
set SERVER "192.168.0.20"
set PORT "63022"
set USER "darley"
set PASSWORD "yhvh77"
set LOCAL_PATH "/Users/darley/lacos/website"
set REMOTE_PATH "/var/www/lacos-website"

puts "🚀 Iniciando deploy de produção..."
puts ""

# Passo 1: Fazer build local
puts "📦 Passo 1: Fazendo build local..."
puts "   cd $LOCAL_PATH && npm run build"
puts ""

spawn bash -c "cd $LOCAL_PATH && npm run build"
expect {
    timeout {
        puts "⏱️  Build em andamento..."
    }
    eof {
        puts "✅ Build concluído!"
    }
}

# Aguardar build terminar
set timeout 60
expect eof

# Verificar se a pasta dist foi criada
spawn bash -c "test -d $LOCAL_PATH/dist && echo 'OK' || echo 'ERRO'"
expect eof
set build_result $expect_out(buffer)

if {[string match "*ERRO*" $build_result]} {
    puts "❌ Erro: Pasta dist não encontrada após build"
    puts "   Verifique se o build foi concluído com sucesso"
    exit 1
}

puts "✅ Build local concluído!"
puts ""

# Passo 2: Fazer backup no servidor (opcional)
puts "💾 Passo 2: Fazendo backup no servidor..."
spawn ssh -p $PORT $USER@$SERVER "sudo cp -r $REMOTE_PATH $REMOTE_PATH.backup.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo 'Backup opcional'"
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

puts "✅ Backup criado (se aplicável)"
puts ""

# Passo 3: Copiar arquivos buildados para o servidor
puts "📤 Passo 3: Enviando arquivos buildados para o servidor..."
puts "   Isso pode levar alguns minutos..."
puts ""

# Criar diretório temporário no servidor
spawn ssh -p $PORT $USER@$SERVER "mkdir -p ~/deploy-dist"
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

# Copiar toda a pasta dist
spawn scp -P $PORT -r $LOCAL_PATH/dist/* $USER@$SERVER:~/deploy-dist/
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

puts "✅ Arquivos enviados!"
puts ""

# Passo 4: Mover arquivos para o diretório de produção
puts "🔧 Passo 4: Movendo arquivos para produção..."
puts ""
puts "⚠️  ATENÇÃO: Execute manualmente no servidor:"
puts "   ssh -p $PORT $USER@$SERVER"
puts "   sudo rm -rf $REMOTE_PATH/*"
puts "   sudo cp -r ~/deploy-dist/* $REMOTE_PATH/"
puts "   sudo chown -R www-data:www-data $REMOTE_PATH"
puts "   sudo systemctl restart nginx  # ou apache2"
puts ""

puts "✅ Deploy concluído!"
puts ""
puts "📝 Resumo:"
puts "   - Build local: ✅"
puts "   - Arquivos enviados para: ~/deploy-dist no servidor"
puts "   - Próximo passo: Execute os comandos acima no servidor"

