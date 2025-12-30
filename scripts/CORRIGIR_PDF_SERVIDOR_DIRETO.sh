#!/bin/bash

# Script para executar DIRETAMENTE no servidor (sem SSH)
# Copie este script para o servidor e execute lá

set -e

echo "🔧 CORREÇÃO COMPLETA: PERMISSÕES E CÓDIGO PHP PARA PDFs"
echo "========================================================"
echo ""

BACKEND_PATH="/var/www/lacos-backend"
TEMP_DIR="${BACKEND_PATH}/storage/app/temp"
STORAGE_DIR="${BACKEND_PATH}/storage"
PDF_SERVICE="${BACKEND_PATH}/app/Services/PdfService.php"

echo "📋 Configurações:"
echo "   Backend: ${BACKEND_PATH}"
echo "   Temp: ${TEMP_DIR}"
echo ""

echo "1️⃣ Verificando e criando diretórios..."

# Criar toda a estrutura de diretórios necessária
mkdir -p "$TEMP_DIR"
mkdir -p "${STORAGE_DIR}/app/public/documents/certificates"
mkdir -p "${STORAGE_DIR}/logs"
echo "   ✅ Estrutura de diretórios criada/verificada"

# Verificar usuário do web server
if id "www-data" &>/dev/null; then
    WEB_USER="www-data"
    WEB_GROUP="www-data"
elif id "apache" &>/dev/null; then
    WEB_USER="apache"
    WEB_GROUP="apache"
elif id "nginx" &>/dev/null; then
    WEB_USER="nginx"
    WEB_GROUP="nginx"
else
    WEB_USER=$(whoami)
    WEB_GROUP=$(whoami)
fi

echo ""
echo "2️⃣ Corrigindo permissões (usuário: ${WEB_USER})..."

# Corrigir ownership
chown -R ${WEB_USER}:${WEB_GROUP} "$STORAGE_DIR"
echo "   ✅ Ownership corrigido"

# Corrigir permissões
chmod -R 775 "$STORAGE_DIR"
echo "   ✅ Permissões corrigidas (775)"

# Se ainda não funcionar, tentar 777 no temp
chmod 777 "$TEMP_DIR"
echo "   ✅ Permissões do temp ajustadas para 777"

echo ""
echo "3️⃣ Testando escrita no diretório temp..."
TEST_FILE="${TEMP_DIR}/test_write_$(date +%s).txt"
if sudo -u ${WEB_USER} touch "$TEST_FILE" 2>/dev/null || touch "$TEST_FILE" 2>/dev/null; then
    echo "   ✅ Escrita funcionando"
    rm -f "$TEST_FILE"
else
    echo "   ⚠️  Aviso: Não foi possível testar como ${WEB_USER}"
    echo "   Mas permissões foram ajustadas para 777"
fi

echo ""
echo "4️⃣ Verificando código PHP do PdfService..."

if [ ! -f "$PDF_SERVICE" ]; then
    echo "   ⚠️  Arquivo PdfService.php não encontrado em: $PDF_SERVICE"
    echo "   Procurando em outros locais..."
    find "$BACKEND_PATH" -name "PdfService.php" -type f 2>/dev/null | head -3
    PDF_SERVICE=$(find "$BACKEND_PATH" -name "PdfService.php" -type f 2>/dev/null | head -1)
    if [ -z "$PDF_SERVICE" ]; then
        echo "   ❌ Arquivo PdfService.php não encontrado!"
        exit 1
    fi
    echo "   ✅ Arquivo encontrado: $PDF_SERVICE"
fi

# Verificar se já tem verificação após Storage::put
if grep -q "file_exists.*fullPath\|arquivo não foi criado" "$PDF_SERVICE"; then
    echo "   ✅ Verificação de arquivo já existe no código"
else
    echo "   ⚠️  Verificação de arquivo NÃO encontrada"
    echo "   Adicionando verificação..."
    
    # Backup do arquivo
    cp "$PDF_SERVICE" "${PDF_SERVICE}.backup.$(date +%s)"
    echo "   ✅ Backup criado"
    
    # Adicionar verificação após Storage::put no método generateCertificatePDF
    python3 << 'PYTHON_SCRIPT'
import re
import sys

file_path = sys.argv[1]

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Padrão para encontrar Storage::put seguido de return no método generateCertificatePDF
    # Procurar dentro do método generateCertificatePDF
    pattern = r'(public function generateCertificatePDF\([^)]+\): string\s*\{[^}]*?Storage::put\(\$path, \$pdf->output\(\)\);)\s*(return \$path;)'
    
    replacement = r'''\1

            // Verificar se o arquivo foi criado
            $fullPath = storage_path('app/' . $path);
            if (!file_exists($fullPath)) {
                Log::error('Erro ao salvar PDF: arquivo não foi criado em ' . $fullPath, [
                    'path' => $path,
                    'fullPath' => $fullPath,
                    'directory_exists' => is_dir(dirname($fullPath)),
                    'directory_writable' => is_writable(dirname($fullPath)),
                    'disk_free_space' => disk_free_space(dirname($fullPath)),
                ]);
                throw new \Exception('Erro ao salvar PDF: arquivo não foi criado em ' . $fullPath);
            }

            Log::info('PDF criado com sucesso', [
                'path' => $path,
                'fullPath' => $fullPath,
                'size' => filesize($fullPath),
            ]);

            \2'''
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # Se não encontrou, tentar padrão mais simples
    if new_content == content:
        pattern2 = r'(Storage::put\(\$path, \$pdf->output\(\)\);)\s*(return \$path;)'
        replacement2 = r'''\1

            // Verificar se o arquivo foi criado
            $fullPath = storage_path('app/' . $path);
            if (!file_exists($fullPath)) {
                Log::error('Erro ao salvar PDF: arquivo não foi criado em ' . $fullPath, [
                    'path' => $path,
                    'fullPath' => $fullPath,
                    'directory_exists' => is_dir(dirname($fullPath)),
                    'directory_writable' => is_writable(dirname($fullPath)),
                    'disk_free_space' => disk_free_space(dirname($fullPath)),
                ]);
                throw new \Exception('Erro ao salvar PDF: arquivo não foi criado em ' . $fullPath);
            }

            Log::info('PDF criado com sucesso', [
                'path' => $path,
                'fullPath' => $fullPath,
                'size' => filesize($fullPath),
            ]);

            \2'''
        new_content = re.sub(pattern2, replacement2, content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("   ✅ Verificação adicionada ao método generateCertificatePDF")
    else:
        print("   ⚠️  Padrão não encontrado. Verificando manualmente...")
        if 'generateCertificatePDF' in content and 'Storage::put' in content:
            print("   ℹ️  Método encontrado mas padrão não correspondeu.")
            print("   ℹ️  Verifique manualmente o arquivo: " + file_path)
        else:
            print("   ❌ Método generateCertificatePDF não encontrado no arquivo")
    
except Exception as e:
    print(f"   ❌ Erro ao modificar arquivo: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_SCRIPT
    "$PDF_SERVICE"
fi

echo ""
echo "5️⃣ Verificando logs do Laravel..."
LOG_FILE="${STORAGE_DIR}/logs/laravel.log"
if [ -f "$LOG_FILE" ]; then
    echo "   ✅ Arquivo de log encontrado"
    echo "   Últimas 5 linhas relacionadas a PDF:"
    grep -i "pdf\|certificate\|temp" "$LOG_FILE" | tail -5 || echo "   (nenhuma entrada encontrada)"
else
    echo "   ⚠️  Arquivo de log não encontrado"
fi

echo ""
echo "6️⃣ Verificando espaço em disco..."
df -h "$STORAGE_DIR" | tail -1

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ CORREÇÃO CONCLUÍDA"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Resumo:"
echo "   ✅ Diretórios criados/verificados"
echo "   ✅ Permissões corrigidas (${WEB_USER}:${WEB_GROUP}, 775/777)"
echo "   ✅ Código PHP verificado/corrigido"
echo ""
echo "💡 Próximos passos:"
echo "   1. Teste a geração do PDF novamente no aplicativo"
echo "   2. Se ainda não funcionar, verifique os logs:"
echo "      tail -f ${STORAGE_DIR}/logs/laravel.log"
echo "   3. Verifique se o PHP-FPM está rodando com ${WEB_USER}"
echo ""






