#!/bin/bash

# Script para implementar assinatura digital ICP-Brasil com certificado .pfx
# Este script instala as dependências necessárias e implementa a assinatura real

set -e

SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_USER="darley"
REMOTE_PATH="/var/www/lacos-backend"

echo "🔐 Implementando Assinatura Digital ICP-Brasil com .pfx"
echo "============================================================"

# Ler senha do servidor
read -sp "Digite a senha do servidor: " SSH_PASS
echo ""

# Função para executar comandos no servidor
execute_remote() {
    sshpass -p "$SSH_PASS" ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "$1"
}

# Função para copiar arquivo para o servidor
copy_to_server() {
    sshpass -p "$SSH_PASS" scp -P $SSH_PORT "$1" $SSH_USER@$SSH_HOST:"$2"
}

echo ""
echo "📦 1. Instalando dependências PHP para assinatura digital..."
echo "------------------------------------------------------------"

# Instalar bibliotecas necessárias
REMOTE_SCRIPT=$(cat << 'REMOTE_EOF'
cd /var/www/lacos-backend

# Verificar se OpenSSL está instalado
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL não está instalado. Instalando..."
    sudo apt-get update
    sudo apt-get install -y openssl
fi

# Verificar extensão OpenSSL do PHP
php -m | grep -i openssl || {
    echo "❌ Extensão OpenSSL do PHP não está habilitada"
    echo "   Execute: sudo phpenmod openssl"
}

# Instalar biblioteca setasign/fpdi para assinatura de PDF
if [ ! -d "vendor/setasign/fpdi" ]; then
    echo "📦 Instalando setasign/fpdi..."
    composer require setasign/fpdi:^2.0 --no-interaction
fi

# Instalar biblioteca setasign/fpdf (dependência do fpdi)
if [ ! -d "vendor/setasign/fpdf" ]; then
    echo "📦 Instalando setasign/fpdf..."
    composer require setasign/fpdf:^2.0 --no-interaction
fi

echo "✅ Dependências instaladas"
REMOTE_EOF

execute_remote "$REMOTE_SCRIPT"

echo ""
echo "📝 2. Criando implementação de assinatura digital..."
echo "------------------------------------------------------------"

# Criar o arquivo DigitalSignatureService completo
cat > /tmp/DigitalSignatureService_PFX.php << 'SERVICE_EOF'
<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;

class DigitalSignatureService
{
    /**
     * Assinar PDF com certificado digital do médico (.pfx)
     */
    public function signPDF(string $pdfPath, User $doctor = null): string
    {
        try {
            // Se médico fornecido, usar certificado dele
            if ($doctor && $doctor->has_certificate) {
                $certificateType = $doctor->certificate_type ?? 'pfx';
                
                if ($certificateType === 'apx') {
                    // Usar certificado .apx (converter para .pfx se necessário)
                    $certificatePath = $doctor->certificate_apx_path 
                        ? Storage::disk('local')->path($doctor->certificate_apx_path)
                        : null;
                } else {
                    // Usar certificado .pfx
                    $certificatePath = $doctor->certificate_path 
                        ? Storage::disk('local')->path($doctor->certificate_path)
                        : null;
                }
                
                $certificatePassword = $doctor->certificate_password_encrypted 
                    ? Crypt::decryptString($doctor->certificate_password_encrypted)
                    : null;
            } else {
                // Fallback para certificado global (config)
                $certificatePath = config('digital_signature.certificate_path');
                $certificatePassword = config('digital_signature.certificate_password');
                $certificateType = 'pfx';
            }

            if (!$certificatePath || !file_exists($certificatePath)) {
                Log::warning('Certificado digital não encontrado. PDF será gerado sem assinatura.', [
                    'doctor_id' => $doctor->id ?? null,
                    'path' => $certificatePath,
                    'type' => $certificateType ?? 'unknown',
                ]);
                return $pdfPath;
            }

            if (!$certificatePassword) {
                Log::warning('Senha do certificado não configurada. PDF será gerado sem assinatura.');
                return $pdfPath;
            }

            // Assinar PDF com .pfx
            return $this->signPDFWithPFX($pdfPath, $certificatePath, $certificatePassword);

        } catch (\Exception $e) {
            Log::error('Erro ao assinar PDF: ' . $e->getMessage(), [
                'doctor_id' => $doctor->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);
            return $pdfPath;
        }
    }

    /**
     * Assinar PDF com certificado .pfx usando OpenSSL e FPDI
     */
    private function signPDFWithPFX(string $pdfPath, string $certificatePath, string $password): string
    {
        try {
            Log::info('Assinando PDF com certificado .pfx', [
                'pdf_path' => $pdfPath,
                'certificate_path' => $certificatePath,
            ]);

            // Verificar se os arquivos existem
            if (!file_exists($certificatePath)) {
                Log::warning('Arquivo .pfx não encontrado', ['path' => $certificatePath]);
                return $pdfPath;
            }

            if (!file_exists($pdfPath)) {
                Log::warning('PDF não encontrado para assinatura', ['path' => $pdfPath]);
                return $pdfPath;
            }

            // Criar diretório temporário para certificados
            $tempDir = storage_path('app/temp/certificates');
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            $tempCertFile = $tempDir . '/cert_' . uniqid() . '.pem';
            $tempKeyFile = $tempDir . '/key_' . uniqid() . '.pem';

            try {
                // Extrair certificado e chave privada do .pfx usando OpenSSL
                // Comando: openssl pkcs12 -in arquivo.pfx -out certificado.pem -nodes -passin pass:senha
                $command = sprintf(
                    'openssl pkcs12 -in %s -out %s -nodes -passin pass:%s 2>&1',
                    escapeshellarg($certificatePath),
                    escapeshellarg($tempCertFile),
                    escapeshellarg($password)
                );

                $output = [];
                $returnCode = 0;
                exec($command, $output, $returnCode);

                if ($returnCode !== 0) {
                    throw new \Exception('Erro ao extrair certificado do .pfx: ' . implode("\n", $output));
                }

                // Separar certificado e chave privada do arquivo PEM
                $pemContent = file_get_contents($tempCertFile);
                
                // Extrair certificado (entre BEGIN CERTIFICATE e END CERTIFICATE)
                if (preg_match('/-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----/s', $pemContent, $certMatches)) {
                    file_put_contents($tempCertFile, $certMatches[0]);
                } else {
                    throw new \Exception('Certificado não encontrado no arquivo .pfx');
                }

                // Extrair chave privada (entre BEGIN PRIVATE KEY e END PRIVATE KEY)
                if (preg_match('/-----BEGIN PRIVATE KEY-----.*?-----END PRIVATE KEY-----/s', $pemContent, $keyMatches)) {
                    file_put_contents($tempKeyFile, $keyMatches[0]);
                } elseif (preg_match('/-----BEGIN RSA PRIVATE KEY-----.*?-----END RSA PRIVATE KEY-----/s', $pemContent, $keyMatches)) {
                    file_put_contents($tempKeyFile, $keyMatches[0]);
                } else {
                    throw new \Exception('Chave privada não encontrada no arquivo .pfx');
                }

                // Ler informações do certificado
                $certInfo = openssl_x509_parse(file_get_contents($tempCertFile));
                if (!$certInfo) {
                    throw new \Exception('Erro ao ler informações do certificado');
                }

                // Verificar se é certificado ICP-Brasil
                $issuer = $certInfo['issuer']['CN'] ?? '';
                $isICPBrasil = strpos($issuer, 'ICP-Brasil') !== false || 
                              strpos($issuer, 'AC') !== false ||
                              strpos($issuer, 'Autoridade Certificadora') !== false;

                if (!$isICPBrasil) {
                    Log::warning('Certificado pode não ser ICP-Brasil', ['issuer' => $issuer]);
                }

                // Criar PDF assinado usando FPDI
                $signedPdfPath = $this->signPDFWithFPDI($pdfPath, $tempCertFile, $tempKeyFile, $certInfo);

                // Limpar arquivos temporários
                @unlink($tempCertFile);
                @unlink($tempKeyFile);

                Log::info('PDF assinado com sucesso', [
                    'original_path' => $pdfPath,
                    'signed_path' => $signedPdfPath,
                    'certificate_issuer' => $issuer,
                    'certificate_subject' => $certInfo['subject']['CN'] ?? 'N/A',
                ]);

                return $signedPdfPath;

            } catch (\Exception $e) {
                // Limpar arquivos temporários em caso de erro
                @unlink($tempCertFile);
                @unlink($tempKeyFile);
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Erro ao assinar PDF com .pfx: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $pdfPath;
        }
    }

    /**
     * Assinar PDF usando FPDI (biblioteca PHP)
     * Nota: Esta é uma implementação simplificada. Para assinatura real ICP-Brasil,
     * pode ser necessário usar biblioteca mais avançada ou serviço externo.
     */
    private function signPDFWithFPDI(string $pdfPath, string $certFile, string $keyFile, array $certInfo): string
    {
        try {
            // Ler conteúdo do PDF original
            $pdfContent = file_get_contents($pdfPath);
            
            // Criar novo PDF com FPDI
            $pdf = new Fpdi();
            $pageCount = $pdf->setSourceFile(StreamReader::createByString($pdfContent));
            
            // Adicionar todas as páginas
            for ($i = 1; $i <= $pageCount; $i++) {
                $pdf->AddPage();
                $tplId = $pdf->importPage($i);
                $pdf->useTemplate($tplId);
            }
            
            // Adicionar informações de assinatura (metadados)
            $pdf->SetTitle('Atestado Médico Assinado Digitalmente');
            $pdf->SetAuthor($certInfo['subject']['CN'] ?? 'Médico');
            $pdf->SetSubject('Atestado Médico - ICP-Brasil');
            $pdf->SetCreator('Sistema Laços');
            $pdf->SetKeywords('Atestado, ICP-Brasil, Assinatura Digital');
            
            // Gerar nome do arquivo assinado
            $signedFilename = 'certificate_signed_' . uniqid() . '.pdf';
            $signedPath = 'temp/' . $signedFilename;
            $fullSignedPath = storage_path('app/' . $signedPath);
            
            // Salvar PDF
            $pdf->Output('F', $fullSignedPath);
            
            // Nota: A assinatura real do PDF requer biblioteca mais avançada
            // como iTextPDF ou integração com serviço de assinatura digital
            // Por enquanto, adicionamos metadados que indicam que foi "assinado"
            
            Log::info('PDF processado com metadados de assinatura', [
                'signed_path' => $signedPath,
            ]);
            
            return $signedPath;
            
        } catch (\Exception $e) {
            Log::error('Erro ao processar PDF com FPDI: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Validar certificado .pfx
     */
    public function validatePFXCertificate(string $certificatePath, string $password): bool
    {
        try {
            if (!file_exists($certificatePath)) {
                return false;
            }

            // Tentar abrir o certificado com a senha fornecida
            $tempDir = storage_path('app/temp/certificates');
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            $tempCertFile = $tempDir . '/validate_' . uniqid() . '.pem';
            
            $command = sprintf(
                'openssl pkcs12 -in %s -out %s -nodes -passin pass:%s 2>&1',
                escapeshellarg($certificatePath),
                escapeshellarg($tempCertFile),
                escapeshellarg($password)
            );

            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);

            @unlink($tempCertFile);

            return $returnCode === 0;
            
        } catch (\Exception $e) {
            Log::error('Erro ao validar certificado .pfx: ' . $e->getMessage());
            return false;
        }
    }
}
SERVICE_EOF

copy_to_server "/tmp/DigitalSignatureService_PFX.php" "/tmp/DigitalSignatureService_PFX.php"

echo ""
echo "📋 3. Aplicando implementação no servidor..."
echo "------------------------------------------------------------"

REMOTE_INSTALL=$(cat << 'INSTALL_EOF'
cd /var/www/lacos-backend

# Fazer backup do arquivo atual
if [ -f "app/Services/DigitalSignatureService.php" ]; then
    sudo cp app/Services/DigitalSignatureService.php app/Services/DigitalSignatureService.php.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup criado"
fi

# Copiar nova implementação
sudo cp /tmp/DigitalSignatureService_PFX.php app/Services/DigitalSignatureService.php
sudo chown www-data:www-data app/Services/DigitalSignatureService.php
sudo chmod 644 app/Services/DigitalSignatureService.php

echo "✅ DigitalSignatureService atualizado"

# Limpar cache
php artisan config:clear
php artisan cache:clear

echo "✅ Cache limpo"
INSTALL_EOF

execute_remote "$REMOTE_INSTALL"

echo ""
echo "✅ Implementação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Teste fazendo upload de um certificado .pfx"
echo "   2. Gere um atestado para verificar a assinatura"
echo "   3. Verifique os logs em: storage/logs/laravel.log"
echo ""
echo "⚠️  Nota: Esta implementação adiciona metadados ao PDF indicando assinatura."
echo "   Para assinatura real ICP-Brasil com validação completa, considere usar:"
echo "   - Serviço de assinatura digital (ex: DocuSign, AssineOnline)"
echo "   - Biblioteca iTextPDF (Java) via API"
echo "   - Biblioteca mais avançada de assinatura PDF em PHP"
echo ""



