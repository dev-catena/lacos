#!/bin/bash

# Solução definitiva para o erro de PDF - cria tudo que está faltando

set -e

echo "🔧 SOLUÇÃO DEFINITIVA: CRIAR TUDO QUE ESTÁ FALTANDO"
echo "=================================================="
echo ""

BACKEND_PATH="/var/www/lacos-backend"
SERVICES_DIR="${BACKEND_PATH}/app/Services"
PDF_SERVICE="${SERVICES_DIR}/PdfService.php"
VIEWS_DIR="${BACKEND_PATH}/resources/views/prescriptions"
TEMPLATE_CERT="${VIEWS_DIR}/certificate.blade.php"
TEMPLATE_RECIPE="${VIEWS_DIR}/recipe.blade.php"

echo "📋 Verificando e criando componentes..."
echo ""

# 1. Criar PdfService se não existir
echo "1️⃣ Criando PdfService.php..."
mkdir -p "$SERVICES_DIR"

if [ -f "$PDF_SERVICE" ]; then
    echo "   ✅ Já existe, verificando..."
    if ! grep -q "file_exists.*fullPath" "$PDF_SERVICE"; then
        echo "   ⚠️  Adicionando verificação..."
        # Adicionar verificação se não tiver
        python3 << 'PYTHON'
import re
import sys

file_path = sys.argv[1]
with open(file_path, 'r') as f:
    content = f.read()

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
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("   ✅ Verificação adicionada")
else:
    print("   ✅ Já tem verificação")
PYTHON
        "$PDF_SERVICE"
    else
        echo "   ✅ Já tem verificação"
    fi
else
    echo "   ⚠️  Não existe, criando..."
    cat > "$PDF_SERVICE" << 'PHPSERVICE'
<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class PdfService
{
    public function generateRecipePDF(array $data): string
    {
        try {
            $validationUrl = url("/api/prescriptions/validate/" . hash('sha256', json_encode($data) . time()));
            $qrCode = base64_encode(QrCode::format('png')->size(200)->generate($validationUrl));

            $data['qr_code'] = $qrCode;
            $data['validation_url'] = $validationUrl;
            $data['validation_hash'] = hash('sha256', json_encode($data) . time());

            $pdf = Pdf::loadView('prescriptions.recipe', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('isHtml5ParserEnabled', true)
                ->setOption('isRemoteEnabled', true);

            $filename = 'recipe_' . uniqid() . '.pdf';
            $path = 'temp/' . $filename;
            Storage::put($path, $pdf->output());

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

    public function generateCertificatePDF(array $data): string
    {
        try {
            $validationUrl = url("/api/prescriptions/validate/" . hash('sha256', json_encode($data) . time()));
            $qrCode = base64_encode(QrCode::format('png')->size(200)->generate($validationUrl));

            $data['qr_code'] = $qrCode;
            $data['validation_url'] = $validationUrl;
            $data['validation_hash'] = hash('sha256', json_encode($data) . time());

            $typeLabels = [
                'medical_leave' => 'Afastamento Médico',
                'medical_certificate' => 'Atestado Médico',
                'health_statement' => 'Declaração de Saúde',
            ];
            $data['certificate_type_label'] = $typeLabels[$data['type']] ?? 'Atestado Médico';

            $pdf = Pdf::loadView('prescriptions.certificate', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('isHtml5ParserEnabled', true)
                ->setOption('isRemoteEnabled', true);

            $filename = 'certificate_' . uniqid() . '.pdf';
            $path = 'temp/' . $filename;
            Storage::put($path, $pdf->output());

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
    echo "   ✅ PdfService.php criado"
fi

# 2. Criar templates Blade se não existirem
echo ""
echo "2️⃣ Criando templates Blade..."
mkdir -p "$VIEWS_DIR"

if [ ! -f "$TEMPLATE_CERT" ]; then
    echo "   ⚠️  Template certificate.blade.php não existe, criando..."
    cat > "$TEMPLATE_CERT" << 'BLADE'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Atestado Médico</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin: 20px 0; }
        .section { margin: 15px 0; }
        .signature { margin-top: 50px; text-align: center; }
        .qr-code { text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $certificate_type_label ?? 'Atestado Médico' }}</h1>
    </div>
    
    <div class="content">
        <div class="section">
            <p><strong>Paciente:</strong> {{ $patient_name ?? '' }}</p>
            @if(!empty($patient_cpf))
            <p><strong>CPF:</strong> {{ $patient_cpf }}</p>
            @endif
        </div>
        
        <div class="section">
            <p><strong>Médico:</strong> {{ $doctor_name ?? '' }}</p>
            <p><strong>CRM:</strong> {{ $doctor_crm ?? '' }}/{{ $doctor_crm_uf ?? '' }}</p>
            @if(!empty($doctor_specialty))
            <p><strong>Especialidade:</strong> {{ $doctor_specialty }}</p>
            @endif
        </div>
        
        @if($type === 'medical_leave' && !empty($start_date) && !empty($end_date))
        <div class="section">
            <p><strong>Período de Afastamento:</strong></p>
            <p>De {{ \Carbon\Carbon::parse($start_date)->format('d/m/Y') }} até {{ \Carbon\Carbon::parse($end_date)->format('d/m/Y') }}</p>
            @if(!empty($days))
            <p><strong>Dias:</strong> {{ $days }}</p>
            @endif
        </div>
        @endif
        
        @if(!empty($cid))
        <div class="section">
            <p><strong>CID:</strong> {{ $cid }}</p>
        </div>
        @endif
        
        <div class="section">
            <p><strong>Descrição:</strong></p>
            <p>{{ $description ?? '' }}</p>
        </div>
        
        @if(!empty($notes))
        <div class="section">
            <p><strong>Observações:</strong></p>
            <p>{{ $notes }}</p>
        </div>
        @endif
    </div>
    
    <div class="signature">
        <p>_________________________________</p>
        <p>{{ $doctor_name ?? '' }}</p>
        <p>CRM {{ $doctor_crm ?? '' }}/{{ $doctor_crm_uf ?? '' }}</p>
    </div>
    
    @if(!empty($qr_code))
    <div class="qr-code">
        <img src="data:image/png;base64,{{ $qr_code }}" alt="QR Code" style="width: 150px;">
    </div>
    @endif
</body>
</html>
BLADE
    echo "   ✅ Template certificate.blade.php criado"
else
    echo "   ✅ Template certificate.blade.php já existe"
fi

if [ ! -f "$TEMPLATE_RECIPE" ]; then
    echo "   ⚠️  Template recipe.blade.php não existe, criando básico..."
    cat > "$TEMPLATE_RECIPE" << 'BLADE'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receita Médica</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Receita Médica</h1>
    </div>
    <div class="content">
        <p><strong>Paciente:</strong> {{ $patient_name ?? '' }}</p>
        <p><strong>Medicamento:</strong> {{ $medication ?? '' }}</p>
        <p><strong>Descrição:</strong> {{ $dosage ?? '' }}</p>
    </div>
</body>
</html>
BLADE
    echo "   ✅ Template recipe.blade.php criado"
else
    echo "   ✅ Template recipe.blade.php já existe"
fi

# 3. Verificar permissões
echo ""
echo "3️⃣ Verificando permissões..."
if id "www-data" &>/dev/null; then
    WEB_USER="www-data"
    WEB_GROUP="www-data"
else
    WEB_USER=$(whoami)
    WEB_GROUP=$(whoami)
fi

chown -R ${WEB_USER}:${WEB_GROUP} "$SERVICES_DIR" 2>/dev/null || echo "   ⚠️  Não foi possível alterar ownership (pode precisar sudo)"
chmod 644 "$PDF_SERVICE" 2>/dev/null || echo "   ⚠️  Não foi possível alterar permissões"

chown -R ${WEB_USER}:${WEB_GROUP} "$VIEWS_DIR" 2>/dev/null || echo "   ⚠️  Não foi possível alterar ownership dos templates"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ SOLUÇÃO APLICADA"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Componentes criados/verificados:"
echo "   ✅ PdfService.php"
echo "   ✅ Template certificate.blade.php"
echo "   ✅ Template recipe.blade.php"
echo ""
echo "💡 Próximos passos:"
echo "   1. Teste a geração do PDF novamente"
echo "   2. Se ainda não funcionar, execute o diagnóstico:"
echo "      ./scripts/DIAGNOSTICAR_ERRO_PDF_COMPLETO.sh"
echo "   3. Verifique os logs:"
echo "      tail -f ${BACKEND_PATH}/storage/logs/laravel.log"
echo ""




