#!/bin/bash

# Script completo para diagnosticar o erro de geração de PDF

set -e

echo "🔍 DIAGNÓSTICO COMPLETO: ERRO DE GERAÇÃO DE PDF"
echo "================================================"
echo ""

BACKEND_PATH="/var/www/lacos-backend"
TEMP_DIR="${BACKEND_PATH}/storage/app/temp"
PDF_SERVICE="${BACKEND_PATH}/app/Services/PdfService.php"
CONTROLLER="${BACKEND_PATH}/app/Http/Controllers/Api/PrescriptionController.php"
LOG_FILE="${BACKEND_PATH}/storage/logs/laravel.log"

echo "📋 Verificando componentes..."
echo ""

# 1. Verificar diretório temp
echo "1️⃣ Diretório temp:"
if [ -d "$TEMP_DIR" ]; then
    echo "   ✅ Existe: $TEMP_DIR"
    ls -la "$TEMP_DIR" | head -5
    echo ""
    echo "   Testando escrita..."
    TEST_FILE="${TEMP_DIR}/test_$(date +%s).txt"
    if touch "$TEST_FILE" 2>/dev/null; then
        echo "   ✅ Escrita funcionando"
        rm -f "$TEST_FILE"
    else
        echo "   ❌ ERRO: Não é possível escrever no diretório"
        echo "   Permissões:"
        ls -ld "$TEMP_DIR"
    fi
else
    echo "   ❌ Diretório não existe: $TEMP_DIR"
fi
echo ""

# 2. Verificar PdfService
echo "2️⃣ PdfService.php:"
if [ -f "$PDF_SERVICE" ]; then
    echo "   ✅ Arquivo existe: $PDF_SERVICE"
    echo "   Permissões:"
    ls -l "$PDF_SERVICE"
    echo ""
    echo "   Verificando método generateCertificatePDF:"
    if grep -q "function generateCertificatePDF" "$PDF_SERVICE"; then
        echo "   ✅ Método encontrado"
        
        # Verificar se tem verificação de arquivo
        if grep -q "file_exists.*fullPath\|arquivo não foi criado" "$PDF_SERVICE"; then
            echo "   ✅ Verificação de arquivo existe"
        else
            echo "   ⚠️  Verificação de arquivo NÃO encontrada"
        fi
        
        # Mostrar o método
        echo ""
        echo "   Conteúdo do método:"
        grep -A 50 "function generateCertificatePDF" "$PDF_SERVICE" | head -55
    else
        echo "   ❌ Método generateCertificatePDF NÃO encontrado"
    fi
else
    echo "   ❌ Arquivo NÃO existe: $PDF_SERVICE"
    echo "   Procurando em outros locais:"
    find "$BACKEND_PATH" -name "*PdfService*" -o -name "*PDFService*" 2>/dev/null | head -5
fi
echo ""

# 3. Verificar PrescriptionController
echo "3️⃣ PrescriptionController:"
if [ -f "$CONTROLLER" ]; then
    echo "   ✅ Arquivo existe: $CONTROLLER"
    echo ""
    echo "   Verificando uso do pdfService:"
    if grep -q "pdfService\|PDFService" "$CONTROLLER"; then
        echo "   ✅ pdfService está sendo usado"
        echo ""
        echo "   Como está sendo chamado:"
        grep -B 5 -A 10 "generateCertificatePDF\|pdfService" "$CONTROLLER" | head -20
    else
        echo "   ⚠️  pdfService NÃO encontrado no controller"
    fi
    
    echo ""
    echo "   Verificando método generateSignedCertificate:"
    if grep -q "function generateSignedCertificate" "$CONTROLLER"; then
        echo "   ✅ Método encontrado"
        echo ""
        echo "   Conteúdo do método:"
        grep -A 80 "function generateSignedCertificate" "$CONTROLLER" | head -85
    else
        echo "   ❌ Método generateSignedCertificate NÃO encontrado"
    fi
else
    echo "   ❌ Controller não existe: $CONTROLLER"
    echo "   Procurando:"
    find "$BACKEND_PATH" -name "*PrescriptionController*" 2>/dev/null | head -5
fi
echo ""

# 4. Verificar templates Blade
echo "4️⃣ Templates Blade:"
TEMPLATE_RECIPE="${BACKEND_PATH}/resources/views/prescriptions/recipe.blade.php"
TEMPLATE_CERT="${BACKEND_PATH}/resources/views/prescriptions/certificate.blade.php"

if [ -f "$TEMPLATE_CERT" ]; then
    echo "   ✅ Template certificate.blade.php existe"
else
    echo "   ❌ Template certificate.blade.php NÃO existe: $TEMPLATE_CERT"
fi

if [ -f "$TEMPLATE_RECIPE" ]; then
    echo "   ✅ Template recipe.blade.php existe"
else
    echo "   ⚠️  Template recipe.blade.php NÃO existe"
fi
echo ""

# 5. Verificar logs recentes
echo "5️⃣ Logs do Laravel (últimas 20 linhas relacionadas a PDF):"
if [ -f "$LOG_FILE" ]; then
    echo "   ✅ Arquivo de log existe"
    echo ""
    echo "   Últimas linhas relacionadas a PDF/certificate:"
    grep -i "pdf\|certificate\|temp\|storage" "$LOG_FILE" | tail -20 || echo "   (nenhuma entrada encontrada)"
else
    echo "   ⚠️  Arquivo de log não existe: $LOG_FILE"
fi
echo ""

# 6. Verificar permissões do storage
echo "6️⃣ Permissões do storage:"
if [ -d "${BACKEND_PATH}/storage" ]; then
    echo "   Estrutura:"
    ls -ld "${BACKEND_PATH}/storage"
    ls -ld "${BACKEND_PATH}/storage/app"
    ls -ld "${BACKEND_PATH}/storage/app/temp" 2>/dev/null || echo "   ⚠️  temp não existe"
    
    # Verificar usuário do web server
    if id "www-data" &>/dev/null; then
        echo ""
        echo "   Testando como www-data:"
        sudo -u www-data touch "${TEMP_DIR}/test_wwwdata_$(date +%s).txt" 2>/dev/null && echo "   ✅ www-data pode escrever" || echo "   ❌ www-data NÃO pode escrever"
    fi
fi
echo ""

# 7. Verificar espaço em disco
echo "7️⃣ Espaço em disco:"
df -h "$BACKEND_PATH" | tail -1
echo ""

# 8. Verificar se DomPDF está instalado
echo "8️⃣ Verificando dependências PHP:"
if [ -f "${BACKEND_PATH}/composer.json" ]; then
    if grep -q "barryvdh/laravel-dompdf" "${BACKEND_PATH}/composer.json"; then
        echo "   ✅ DomPDF está no composer.json"
    else
        echo "   ⚠️  DomPDF NÃO está no composer.json"
    fi
    
    if grep -q "simplesoftwareio/simple-qrcode" "${BACKEND_PATH}/composer.json"; then
        echo "   ✅ QRCode está no composer.json"
    else
        echo "   ⚠️  QRCode NÃO está no composer.json"
    fi
else
    echo "   ⚠️  composer.json não encontrado"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "✅ DIAGNÓSTICO CONCLUÍDO"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "💡 Próximos passos baseados no diagnóstico acima:"
echo ""










