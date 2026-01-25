#!/bin/bash

# Script para testar envio de email no Laravel
# Uso: ./testar_email.sh [email-destino]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do backend
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BACKEND_DIR"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  📧 Teste de Envio de Email - Laços${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar se email foi fornecido
if [ -z "$1" ]; then
    echo -e "${YELLOW}⚠️  Email de destino não fornecido${NC}"
    echo ""
    echo "Uso: $0 <email-destino>"
    echo ""
    echo "Exemplo:"
    echo "  $0 seu-email@gmail.com"
    echo "  $0 coroneldarley@gmail.com"
    echo ""
    exit 1
fi

EMAIL_DESTINO="$1"

# Validar formato de email básico
if [[ ! "$EMAIL_DESTINO" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${RED}❌ Email inválido: $EMAIL_DESTINO${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Verificando configuração de email...${NC}"
echo ""

# Verificar configurações de email
MAIL_MAILER=$(php artisan tinker --execute="echo config('mail.default');" 2>/dev/null | tail -1 | tr -d ' ')
MAIL_HOST=$(php artisan tinker --execute="echo config('mail.mailers.smtp.host');" 2>/dev/null | tail -1 | tr -d ' ')
MAIL_PORT=$(php artisan tinker --execute="echo config('mail.mailers.smtp.port');" 2>/dev/null | tail -1 | tr -d ' ')
MAIL_USERNAME=$(php artisan tinker --execute="echo config('mail.mailers.smtp.username');" 2>/dev/null | tail -1 | tr -d ' ')
MAIL_FROM=$(php artisan tinker --execute="echo config('mail.from.address');" 2>/dev/null | tail -1 | tr -d ' ')

echo -e "  ${BLUE}Driver:${NC} $MAIL_MAILER"
echo -e "  ${BLUE}Host:${NC} $MAIL_HOST"
echo -e "  ${BLUE}Port:${NC} $MAIL_PORT"
echo -e "  ${BLUE}Username:${NC} ${MAIL_USERNAME:-'(não configurado)'}"
echo -e "  ${BLUE}From:${NC} $MAIL_FROM"
echo ""

# Aviso se driver for 'log'
if [ "$MAIL_MAILER" = "log" ]; then
    echo -e "${YELLOW}⚠️  ATENÇÃO: Driver configurado como 'log'${NC}"
    echo -e "${YELLOW}   O email NÃO será enviado, apenas logado em storage/logs/laravel.log${NC}"
    echo ""
    read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}Teste cancelado. Configure SMTP no .env para enviar emails reais.${NC}"
        exit 0
    fi
fi

echo -e "${BLUE}📤 Enviando email de teste...${NC}"
echo -e "  ${BLUE}Destino:${NC} $EMAIL_DESTINO"
echo ""

# Criar script PHP temporário para testar email
TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << 'PHPSCRIPT'
<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;

$emailDestino = $argv[1];

try {
    echo "Tentando enviar email para: $emailDestino\n";
    
    Mail::raw('Este é um email de teste do sistema Laços.

Se você recebeu este email, significa que a configuração de SMTP está funcionando corretamente.

Data/Hora: ' . date('d/m/Y H:i:s') . '

Atenciosamente,
Sistema Laços', function ($message) use ($emailDestino) {
        $message->to($emailDestino)
                ->subject('✅ Teste de Email - Laços');
    });
    
    echo "SUCCESS\n";
    echo "Email enviado com sucesso!\n";
} catch (\Exception $e) {
    echo "ERROR\n";
    echo "Erro: " . $e->getMessage() . "\n";
    exit(1);
}
PHPSCRIPT

# Executar script PHP
if php "$TEMP_SCRIPT" "$EMAIL_DESTINO" 2>&1 | tee /tmp/email_test_output.txt; then
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ Email enviado com sucesso!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}📬 Próximos passos:${NC}"
    echo "  1. Verifique a caixa de entrada de: $EMAIL_DESTINO"
    echo "  2. Verifique também a pasta de SPAM/Lixo Eletrônico"
    echo "  3. Se não recebeu, verifique os logs:"
    echo "     tail -f storage/logs/laravel.log | grep -i mail"
    echo ""
    
    if [ "$MAIL_MAILER" = "log" ]; then
        echo -e "${YELLOW}⚠️  Lembre-se: Como o driver é 'log', o email foi apenas logado.${NC}"
        echo -e "${YELLOW}   Para enviar emails reais, configure SMTP no .env${NC}"
        echo ""
        echo "   Verifique o log em: storage/logs/laravel.log"
    fi
else
    echo ""
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ❌ Erro ao enviar email${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Possíveis causas:${NC}"
    echo "  1. Credenciais SMTP incorretas (MAIL_USERNAME/MAIL_PASSWORD)"
    echo "  2. Porta bloqueada pelo firewall"
    echo "  3. Servidor SMTP inacessível"
    echo "  4. Senha de app do Gmail expirada ou inválida"
    echo ""
    echo -e "${BLUE}Verificar logs:${NC}"
    echo "  tail -50 storage/logs/laravel.log | grep -i 'mail\|email\|smtp\|error'"
    echo ""
    echo -e "${BLUE}Verificar configuração:${NC}"
    echo "  php artisan tinker --execute=\"echo json_encode(['driver' => config('mail.default'), 'host' => config('mail.mailers.smtp.host'), 'port' => config('mail.mailers.smtp.port')], JSON_PRETTY_PRINT);\""
    echo ""
    
    # Mostrar últimos erros do log
    if [ -f "storage/logs/laravel.log" ]; then
        echo -e "${BLUE}Últimos erros relacionados a email:${NC}"
        tail -100 storage/logs/laravel.log | grep -i "mail\|email\|smtp\|error\|exception" | tail -5 || echo "  (nenhum erro encontrado)"
        echo ""
    fi
fi

# Limpar arquivo temporário
rm -f "$TEMP_SCRIPT"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"


