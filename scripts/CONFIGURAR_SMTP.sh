#!/bin/bash

# Script para configurar SMTP no Laravel
# Execute no servidor

set -e

cd /var/www/lacos-backend

echo "📧 Configurando SMTP para envio de emails..."
echo ""

# Fazer backup do .env
if [ -f .env ]; then
    sudo cp .env .env.backup.$(date +%s) 2>/dev/null || cp .env .env.backup.$(date +%s)
    echo "✅ Backup do .env criado"
fi

# Verificar se já existe configuração de email
if grep -q "^MAIL_MAILER=" .env 2>/dev/null; then
    echo "⚠️  Configuração de email já existe no .env"
    echo "   Editando configurações existentes..."
    
    # Atualizar configurações existentes
    sed -i 's/^MAIL_MAILER=.*/MAIL_MAILER=smtp/' .env
    sed -i 's/^MAIL_HOST=.*/MAIL_HOST=smtp.gmail.com/' .env
    sed -i 's/^MAIL_PORT=.*/MAIL_PORT=587/' .env
    sed -i 's/^MAIL_USERNAME=.*/MAIL_USERNAME=seu-email@gmail.com/' .env
    sed -i 's/^MAIL_PASSWORD=.*/MAIL_PASSWORD=sua-senha-app/' .env
    sed -i 's/^MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=tls/' .env
    sed -i 's/^MAIL_FROM_ADDRESS=.*/MAIL_FROM_ADDRESS=noreply@lacos.com/' .env
    sed -i 's/^MAIL_FROM_NAME=.*/MAIL_FROM_NAME="${APP_NAME}"/' .env
else
    echo "   Adicionando configurações de email..."
    
    # Criar arquivo temporário com configurações
    TEMP_ENV=$(mktemp)
    cat .env > "$TEMP_ENV"
    cat >> "$TEMP_ENV" << 'EOF'

# ==================== CONFIGURAÇÃO DE EMAIL SMTP ====================
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-app
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@lacos.com
MAIL_FROM_NAME="${APP_NAME}"
EOF
    sudo mv "$TEMP_ENV" .env
    sudo chown www-data:www-data .env
fi

echo ""
echo "✅ Configurações SMTP adicionadas ao .env"
echo ""
echo "⚠️  IMPORTANTE - PRÓXIMOS PASSOS:"
echo ""
echo "1️⃣  Edite o arquivo .env e configure:"
echo "   - MAIL_USERNAME: Seu email Gmail"
echo "   - MAIL_PASSWORD: Senha de app do Gmail (NÃO use senha normal)"
echo ""
echo "2️⃣  Para criar senha de app do Gmail:"
echo "   a) Acesse: https://myaccount.google.com/apppasswords"
echo "   b) Selecione 'App' e 'Mail'"
echo "   c) Gere a senha e use no MAIL_PASSWORD"
echo ""
echo "3️⃣  Limpar cache:"
echo "   php artisan config:clear"
echo ""
echo "4️⃣  Testar envio de email:"
echo "   php artisan tinker"
echo "   Mail::raw('Teste', function(\$m) { \$m->to('seu-email@teste.com')->subject('Teste'); });"
echo ""
echo "📝 Para outros provedores:"
echo "   - Outlook: MAIL_HOST=smtp-mail.outlook.com"
echo "   - SendGrid: MAIL_HOST=smtp.sendgrid.net, MAIL_USERNAME=apikey"
echo "   - Mailgun: Use driver mailgun (requer pacote adicional)"
echo ""

