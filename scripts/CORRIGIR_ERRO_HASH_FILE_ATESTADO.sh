#!/bin/bash

# Script para corrigir erro de hash_file ao gerar atestado
# O erro ocorre porque o PDF não está sendo salvo antes de calcular o hash

set -e

echo "🔧 Corrigindo erro de hash_file ao gerar atestado..."
echo ""

# Tentar encontrar o diretório do projeto
PROJECT_DIR=""
POSSIBLE_PATHS=(
    "/var/www/lacos-backend"
    "$HOME/lacos-backend"
    "$(pwd)"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/artisan" ]; then
        PROJECT_DIR="$path"
        echo "✅ Projeto encontrado em: $PROJECT_DIR"
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    echo "❌ Não foi possível encontrar o projeto Laravel"
    echo "📂 Procurando..."
    find /var/www -name "artisan" 2>/dev/null | head -5
    exit 1
fi

cd "$PROJECT_DIR" || exit 1
echo "📂 Diretório atual: $(pwd)"
echo ""

# 1. Criar diretório temp se não existir
echo "1️⃣ Criando/verificando diretório storage/app/temp..."
sudo mkdir -p storage/app/temp
sudo chown -R www-data:www-data storage/app/temp
sudo chmod -R 775 storage/app/temp
echo "✅ Diretório temp criado com permissões corretas"
echo ""

# 2. Procurar arquivo PrescriptionController.php
CONTROLLER_FILE="app/Http/Controllers/Api/PrescriptionController.php"
if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "❌ Arquivo PrescriptionController.php não encontrado!"
    echo "📂 Procurando..."
    find . -name "PrescriptionController.php" 2>/dev/null | head -5
    exit 1
fi

echo "2️⃣ Verificando código do PrescriptionController..."
echo ""

# 3. Verificar se há problema no código
if grep -q "hash_file.*certificate" "$CONTROLLER_FILE"; then
    echo "⚠️  Encontrado uso de hash_file no código"
    echo "📋 Procurando o problema..."
    
    # Mostrar contexto ao redor do hash_file
    echo ""
    echo "🔍 Contexto do código:"
    grep -A 5 -B 5 "hash_file.*certificate" "$CONTROLLER_FILE" || true
    echo ""
    
    # Verificar se o PDF está sendo salvo antes do hash
    if grep -q "generateCertificatePDF" "$CONTROLLER_FILE"; then
        echo "✅ Método generateCertificatePDF encontrado"
        
        # Verificar ordem: se hash_file vem antes do arquivo ser salvo
        PDF_LINE=$(grep -n "generateCertificatePDF\|pdfPath.*=" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)
        HASH_LINE=$(grep -n "hash_file.*certificate\|hash_file.*pdf" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)
        
        if [ -n "$PDF_LINE" ] && [ -n "$HASH_LINE" ]; then
            if [ "$HASH_LINE" -lt "$PDF_LINE" ]; then
                echo "❌ PROBLEMA ENCONTRADO: hash_file está sendo chamado ANTES do PDF ser gerado!"
                echo "   Linha do PDF: $PDF_LINE"
                echo "   Linha do hash: $HASH_LINE"
                echo ""
                echo "⚠️  O código precisa ser corrigido manualmente"
            else
                echo "✅ Ordem parece correta (PDF antes do hash)"
                echo "   Mas pode haver problema na geração do PDF"
            fi
        fi
    fi
else
    echo "⚠️  hash_file não encontrado no código"
    echo "   O erro pode estar em outro lugar"
fi

echo ""
echo "3️⃣ Verificando se o PDF está sendo gerado corretamente..."
echo ""

# 4. Verificar se existe PdfService ou serviço similar
if [ -f "app/Services/PdfService.php" ]; then
    echo "✅ PdfService.php encontrado"
    
    # Verificar se o método generateCertificatePDF salva o arquivo
    if grep -q "generateCertificatePDF" "app/Services/PdfService.php"; then
        echo "📋 Verificando método generateCertificatePDF..."
        
        # Procurar onde o arquivo é salvo
        if grep -q "save\|putFile\|Storage::put" "app/Services/PdfService.php"; then
            echo "✅ Método parece salvar o arquivo"
        else
            echo "⚠️  Não encontrado método que salva o arquivo no PdfService"
            echo "   Pode ser que o PDF não esteja sendo salvo antes do hash"
        fi
    fi
else
    echo "⚠️  PdfService.php não encontrado"
    echo "   O serviço pode estar em outro lugar"
fi

echo ""
echo "4️⃣ Criando script de diagnóstico..."
echo ""

# Criar script para testar geração de PDF
cat > /tmp/test_pdf_generation.php << 'PHP_TEST'
<?php
// Script de teste para verificar geração de PDF
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tempPath = storage_path('app/temp');
echo "📂 Diretório temp: $tempPath\n";

if (!is_dir($tempPath)) {
    echo "❌ Diretório temp não existe!\n";
    exit(1);
}

if (!is_writable($tempPath)) {
    echo "❌ Diretório temp não é gravável!\n";
    exit(1);
}

echo "✅ Diretório temp existe e é gravável\n";

// Tentar criar arquivo de teste
$testFile = $tempPath . '/test_' . time() . '.txt';
if (file_put_contents($testFile, 'test') !== false) {
    echo "✅ Consegue escrever no diretório temp\n";
    unlink($testFile);
} else {
    echo "❌ Não consegue escrever no diretório temp\n";
    exit(1);
}
PHP_TEST

echo "✅ Script de diagnóstico criado em /tmp/test_pdf_generation.php"
echo ""

echo "5️⃣ Verificando permissões finais..."
sudo chown -R www-data:www-data storage/app/temp
sudo chmod -R 775 storage/app/temp
echo "✅ Permissões verificadas"
echo ""

echo "✅ Diagnóstico concluído!"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Verifique o código do PrescriptionController.php"
echo "   O hash_file() deve ser chamado APÓS o PDF ser salvo"
echo ""
echo "2. Verifique se o método generateCertificatePDF() está salvando o arquivo"
echo "   antes de retornar o caminho"
echo ""
echo "3. Adicione verificação se o arquivo existe antes de calcular hash:"
echo ""
echo "   if (!file_exists(\$pdfPath)) {"
echo "       throw new \\Exception('PDF não foi gerado corretamente');"
echo "   }"
echo "   \$hash = hash_file('sha256', \$pdfPath);"
echo ""
echo "4. Teste gerar um atestado novamente e verifique os logs:"
echo "   tail -f storage/logs/laravel.log"

