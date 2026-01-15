#!/bin/bash

# Script para corrigir namespace do PdfService

set -e

echo "🔧 CORRIGINDO NAMESPACE DO PDFSERVICE"
echo "======================================"
echo ""

BACKEND_PATH="/var/www/lacos-backend"
SERVICE_FILE="${BACKEND_PATH}/app/Services/PdfService.php"
CONTROLLER_FILE="${BACKEND_PATH}/app/Http/Controllers/Api/PrescriptionController.php"

cd "$BACKEND_PATH" || exit 1

echo "1️⃣ Verificando nome da classe no PdfService.php..."
if grep -q "^class PDFService" "$SERVICE_FILE"; then
    echo "   ⚠️  Classe é PDFService (maiúsculas)"
    ACTUAL_CLASS="PDFService"
elif grep -q "^class PdfService" "$SERVICE_FILE"; then
    echo "   ✅ Classe é PdfService (camelCase)"
    ACTUAL_CLASS="PdfService"
else
    echo "   ❌ Não foi possível determinar o nome da classe"
    exit 1
fi

echo ""
echo "2️⃣ Verificando namespace usado no Controller..."
if grep -q "use App\\\\Services\\\\PDFService" "$CONTROLLER_FILE"; then
    echo "   ⚠️  Controller usa PDFService (maiúsculas)"
    CONTROLLER_USE="PDFService"
elif grep -q "use App\\\\Services\\\\PdfService" "$CONTROLLER_FILE"; then
    echo "   ✅ Controller usa PdfService (camelCase)"
    CONTROLLER_USE="PdfService"
else
    echo "   ⚠️  Não encontrado use statement, procurando..."
    grep -i "pdfservice\|pdf_service" "$CONTROLLER_FILE" | head -3
    CONTROLLER_USE=""
fi

echo ""
echo "3️⃣ Verificando tipo hint no construtor..."
if grep -q "function __construct(PDFService" "$CONTROLLER_FILE"; then
    echo "   ⚠️  Construtor usa PDFService (maiúsculas)"
    CONSTRUCTOR_TYPE="PDFService"
elif grep -q "function __construct(PdfService" "$CONTROLLER_FILE"; then
    echo "   ✅ Construtor usa PdfService (camelCase)"
    CONSTRUCTOR_TYPE="PdfService"
else
    echo "   ⚠️  Não encontrado construtor"
    CONSTRUCTOR_TYPE=""
fi

echo ""
echo "4️⃣ Corrigindo inconsistências..."

# Se a classe é PdfService mas o controller usa PDFService, corrigir
if [ "$ACTUAL_CLASS" = "PdfService" ] && [ "$CONTROLLER_USE" = "PDFService" ]; then
    echo "   ⚠️  Inconsistência encontrada! Corrigindo..."
    sed -i 's/use App\\Services\\PDFService;/use App\\Services\\PdfService;/g' "$CONTROLLER_FILE"
    sed -i 's/function __construct(PDFService/function __construct(PdfService/g' "$CONTROLLER_FILE"
    echo "   ✅ Corrigido: Controller agora usa PdfService"
fi

# Se a classe é PDFService mas o controller usa PdfService, corrigir
if [ "$ACTUAL_CLASS" = "PDFService" ] && [ "$CONTROLLER_USE" = "PdfService" ]; then
    echo "   ⚠️  Inconsistência encontrada! Corrigindo..."
    sed -i 's/use App\\Services\\PdfService;/use App\\Services\\PDFService;/g' "$CONTROLLER_FILE"
    sed -i 's/function __construct(PdfService/function __construct(PDFService/g' "$CONTROLLER_FILE"
    echo "   ✅ Corrigido: Controller agora usa PDFService"
fi

# Garantir que a classe no arquivo está correta (usar PdfService como padrão)
if [ "$ACTUAL_CLASS" = "PDFService" ]; then
    echo "   ⚠️  Renomeando classe para PdfService (padrão Laravel)..."
    sed -i 's/^class PDFService/class PdfService/g' "$SERVICE_FILE"
    echo "   ✅ Classe renomeada para PdfService"
    
    # Atualizar controller também
    sed -i 's/use App\\Services\\PDFService;/use App\\Services\\PdfService;/g' "$CONTROLLER_FILE"
    sed -i 's/function __construct(PDFService/function __construct(PdfService/g' "$CONTROLLER_FILE"
    echo "   ✅ Controller atualizado"
fi

echo ""
echo "5️⃣ Verificando se há problemas no método generateCertificatePDF..."
# Verificar se o método está retornando o path corretamente
if grep -A 50 "function generateCertificatePDF" "$SERVICE_FILE" | grep -q "return \$path"; then
    echo "   ✅ Método retorna \$path corretamente"
else
    echo "   ⚠️  Método pode não estar retornando o path"
fi

echo ""
echo "6️⃣ Limpando cache do Laravel..."
php artisan config:clear 2>/dev/null || echo "   ⚠️  Erro ao limpar config cache"
php artisan cache:clear 2>/dev/null || echo "   ⚠️  Erro ao limpar cache"
php artisan route:clear 2>/dev/null || echo "   ⚠️  Erro ao limpar route cache"
echo "   ✅ Cache limpo"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ CORREÇÃO CONCLUÍDA"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "💡 Próximos passos:"
echo "   1. Teste a geração do PDF novamente"
echo "   2. Se ainda não funcionar, verifique os logs:"
echo "      tail -f ${BACKEND_PATH}/storage/logs/laravel.log"
echo "   3. Execute o teste de geração:"
echo "      /tmp/TESTAR_GERACAO_PDF.sh"
echo ""















