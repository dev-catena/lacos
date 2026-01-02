#!/bin/bash

# Script para diagnosticar erro ao gerar atestado no backend

echo "🔍 DIAGNÓSTICO: Erro ao Gerar Atestado"
echo "========================================"
echo ""

# Verificar se está no servidor
if [ ! -d "/var/www/lacos-backend" ]; then
    echo "❌ Este script deve ser executado no servidor (193.203.182.22)"
    echo "   Execute: ssh -p 63022 root@193.203.182.22"
    exit 1
fi

cd /var/www/lacos-backend || exit 1

echo "1️⃣ Verificando se PDFService existe..."
if [ -f "app/Services/PDFService.php" ]; then
    echo "✅ PDFService.php encontrado"
else
    echo "❌ PDFService.php NÃO encontrado!"
    echo "   Execute o script de instalação da telemedicina"
    exit 1
fi

echo ""
echo "2️⃣ Verificando se DigitalSignatureService existe..."
if [ -f "app/Services/DigitalSignatureService.php" ]; then
    echo "✅ DigitalSignatureService.php encontrado"
else
    echo "❌ DigitalSignatureService.php NÃO encontrado!"
    echo "   Execute o script de instalação da telemedicina"
    exit 1
fi

echo ""
echo "3️⃣ Verificando se template Blade existe..."
if [ -f "resources/views/prescriptions/certificate.blade.php" ]; then
    echo "✅ Template certificate.blade.php encontrado"
else
    echo "❌ Template certificate.blade.php NÃO encontrado!"
    echo "   Execute o script de instalação da telemedicina"
    exit 1
fi

echo ""
echo "4️⃣ Verificando dependências do Composer..."
if composer show barryvdh/laravel-dompdf 2>/dev/null | grep -q "name"; then
    echo "✅ barryvdh/laravel-dompdf instalado"
else
    echo "❌ barryvdh/laravel-dompdf NÃO instalado!"
    echo "   Execute: composer require barryvdh/laravel-dompdf"
fi

if composer show simplesoftwareio/simple-qrcode 2>/dev/null | grep -q "name"; then
    echo "✅ simplesoftwareio/simple-qrcode instalado"
else
    echo "❌ simplesoftwareio/simple-qrcode NÃO instalado!"
    echo "   Execute: composer require simplesoftwareio/simple-qrcode"
fi

echo ""
echo "5️⃣ Verificando diretórios necessários..."
if [ -d "storage/app/temp" ]; then
    echo "✅ Diretório storage/app/temp existe"
    if [ -w "storage/app/temp" ]; then
        echo "✅ Diretório storage/app/temp tem permissão de escrita"
    else
        echo "❌ Diretório storage/app/temp NÃO tem permissão de escrita!"
        echo "   Execute: chmod -R 775 storage/app/temp"
    fi
else
    echo "❌ Diretório storage/app/temp NÃO existe!"
    echo "   Execute: mkdir -p storage/app/temp && chmod -R 775 storage/app/temp"
fi

if [ -d "storage/app/public/documents/certificates" ]; then
    echo "✅ Diretório storage/app/public/documents/certificates existe"
else
    echo "⚠️  Diretório storage/app/public/documents/certificates NÃO existe"
    echo "   Execute: mkdir -p storage/app/public/documents/certificates"
fi

echo ""
echo "6️⃣ Verificando PrescriptionController..."
if grep -q "generateSignedCertificate" app/Http/Controllers/Api/PrescriptionController.php 2>/dev/null; then
    echo "✅ Método generateSignedCertificate encontrado no controller"
else
    echo "❌ Método generateSignedCertificate NÃO encontrado no controller!"
fi

echo ""
echo "7️⃣ Verificando rotas da API..."
if grep -q "generate-signed-certificate" routes/api.php 2>/dev/null; then
    echo "✅ Rota generate-signed-certificate encontrada"
else
    echo "❌ Rota generate-signed-certificate NÃO encontrada!"
fi

echo ""
echo "8️⃣ Verificando último erro no log..."
echo "─────────────────────────────────────────────────────────"
tail -100 storage/logs/laravel.log | grep -A 30 "generateSignedCertificate\|generate-signed-certificate\|PDFService\|DigitalSignatureService\|certificate.blade" | tail -50

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "💡 PRÓXIMOS PASSOS:"
echo ""
echo "1. Se algum arquivo estiver faltando, execute:"
echo "   ./scripts/INSTALAR_TELEMEDICINA_BACKEND.sh"
echo ""
echo "2. Se as dependências estiverem faltando, execute:"
echo "   composer require barryvdh/laravel-dompdf"
echo "   composer require simplesoftwareio/simple-qrcode"
echo ""
echo "3. Se os diretórios estiverem faltando, execute:"
echo "   mkdir -p storage/app/temp"
echo "   mkdir -p storage/app/public/documents/certificates"
echo "   chmod -R 775 storage/app/temp"
echo "   chmod -R 775 storage/app/public/documents"
echo ""
echo "4. Limpar cache do Laravel:"
echo "   php artisan config:clear"
echo "   php artisan cache:clear"
echo "   php artisan view:clear"
echo ""
echo "5. Verificar o erro completo no log:"
echo "   tail -500 storage/logs/laravel.log | grep -A 50 'local.ERROR' | tail -80"
echo "═══════════════════════════════════════════════════════════"










