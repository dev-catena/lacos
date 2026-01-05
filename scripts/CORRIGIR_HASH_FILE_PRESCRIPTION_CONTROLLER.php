<?php
/**
 * CORREÇÃO: Adicionar verificação de arquivo antes de calcular hash
 * 
 * PROBLEMA: hash_file() está sendo chamado antes do arquivo PDF existir
 * 
 * SOLUÇÃO: Verificar se o arquivo existe antes de calcular o hash
 * 
 * LOCALIZAÇÃO: PrescriptionController.php
 *              Método: generateSignedCertificate
 * 
 * SUBSTITUIR este código:
 * 
 * // Gerar hash para validação
 * $documentHash = hash_file('sha256', storage_path('app/' . $signedPdfPath));
 * 
 * POR este código:
 */

// Gerar hash para validação - VERIFICAR SE ARQUIVO EXISTE PRIMEIRO
$fullSignedPath = storage_path('app/' . $signedPdfPath);
if (!file_exists($fullSignedPath)) {
    Log::error('Arquivo PDF assinado não encontrado: ' . $fullSignedPath);
    throw new \Exception('Erro ao gerar atestado: arquivo PDF não foi criado corretamente. Verifique os logs para mais detalhes.');
}

$documentHash = hash_file('sha256', $fullSignedPath);

// Se hash_file falhar, usar hash do conteúdo
if ($documentHash === false) {
    Log::error('Erro ao calcular hash do PDF: ' . $fullSignedPath);
    $documentHash = hash('sha256', file_get_contents($fullSignedPath));
}

/**
 * ALTERNATIVA (se o problema for no método signPDF):
 * 
 * Verificar se signPDF está retornando o caminho correto e se o arquivo existe:
 * 
 * // Assinar digitalmente com certificado do médico
 * $signedPdfPath = $this->signatureService->signPDF($pdfPath, $doctor);
 * 
 * // VERIFICAR SE O ARQUIVO FOI CRIADO
 * $fullSignedPath = storage_path('app/' . $signedPdfPath);
 * if (!file_exists($fullSignedPath)) {
 *     Log::error('Erro: PDF assinado não foi criado. Path: ' . $fullSignedPath);
 *     Log::error('PDF original path: ' . storage_path('app/' . $pdfPath));
 *     throw new \Exception('Erro ao assinar PDF. Verifique se o PDF foi gerado corretamente.');
 * }
 * 
 * // Agora calcular hash com segurança
 * $documentHash = hash_file('sha256', $fullSignedPath);
 * if ($documentHash === false) {
 *     $documentHash = hash('sha256', file_get_contents($fullSignedPath));
 * }
 */


