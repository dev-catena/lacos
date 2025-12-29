#!/bin/bash

# Script para corrigir geração de PDF e adicionar logs de debug

cd /var/www/lacos-backend || exit 1

echo "🔧 Adicionando logs de debug no PrescriptionController..."
echo ""

CONTROLLER_FILE="app/Http/Controllers/Api/PrescriptionController.php"
if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "❌ Arquivo não encontrado!"
    exit 1
fi

# Criar backup
BACKUP_FILE="${CONTROLLER_FILE}.backup.debug.$(date +%Y%m%d_%H%M%S)"
cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Adicionar logs após gerar PDF
python3 << 'PYTHON_SCRIPT'
import re
import sys

arquivo = 'app/Http/Controllers/Api/PrescriptionController.php'

try:
    with open(arquivo, 'r', encoding='utf-8') as f:
        conteudo = f.read()
except Exception as e:
    print(f"❌ Erro: {e}", file=sys.stderr)
    sys.exit(1)

# Adicionar log após gerar PDF (linha 221)
if '// Gerar PDF do atestado' in conteudo and 'Log::info.*PDF gerado' not in conteudo:
    conteudo = re.sub(
        r'(// Gerar PDF do atestado\s+\$pdfPath = \$this->pdfService->generateCertificatePDF\(\$validated\);)',
        r'\1\n            \n            // Log para debug\n            Log::info(\'PDF gerado\', [\'pdfPath\' => $pdfPath, \'exists\' => Storage::exists($pdfPath), \'fullPath\' => storage_path(\'app/\' . $pdfPath)]);',
        conteudo
    )
    print("✅ Log adicionado após gerar PDF", file=sys.stderr)

# Adicionar log após assinar PDF (linha 224)
if '// Assinar digitalmente' in conteudo and 'Log::info.*PDF assinado' not in conteudo:
    conteudo = re.sub(
        r'(// Assinar digitalmente com certificado do médico\s+\$signedPdfPath = \$this->signatureService->signPDF\(\$pdfPath, \$doctor\);)',
        r'\1\n            \n            // Log para debug\n            Log::info(\'PDF assinado\', [\'signedPdfPath\' => $signedPdfPath, \'exists\' => Storage::exists($signedPdfPath), \'fullPath\' => storage_path(\'app/\' . $signedPdfPath)]);',
        conteudo
    )
    print("✅ Log adicionado após assinar PDF", file=sys.stderr)

# Escrever arquivo
try:
    with open(arquivo, 'w', encoding='utf-8') as f:
        f.write(conteudo)
    print("✅ Arquivo atualizado!", file=sys.stderr)
except Exception as e:
    print(f"❌ Erro ao salvar: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Logs de debug adicionados!"
    echo ""
    echo "🧪 Agora teste gerar um atestado e verifique os logs:"
    echo "   tail -f storage/logs/laravel.log | grep -E 'PDF gerado|PDF assinado'"
else
    echo "❌ Erro ao adicionar logs"
    exit 1
fi

