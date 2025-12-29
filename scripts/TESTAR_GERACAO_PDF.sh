#!/bin/bash

# Script para testar a geração de PDF diretamente

set -e

echo "🧪 TESTANDO GERAÇÃO DE PDF"
echo "==========================="
echo ""

BACKEND_PATH="/var/www/lacos-backend"

cd "$BACKEND_PATH" || exit 1

echo "1️⃣ Verificando namespace do PdfService..."
if grep -q "class PDFService" app/Services/PdfService.php; then
    echo "   ⚠️  Classe é PDFService (maiúsculas)"
    CLASS_NAME="PDFService"
elif grep -q "class PdfService" app/Services/PdfService.php; then
    echo "   ✅ Classe é PdfService (camelCase)"
    CLASS_NAME="PdfService"
else
    echo "   ❌ Não foi possível determinar o nome da classe"
    exit 1
fi

echo ""
echo "2️⃣ Verificando se o controller usa o nome correto..."
if grep -q "use App\\\\Services\\\\PDFService" app/Http/Controllers/Api/PrescriptionController.php; then
    echo "   ⚠️  Controller usa PDFService (maiúsculas)"
    if [ "$CLASS_NAME" != "PDFService" ]; then
        echo "   ❌ PROBLEMA: Controller usa PDFService mas a classe é PdfService!"
        echo "   Corrigindo..."
        sed -i 's/use App\\Services\\PDFService;/use App\\Services\\PdfService;/g' app/Http/Controllers/Api/PrescriptionController.php
        sed -i 's/protected \$pdfService;.*PDFService/protected $pdfService;.*PdfService/g' app/Http/Controllers/Api/PrescriptionController.php
        sed -i 's/public function __construct(PDFService/public function __construct(PdfService/g' app/Http/Controllers/Api/PrescriptionController.php
        echo "   ✅ Corrigido!"
    fi
elif grep -q "use App\\\\Services\\\\PdfService" app/Http/Controllers/Api/PrescriptionController.php; then
    echo "   ✅ Controller usa PdfService (camelCase)"
    if [ "$CLASS_NAME" != "PdfService" ]; then
        echo "   ❌ PROBLEMA: Controller usa PdfService mas a classe é PDFService!"
        echo "   Corrigindo..."
        sed -i 's/use App\\Services\\PdfService;/use App\\Services\\PDFService;/g' app/Http/Controllers/Api/PrescriptionController.php
        sed -i 's/public function __construct(PdfService/public function __construct(PDFService/g' app/Http/Controllers/Api/PrescriptionController.php
        echo "   ✅ Corrigido!"
    fi
else
    echo "   ⚠️  Não foi possível encontrar o use statement"
fi

echo ""
echo "3️⃣ Verificando se o template Blade tem erros..."
TEMPLATE="${BACKEND_PATH}/resources/views/prescriptions/certificate.blade.php"
if [ -f "$TEMPLATE" ]; then
    echo "   ✅ Template existe"
    echo "   Verificando sintaxe básica..."
    
    # Verificar se tem tags PHP válidas
    if grep -q "@if\|@endif\|@foreach\|@endforeach" "$TEMPLATE"; then
        echo "   ✅ Template tem estrutura Blade válida"
    fi
    
    # Verificar se tem variáveis esperadas
    if grep -q "\$patient_name\|\$doctor_name\|\$description" "$TEMPLATE"; then
        echo "   ✅ Template usa variáveis esperadas"
    fi
else
    echo "   ❌ Template não existe!"
fi

echo ""
echo "4️⃣ Testando se DomPDF consegue gerar um PDF simples..."
php -r "
require 'vendor/autoload.php';
\$app = require_once 'bootstrap/app.php';
\$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo '   Testando DomPDF...' . PHP_EOL;
    \$pdf = Barryvdh\DomPDF\Facade\Pdf::loadHTML('<html><body><h1>Teste</h1></body></html>');
    \$output = \$pdf->output();
    
    if (empty(\$output)) {
        echo '   ❌ ERRO: DomPDF retornou conteúdo vazio!' . PHP_EOL;
        exit(1);
    }
    
    echo '   ✅ DomPDF funcionando, tamanho do output: ' . strlen(\$output) . ' bytes' . PHP_EOL;
    
    // Tentar salvar
    \$testPath = 'storage/app/temp/test_' . time() . '.pdf';
    file_put_contents(\$testPath, \$output);
    
    if (file_exists(\$testPath)) {
        echo '   ✅ Arquivo de teste criado com sucesso: ' . \$testPath . PHP_EOL;
        unlink(\$testPath);
    } else {
        echo '   ❌ ERRO: Não foi possível criar arquivo de teste!' . PHP_EOL;
        exit(1);
    }
} catch (Exception \$e) {
    echo '   ❌ ERRO: ' . \$e->getMessage() . PHP_EOL;
    exit(1);
}
"

echo ""
echo "5️⃣ Verificando se há erros no método generateCertificatePDF..."
# Verificar se o método está tentando usar Storage::put corretamente
if grep -A 5 "Storage::put" app/Services/PdfService.php | grep -q "pdf->output()"; then
    echo "   ✅ Storage::put está sendo usado com pdf->output()"
else
    echo "   ⚠️  Verifique o uso de Storage::put"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ TESTE CONCLUÍDO"
echo "═══════════════════════════════════════════════════════════"
echo ""




