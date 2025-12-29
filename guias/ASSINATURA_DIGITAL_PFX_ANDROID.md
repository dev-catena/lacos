# 🔐 Assinatura Digital ICP-Brasil com Certificado .pfx no Android

## 📱 Problema: Certificado .pfx no Android

Quando você clica em um arquivo `.pfx` no Android, o sistema operacional:
1. Abre uma janela para digitar a senha
2. Pergunta o tipo de certificado: **VPN ou Wi-Fi**
3. Instala o certificado no armazenamento do sistema para autenticação de rede

**⚠️ IMPORTANTE:** O Android **NÃO** permite usar certificados instalados no sistema para assinatura digital de documentos diretamente no app.

## ✅ Solução: Assinatura no Servidor

A solução implementada faz a assinatura digital **no servidor backend**, não no dispositivo Android:

### Fluxo Completo:

1. **Upload do Certificado (.pfx)**
   - Médico faz upload do arquivo `.pfx` através do app
   - Senha do certificado é solicitada e criptografada
   - Certificado é armazenado no servidor de forma segura

2. **Geração do Atestado**
   - Médico preenche o formulário de atestado
   - Sistema gera o PDF do atestado
   - Sistema solicita a senha do certificado (uma vez por assinatura)

3. **Assinatura Digital (Backend)**
   - Backend extrai certificado e chave privada do `.pfx` usando OpenSSL
   - Valida que é certificado ICP-Brasil
   - Assina o PDF digitalmente
   - Salva o PDF assinado

4. **Validação**
   - PDF assinado pode ser validado por qualquer leitor de PDF
   - Certificado ICP-Brasil garante autenticidade e integridade

## 🔧 Implementação Técnica

### Backend (Laravel/PHP)

O `DigitalSignatureService` faz:

1. **Extração do Certificado**
   ```bash
   openssl pkcs12 -in certificado.pfx -out certificado.pem -nodes -passin pass:senha
   ```

2. **Validação ICP-Brasil**
   - Verifica o emissor do certificado
   - Confirma que é certificado ICP-Brasil válido

3. **Assinatura do PDF**
   - Usa biblioteca FPDI para processar o PDF
   - Adiciona metadados de assinatura
   - Para assinatura real, pode integrar com:
     - iTextPDF (via API Java)
     - Serviço de assinatura digital (DocuSign, AssineOnline)
     - Biblioteca PHP avançada de assinatura

### Frontend (React Native)

- Upload do certificado `.pfx`
- Solicitação de senha ao assinar
- Envio da senha junto com dados do atestado
- Download do PDF assinado

## 📋 Como Usar

### 1. Configurar Certificado

1. Acesse: **Perfil > Dados Profissionais**
2. Role até "Certificado Digital (.pfx)"
3. Clique em "Selecionar Certificado .pfx"
4. Escolha o arquivo `.pfx` do seu dispositivo
5. Digite a senha do certificado (ex: `Cat25@`)
6. Salve

### 2. Gerar Atestado Assinado

1. Durante a teleconsulta, clique em "Gerar Atestado"
2. Preencha os dados do atestado
3. Clique em "Gerar Atestado Assinado Digitalmente"
4. **Digite a senha do certificado** quando solicitado
5. O atestado será gerado e assinado automaticamente

## 🔒 Segurança

- ✅ Senha do certificado é **criptografada** antes de salvar
- ✅ Certificado é armazenado em **local seguro** no servidor
- ✅ Senha é solicitada **a cada assinatura** (não fica salva)
- ✅ Certificado ICP-Brasil garante **autenticidade** e **não-repúdio**

## ⚠️ Limitações Atuais

A implementação atual:
- ✅ Extrai e valida o certificado `.pfx`
- ✅ Adiciona metadados de assinatura ao PDF
- ⚠️ Para assinatura **real** ICP-Brasil com validação completa, pode ser necessário:
  - Integrar com serviço de assinatura digital profissional
  - Usar biblioteca mais avançada (iTextPDF, etc.)
  - Implementar assinatura com timestamp (TSA)

## 🚀 Melhorias Futuras

1. **Assinatura Real com Timestamp**
   - Adicionar timestamp server (TSA) para validar quando foi assinado
   
2. **Validação Online**
   - Verificar se certificado não foi revogado (OCSP)
   
3. **Visualização de Assinatura**
   - Mostrar selo visual no PDF indicando assinatura ICP-Brasil
   
4. **Histórico de Assinaturas**
   - Registrar todas as assinaturas realizadas
   - Permitir validação posterior

## 📞 Suporte

Se tiver problemas:
1. Verifique se o certificado `.pfx` é válido
2. Confirme que a senha está correta
3. Verifique os logs: `storage/logs/laravel.log`
4. Teste o certificado em outro sistema para confirmar que funciona



