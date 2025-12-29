#!/bin/bash

# Script para procurar onde está o código de geração de PDF

cd /var/www/lacos-backend || exit 1

echo "🔍 Procurando código de geração de PDF..."
echo ""

# Procurar por arquivos relacionados a PDF
echo "📂 Procurando arquivos PDF..."
find . -name "*Pdf*" -o -name "*PDF*" 2>/dev/null | grep -E "\.(php|js)$" | head -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Procurar por generateCertificatePDF no código
echo "📋 Procurando método generateCertificatePDF..."
grep -r "generateCertificatePDF" . --include="*.php" 2>/dev/null | head -10

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar PrescriptionController para ver como chama o serviço
echo "📋 Verificando PrescriptionController..."
if [ -f "app/Http/Controllers/Api/PrescriptionController.php" ]; then
    echo "✅ PrescriptionController encontrado"
    echo ""
    echo "📋 Como o PDF é gerado:"
    grep -A 5 "pdfService\|generateCertificatePDF" app/Http/Controllers/Api/PrescriptionController.php | head -20
else
    echo "❌ PrescriptionController não encontrado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Listar serviços disponíveis
echo "📂 Serviços disponíveis:"
ls -la app/Services/ 2>/dev/null | head -20

