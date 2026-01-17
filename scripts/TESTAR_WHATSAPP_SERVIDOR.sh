#!/bin/bash

# Script para testar envio de WhatsApp no servidor
SERVER="193.203.182.22"
PORT="63022"
USER="darley"
PASSWORD="yhvh77"

echo "🧪 Testando envio de WhatsApp..."
echo ""

# Criar script PHP de teste
cat > /tmp/test_whatsapp.php << 'PHP'
<?php
// Usar caminho absoluto do Laravel
$laravelPath = '/var/www/lacos-backend';
require $laravelPath . '/vendor/autoload.php';

$app = require_once $laravelPath . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\WhatsAppService;

echo "🔍 Testando WhatsAppService...\n\n";

$ws = new WhatsAppService();

// Testar conexão
echo "1. Verificando conexão...\n";
$connection = $ws->checkConnection();
var_dump($connection);
echo "\n";

// Testar envio (usar um número de teste - substitua pelo seu)
$testPhone = "5531998856741"; // Número de teste
$testMessage = "🧪 Teste de envio - Laços\n\nEsta é uma mensagem de teste do sistema.";

echo "2. Tentando enviar mensagem de teste...\n";
echo "   Telefone: $testPhone\n";
$result = $ws->sendMessage($testPhone, $testMessage);
var_dump($result);
echo "\n";

if ($result['success'] ?? false) {
    echo "✅ Mensagem enviada com sucesso!\n";
} else {
    echo "❌ Erro ao enviar: " . ($result['error'] ?? 'Erro desconhecido') . "\n";
}
PHP

# Enviar para o servidor
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
    /tmp/test_whatsapp.php \
    "$USER@$SERVER:/tmp/test_whatsapp.php"

# Executar no servidor
echo "Executando teste no servidor..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" \
    "cd /var/www/lacos-backend && echo 'yhvh77' | sudo -S -u www-data php artisan tinker < /tmp/test_whatsapp.php 2>&1 || php /tmp/test_whatsapp.php"

echo ""
echo "✅ Teste concluído!"

