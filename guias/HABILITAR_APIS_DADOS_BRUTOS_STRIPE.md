# 🔓 Habilitar APIs de Dados Brutos do Stripe (Desenvolvimento/Teste)

## ⚠️ Importante
Esta configuração é **apenas para desenvolvimento e teste**. Em produção, use Stripe Elements ou tokens.

## Passos

### 1. Acessar o Stripe Dashboard
1. Acesse: https://dashboard.stripe.com/test/settings/payment_methods
2. Faça login na sua conta Stripe

### 2. Habilitar "Raw card data APIs"
1. Na página de configurações, procure por **"Raw card data APIs"** ou **"Enable raw card data APIs"**
2. Ative a opção para permitir o envio direto de dados de cartão
3. Salve as alterações

### 3. Alternativa: Via Suporte
Se não encontrar a opção:
1. Acesse: https://support.stripe.com/questions/enabling-access-to-raw-card-data-apis
2. Entre em contato com o suporte do Stripe
3. Solicite a habilitação das APIs de dados brutos para sua conta de teste

## ⚠️ Aviso
- Esta funcionalidade é apenas para **contas de teste**
- Em produção, sempre use Stripe Elements ou tokens
- Não armazene dados de cartão no seu servidor

