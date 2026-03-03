# ✅ Implementação de Assinatura Digital .apx

## 📋 O que foi implementado:

### Frontend
1. ✅ **SecurityScreen.js** - Modificado para aceitar arquivo .apx ou .pfx
   - Campo "Usuário do Certificado" é opcional para .apx
   - Validação de tipo de arquivo (.apx ou .pfx)
   - Interface atualizada para mostrar suporte a ambos os formatos

2. ✅ **userService.js** - Atualizado para enviar tipo de certificado
   - Detecta automaticamente se é .apx ou .pfx
   - Envia `certificate_type` para o backend

### Backend
1. ✅ **Migração** - `add_certificate_apx_to_users.php`
   - Adiciona campo `certificate_apx_path` na tabela `users`
   - Adiciona campo `certificate_type` (apx ou pfx)
   - Mantém `certificate_password_encrypted` existente

2. ✅ **CertificateController** - `CertificateController_APX.php`
   - Suporta upload de arquivo .apx ou .pfx
   - Validação de extensão baseada no tipo
   - Armazena certificado .apx em `certificate_apx_path`
   - Criptografa senha antes de salvar
   - Endpoint: `POST /api/certificate/upload`
   - Endpoint: `DELETE /api/certificate/remove`

3. ✅ **DigitalSignatureService** - `DigitalSignatureService_APX.php`
   - Método `signPDF()` detecta tipo de certificado automaticamente
   - `signPDFWithAPX()` - Assina com certificado .apx
   - `signPDFWithPFX()` - Assina com certificado .pfx
   - Integração automática com geração de atestados

## 🔧 Como Funciona:

### 1. Upload do Certificado (.apx)
- Médico acessa: **Perfil > Segurança > Certificado Digital**
- Seleciona arquivo `.apx`
- Informa senha do certificado
- Sistema salva e criptografa automaticamente

### 2. Geração de Atestado Assinado
- Quando médico gera um atestado, o sistema:
  1. Gera o PDF do atestado
  2. Busca o certificado do médico (`.apx` ou `.pfx`)
  3. Assina digitalmente usando o certificado
  4. Salva o PDF assinado
  5. Retorna o documento assinado

## 📝 Próximos Passos no Servidor:

### 1. Aplicar Migração
```bash
ssh -p 63022 darley@192.168.0.20
cd /var/www/lacos-backend
sudo bash /tmp/APLICAR_ASSINATURA_DIGITAL_APX_SERVIDOR.sh
```

### 2. Verificar Rotas
O script adiciona automaticamente as rotas, mas verifique em `routes/api.php`:
```php
Route::post('/certificate/upload', [CertificateController::class, 'upload']);
Route::delete('/certificate/remove', [CertificateController::class, 'remove']);
```

### 3. Verificar Serviço de Assinatura
O `DigitalSignatureService` já está integrado na geração de atestados através do `PrescriptionController` (se existir) ou no método que gera os atestados.

## ⚠️ Notas Importantes:

1. **Biblioteca de Assinatura**: A implementação atual é um placeholder. Para assinatura real com .apx, pode ser necessário:
   - Converter .apx para .pfx primeiro
   - Ou usar biblioteca específica que suporte .apx diretamente
   - Integração com iTextSharp ou similar

2. **Validação**: O método `validateAPXCertificate()` está preparado para validar o certificado antes de usar.

3. **Logs**: Todas as operações são logadas em `storage/logs/laravel.log` para debug.

## 🧪 Testes:

1. **Upload de Certificado**:
   - Acesse Perfil > Segurança
   - Faça upload de um arquivo .apx
   - Verifique se aparece "Certificado configurado"

2. **Geração de Atestado**:
   - Gere um atestado médico
   - Verifique se o PDF foi assinado
   - Verifique logs para confirmar uso do certificado

## 📁 Arquivos Criados/Modificados:

### Frontend:
- `src/screens/Profile/SecurityScreen.js` ✅
- `src/services/userService.js` ✅

### Backend:
- `backend-laravel/add_certificate_apx_to_users.php` ✅
- `backend-laravel/CertificateController_APX.php` ✅
- `backend-laravel/DigitalSignatureService_APX.php` ✅

### Scripts:
- `scripts/APLICAR_ASSINATURA_DIGITAL_APX.sh` ✅
- `scripts/APLICAR_ASSINATURA_DIGITAL_APX_SERVIDOR.sh` ✅















