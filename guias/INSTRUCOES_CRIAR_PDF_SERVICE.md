# 🔧 Instruções para Criar PdfService.php

## Problema
O arquivo `PdfService.php` não existe no servidor, causando erro na geração de PDFs.

## Solução Rápida

### Opção 1: Usar Script Automático (Recomendado)

Execute o script que envia e executa automaticamente:

```bash
./scripts/ENVIAR_CRIAR_PDF_SERVICE.sh
```

### Opção 2: Executar Manualmente

1. **Copie o script para o servidor:**
   ```bash
   scp -P 63022 scripts/CRIAR_PDF_SERVICE.sh darley@192.168.0.20:/tmp/
   ```

2. **Conecte-se ao servidor:**
   ```bash
   ssh -p 63022 darley@192.168.0.20
   ```

3. **Execute o script:**
   ```bash
   chmod +x /tmp/CRIAR_PDF_SERVICE.sh
   /tmp/CRIAR_PDF_SERVICE.sh
   ```

### Opção 3: Criar Manualmente

Se preferir criar manualmente:

1. **Conecte-se ao servidor:**
   ```bash
   ssh -p 63022 darley@192.168.0.20
   ```

2. **Criar diretório se não existir:**
   ```bash
   mkdir -p /var/www/lacos-backend/app/Services
   ```

3. **Criar o arquivo:**
   ```bash
   nano /var/www/lacos-backend/app/Services/PdfService.php
   ```

4. **Cole o conteúdo completo do arquivo** (veja `scripts/CRIAR_PDF_SERVICE.sh` para o conteúdo completo)

5. **Ajustar permissões:**
   ```bash
   sudo chown www-data:www-data /var/www/lacos-backend/app/Services/PdfService.php
   sudo chmod 644 /var/www/lacos-backend/app/Services/PdfService.php
   ```

## O que o Script Faz

1. ✅ Cria o diretório `app/Services` se não existir
2. ✅ Cria o arquivo `PdfService.php` com os métodos:
   - `generateRecipePDF()` - para receitas médicas
   - `generateCertificatePDF()` - para atestados médicos
3. ✅ Inclui verificação para detectar quando o arquivo não é criado
4. ✅ Ajusta permissões para `www-data:www-data`

## Verificação

Após criar o arquivo, verifique:

```bash
# Verificar se o arquivo existe
ls -la /var/www/lacos-backend/app/Services/PdfService.php

# Verificar conteúdo
grep -A 5 "generateCertificatePDF" /var/www/lacos-backend/app/Services/PdfService.php
```

## Próximos Passos

1. Teste a geração do PDF novamente no aplicativo
2. Se ainda não funcionar, verifique os logs:
   ```bash
   tail -f /var/www/lacos-backend/storage/logs/laravel.log
   ```


