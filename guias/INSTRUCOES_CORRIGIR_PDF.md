# 🔧 Instruções para Corrigir Erro de Geração de PDF

## Erro Atual
```
Erro ao gerar atestado: Error: Erro ao gerar atestado: Erro ao salvar PDF: arquivo não foi criado em /var/www/lacos-backend/storage/app/temp/certificate_6948a5c211764.pdf
```

## Solução

### Opção 1: Executar Script Diretamente no Servidor (Recomendado)

1. **Copie o script para o servidor:**
   ```bash
   scp -P 63022 scripts/CORRIGIR_PDF_SERVIDOR_DIRETO.sh darley@193.203.182.22:/tmp/
   ```

2. **Conecte-se ao servidor:**
   ```bash
   ssh -p 63022 darley@193.203.182.22
   ```

3. **Execute o script:**
   ```bash
   chmod +x /tmp/CORRIGIR_PDF_SERVIDOR_DIRETO.sh
   /tmp/CORRIGIR_PDF_SERVIDOR_DIRETO.sh
   ```

### Opção 2: Executar Comandos Manualmente

Se preferir executar manualmente, siga estes passos no servidor:

```bash
# 1. Conectar ao servidor
ssh -p 63022 darley@193.203.182.22

# 2. Criar diretórios necessários
mkdir -p /var/www/lacos-backend/storage/app/temp
mkdir -p /var/www/lacos-backend/storage/app/public/documents/certificates
mkdir -p /var/www/lacos-backend/storage/logs

# 3. Corrigir permissões
chown -R www-data:www-data /var/www/lacos-backend/storage
chmod -R 775 /var/www/lacos-backend/storage
chmod 777 /var/www/lacos-backend/storage/app/temp

# 4. Testar escrita
touch /var/www/lacos-backend/storage/app/temp/test.txt
rm /var/www/lacos-backend/storage/app/temp/test.txt

# 5. Verificar código PHP (adicionar verificação se necessário)
nano /var/www/lacos-backend/app/Services/PdfService.php
```

### Opção 3: Usar Script com Chave SSH

Se você tem chave SSH configurada:

```bash
./scripts/CORRIGIR_PDF_PERMISSOES_COMPLETO.sh
```

## O que o Script Faz

1. ✅ Cria/verifica diretórios necessários (`storage/app/temp`, etc.)
2. ✅ Corrige ownership para `www-data:www-data`
3. ✅ Ajusta permissões para `775` (e `777` no temp se necessário)
4. ✅ Adiciona verificação no código PHP para detectar quando o arquivo não é criado
5. ✅ Verifica logs e espaço em disco

## Verificação Pós-Correção

Após executar o script, teste novamente a geração do PDF no aplicativo. Se ainda não funcionar:

1. **Verifique os logs do Laravel:**
   ```bash
   tail -f /var/www/lacos-backend/storage/logs/laravel.log
   ```

2. **Verifique se o PHP-FPM está rodando com www-data:**
   ```bash
   ps aux | grep php-fpm
   ```

3. **Verifique espaço em disco:**
   ```bash
   df -h /var/www/lacos-backend/storage
   ```

4. **Verifique permissões do diretório temp:**
   ```bash
   ls -la /var/www/lacos-backend/storage/app/temp
   ```

## Código PHP Adicionado

O script adiciona esta verificação no método `generateCertificatePDF()`:

```php
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
```

Isso ajudará a identificar exatamente por que o arquivo não está sendo criado.

