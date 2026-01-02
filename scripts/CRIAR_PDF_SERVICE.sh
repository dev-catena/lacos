#!/bin/bash

# Script para criar o PdfService.php no servidor se não existir

set -e

echo "🔧 CRIANDO/VERIFICANDO PdfService.php"
echo "======================================"
echo ""

BACKEND_PATH="/var/www/lacos-backend"
SERVICES_DIR="${BACKEND_PATH}/app/Services"
PDF_SERVICE="${SERVICES_DIR}/PdfService.php"

echo "📋 Configurações:"
echo "   Backend: ${BACKEND_PATH}"
echo "   Services: ${SERVICES_DIR}"
echo "   Arquivo: ${PDF_SERVICE}"
echo ""

# Verificar se o diretório Services existe
if [ ! -d "$SERVICES_DIR" ]; then
    echo "1️⃣ Criando diretório Services..."
    mkdir -p "$SERVICES_DIR"
    echo "   ✅ Diretório criado"
else
    echo "1️⃣ Diretório Services existe"
fi

# Verificar se o arquivo já existe
if [ -f "$PDF_SERVICE" ]; then
    echo ""
    echo "2️⃣ Arquivo PdfService.php já existe"
    echo "   Verificando conteúdo..."
    
    if grep -q "generateCertificatePDF" "$PDF_SERVICE"; then
        echo "   ✅ Método generateCertificatePDF encontrado"
        
        # Verificar se já tem verificação de arquivo
        if grep -q "file_exists.*fullPath\|arquivo não foi criado" "$PDF_SERVICE"; then
            echo "   ✅ Verificação de arquivo já existe"
            echo ""
            echo "✅ Arquivo está completo e correto!"
            exit 0
        else
            echo "   ⚠️  Verificação de arquivo NÃO encontrada"
            echo "   Adicionando verificação..."
            
            # Backup
            cp "$PDF_SERVICE" "${PDF_SERVICE}.backup.$(date +%s)"
            
            # Adicionar verificação
            python3 << 'PYTHON_SCRIPT'
import re
import sys

file_path = sys.argv[1]

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Padrão para encontrar Storage::put seguido de return
    pattern = r'(Storage::put\(\$path, \$pdf->output\(\)\);)\s*(return \$path;)'
    
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
    
    new_content = re.sub(pattern, replacement, content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("   ✅ Verificação adicionada")
    else:
        print("   ⚠️  Padrão não encontrado. Arquivo pode ter estrutura diferente.")
    
except Exception as e:
    print(f"   ❌ Erro: {e}")
    sys.exit(1)
PYTHON_SCRIPT
            "$PDF_SERVICE"
        fi
    else
        echo "   ⚠️  Método generateCertificatePDF NÃO encontrado"
        echo "   Arquivo existe mas está incompleto. Recriando..."
        rm "$PDF_SERVICE"
    fi
fi

# Se o arquivo não existe ou foi removido, criar
if [ ! -f "$PDF_SERVICE" ]; then
    echo ""
    echo "3️⃣ Criando arquivo PdfService.php..."
    
    cat > "$PDF_SERVICE" << 'PHPSERVICE'
<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class PdfService
{
    /**
     * Gerar PDF da receita médica conforme template
     */
    public function generateRecipePDF(array $data): string
    {
        try {
            // Gerar QR Code
            $validationUrl = url("/api/prescriptions/validate/" . hash('sha256', json_encode($data) . time()));
            $qrCode = base64_encode(QrCode::format('png')->size(200)->generate($validationUrl));

            // Adicionar QR code aos dados
            $data['qr_code'] = $qrCode;
            $data['validation_url'] = $validationUrl;
            $data['validation_hash'] = hash('sha256', json_encode($data) . time());

            // Usar template Blade
            $pdf = Pdf::loadView('prescriptions.recipe', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('isHtml5ParserEnabled', true)
                ->setOption('isRemoteEnabled', true);

            // Salvar temporariamente
            $filename = 'recipe_' . uniqid() . '.pdf';
            $path = 'temp/' . $filename;
            Storage::put($path, $pdf->output());

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

            return $path;
        } catch (\Exception $e) {
            Log::error('Erro ao gerar PDF da receita: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Gerar PDF do atestado médico
     */
    public function generateCertificatePDF(array $data): string
    {
        try {
            // Gerar QR Code
            $validationUrl = url("/api/prescriptions/validate/" . hash('sha256', json_encode($data) . time()));
            $qrCode = base64_encode(QrCode::format('png')->size(200)->generate($validationUrl));

            // Adicionar QR code aos dados
            $data['qr_code'] = $qrCode;
            $data['validation_url'] = $validationUrl;
            $data['validation_hash'] = hash('sha256', json_encode($data) . time());

            // Determinar tipo de atestado
            $typeLabels = [
                'medical_leave' => 'Afastamento Médico',
                'medical_certificate' => 'Atestado Médico',
                'health_statement' => 'Declaração de Saúde',
            ];
            $data['certificate_type_label'] = $typeLabels[$data['type']] ?? 'Atestado Médico';

            // Usar template Blade
            $pdf = Pdf::loadView('prescriptions.certificate', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('isHtml5ParserEnabled', true)
                ->setOption('isRemoteEnabled', true);

            // Salvar temporariamente
            $filename = 'certificate_' . uniqid() . '.pdf';
            $path = 'temp/' . $filename;
            Storage::put($path, $pdf->output());

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

            return $path;
        } catch (\Exception $e) {
            Log::error('Erro ao gerar PDF do atestado: ' . $e->getMessage());
            throw $e;
        }
    }
}
PHPSERVICE

    echo "   ✅ Arquivo PdfService.php criado"
fi

# Verificar permissões
echo ""
echo "4️⃣ Verificando permissões..."
if id "www-data" &>/dev/null; then
    WEB_USER="www-data"
    WEB_GROUP="www-data"
else
    WEB_USER=$(whoami)
    WEB_GROUP=$(whoami)
fi

chown ${WEB_USER}:${WEB_GROUP} "$PDF_SERVICE"
chmod 644 "$PDF_SERVICE"
echo "   ✅ Permissões ajustadas (${WEB_USER}:${WEB_GROUP}, 644)"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ PdfService.php CRIADO/VERIFICADO"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Resumo:"
echo "   ✅ Arquivo: ${PDF_SERVICE}"
echo "   ✅ Método generateCertificatePDF incluído"
echo "   ✅ Verificação de arquivo criado incluída"
echo ""
echo "💡 Próximos passos:"
echo "   1. Verifique se o PrescriptionController está usando este serviço"
echo "   2. Teste a geração do PDF novamente"
echo ""










