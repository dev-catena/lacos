# 🔍 Diagnóstico: PDF não está sendo criado

## Problema Identificado

O diretório `storage/app/temp` está vazio, o que significa que o PDF não está sendo salvo pelo método `generateCertificatePDF()`.

## Possíveis Causas

1. **Método `generateCertificatePDF()` não está salvando o arquivo**
2. **Erro silencioso no `pdf->output()`**
3. **Problema de permissões no momento da escrita**
4. **Erro na biblioteca PDF que não está sendo capturado**

## Solução: Adicionar Verificação e Logs

Adicione logs no método `generateCertificatePDF()` para verificar se o arquivo está sendo criado:

```php
// No método generateCertificatePDF() após Storage::put()
$path = 'temp/' . $filename;
Storage::put($path, $pdf->output());

// ADICIONAR ESTA VERIFICAÇÃO:
$fullPath = storage_path('app/' . $path);
if (!file_exists($fullPath)) {
    Log::error('PDF não foi criado após Storage::put()', [
        'path' => $path,
        'fullPath' => $fullPath,
        'directory_exists' => is_dir(dirname($fullPath)),
        'directory_writable' => is_writable(dirname($fullPath)),
    ]);
    throw new \Exception('Erro ao salvar PDF: arquivo não foi criado');
}

Log::info('PDF criado com sucesso', [
    'path' => $path,
    'fullPath' => $fullPath,
    'size' => filesize($fullPath),
]);

return $path;
```

## Verificação Rápida no Servidor

Execute no servidor:

```bash
cd /var/www/lacos-backend

# Verificar se PdfService existe
find . -name "*PdfService*" -type f

# Verificar método generateCertificatePDF
grep -A 40 "function generateCertificatePDF" app/Services/PdfService.php
```

