# 🔐 Fluxo Completo de Aprovação de Médicos

## 📋 Visão Geral

Sistema completo de aprovação e ativação de contas de médicos com as seguintes etapas:

1. **Registro**: Médico cria conta → recebe mensagem de análise
2. **Aprovação**: Root aprova → email é enviado com link de ativação
3. **Ativação**: Médico clica no link → conta é ativada
4. **Login**: Médico pode fazer login normalmente

---

## 🔄 Fluxo Detalhado

### 1️⃣ Registro do Médico

**Endpoint**: `POST /api/register`

**Comportamento**:
- Médico preenche formulário de cadastro
- Sistema cria conta mas **NÃO gera token**
- Retorna mensagem: `"Seu processo está em análise. Acompanhe pelo seu email."`
- Status: `pending_approval`

**Frontend**:
- Mostra alerta com a mensagem
- Redireciona para tela de login
- Médico **NÃO pode fazer login** ainda

---

### 2️⃣ Aprovação pelo Root

**Endpoint**: `POST /api/admin/doctors/{id}/approve`

**Comportamento**:
- Root clica em "Aprovar" no painel web
- Sistema:
  - Define `doctor_approved_at = now()`
  - Gera token de ativação (64 caracteres, válido por 7 dias)
  - Salva `doctor_activation_token` e `doctor_activation_token_expires_at`
  - Envia email com link de ativação

**Email Enviado**:
- Assunto: "Ative sua conta de médico - Laços"
- Link: `http://193.203.182.22/api/doctors/activate?token=xxx`
- Válido por 7 dias

---

### 3️⃣ Ativação via Email

**Endpoint**: `GET /api/doctors/activate?token=xxx`

**Comportamento**:
- Médico clica no link do email
- Sistema verifica:
  - Token existe
  - Token não expirou (7 dias)
  - Médico existe
- Remove token (ativa conta)
- Retorna: `"Conta ativada com sucesso! Você já pode fazer login."`

**Frontend** (se implementado):
- Pode mostrar página de sucesso
- Ou redirecionar para login

---

### 4️⃣ Login do Médico

**Endpoint**: `POST /api/login`

**Validações**:
1. ✅ Conta não está bloqueada
2. ✅ Médico foi aprovado (`doctor_approved_at` não é null)
3. ✅ Médico ativou conta (`doctor_activation_token` é null)

**Mensagens de Erro**:

| Situação | Mensagem | Status Code |
|----------|----------|-------------|
| Não aprovado | "Seu processo está em análise. Acompanhe pelo seu email." | 403 |
| Aprovado mas não ativado | "Por favor, ative sua conta clicando no link enviado por email." | 403 |
| Conta bloqueada | "Acesso negado. Sua conta foi bloqueada." | 403 |

---

## 🗄️ Campos do Banco de Dados

### Tabela `users`

```sql
doctor_approved_at TIMESTAMP NULL          -- Data de aprovação pelo root
doctor_activation_token VARCHAR(64) NULL   -- Token de ativação (gerado na aprovação)
doctor_activation_token_expires_at TIMESTAMP NULL  -- Expiração do token (7 dias)
```

---

## 📁 Arquivos Modificados

### Backend

1. **`app/Http/Controllers/Api/AuthController.php`**
   - `register()`: Retorna mensagem específica para médicos
   - `login()`: Verifica aprovação e ativação de médicos

2. **`app/Http/Controllers/Api/AdminDoctorController.php`**
   - `approve()`: Gera token e envia email
   - `activate()`: Ativa conta via token
   - `sendActivationEmail()`: Envia email com link

3. **`routes/api.php`**
   - Rota pública: `GET /api/doctors/activate`

### Frontend (Mobile)

1. **`src/contexts/AuthContext.js`**
   - `signUp()`: Trata `requires_approval`
   - `signIn()`: Trata erros de aprovação/ativação

2. **`src/screens/Auth/RegisterScreen.js`**
   - Mostra mensagem específica para médicos

3. **`src/screens/Auth/LoginScreen.js`**
   - Mostra mensagens específicas de erro

---

## 🚀 Instalação

### No Servidor

```bash
cd /var/www/lacos-backend
bash APLICAR_APROVACAO_MEDICO.sh
```

O script:
1. Adiciona campos no banco de dados
2. Verifica sintaxe dos controllers
3. Adiciona rota de ativação
4. Limpa cache

---

## 🧪 Teste Completo

### 1. Criar Conta de Médico

```bash
curl -X POST http://193.203.182.22/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Teste",
    "email": "teste@medico.com",
    "password": "123456",
    "password_confirmation": "123456",
    "profile": "doctor",
    "gender": "Masculino",
    "city": "Belo Horizonte",
    "neighborhood": "Centro",
    "crm": "12345",
    "medical_specialty_id": 1
  }'
```

**Resposta Esperada**:
```json
{
  "success": true,
  "user": {...},
  "message": "Seu processo está em análise. Acompanhe pelo seu email.",
  "requires_approval": true,
  "status": "pending_approval"
}
```

### 2. Tentar Login (Deve Falhar)

```bash
curl -X POST http://193.203.182.22/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@medico.com",
    "password": "123456"
  }'
```

**Resposta Esperada**:
```json
{
  "success": false,
  "message": "Seu processo está em análise. Acompanhe pelo seu email.",
  "error": "doctor_pending_approval",
  "status": "pending_approval"
}
```

### 3. Root Aprova Médico

```bash
curl -X POST http://193.203.182.22/api/admin/doctors/{id}/approve \
  -H "Authorization: Bearer {token_root}" \
  -H "Content-Type: application/json"
```

**Resposta Esperada**:
```json
{
  "message": "Médico aprovado com sucesso. Email de ativação enviado.",
  "doctor": {...}
}
```

**Email Enviado** com link:
```
http://193.203.182.22/api/doctors/activate?token=xxx
```

### 4. Tentar Login (Ainda Deve Falhar - Não Ativado)

```bash
curl -X POST http://193.203.182.22/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@medico.com",
    "password": "123456"
  }'
```

**Resposta Esperada**:
```json
{
  "success": false,
  "message": "Por favor, ative sua conta clicando no link enviado por email.",
  "error": "doctor_pending_activation",
  "status": "pending_activation"
}
```

### 5. Ativar Conta via Link

```bash
curl "http://193.203.182.22/api/doctors/activate?token=xxx"
```

**Resposta Esperada**:
```json
{
  "success": true,
  "message": "Conta ativada com sucesso! Você já pode fazer login.",
  "doctor": {...}
}
```

### 6. Login (Agora Deve Funcionar)

```bash
curl -X POST http://193.203.182.22/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@medico.com",
    "password": "123456"
  }'
```

**Resposta Esperada**:
```json
{
  "success": true,
  "user": {...},
  "token": "xxx"
}
```

---

## ⚠️ Observações

1. **Email**: O sistema usa `mail()` nativo do PHP. Para produção, configure SMTP no `.env`:
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=seu-email@gmail.com
   MAIL_PASSWORD=sua-senha
   MAIL_ENCRYPTION=tls
   ```

2. **Token de Ativação**: Válido por 7 dias. Após expirar, root precisa reenviar email.

3. **Segurança**: Token é único, aleatório (64 caracteres) e expira automaticamente.

4. **Frontend Web**: Pode criar página `/activate-doctor?token=xxx` para melhor UX.

---

## 🔍 Troubleshooting

### Email não está sendo enviado

```bash
# Verificar logs
tail -f /var/www/lacos-backend/storage/logs/laravel.log | grep -i email

# Testar mail() do PHP
php -r "mail('teste@email.com', 'Teste', 'Mensagem de teste');"
```

### Token inválido ou expirado

```bash
# Verificar token no banco
mysql -u root -p lacos_db -e "SELECT id, email, doctor_activation_token, doctor_activation_token_expires_at FROM users WHERE profile='doctor';"
```

### Médico não consegue fazer login após ativação

```bash
# Verificar se token foi removido
mysql -u root -p lacos_db -e "SELECT id, email, doctor_approved_at, doctor_activation_token FROM users WHERE email='teste@medico.com';"
```

---

## ✅ Checklist de Implementação

- [x] Modificar `register()` para médicos
- [x] Modificar `login()` para verificar aprovação/ativação
- [x] Adicionar campos no banco de dados
- [x] Modificar `approve()` para gerar token e enviar email
- [x] Criar endpoint `activate()`
- [x] Criar template de email
- [x] Atualizar frontend para tratar mensagens
- [x] Adicionar rota pública de ativação
- [x] Testar fluxo completo

---

**Última atualização**: 2025-12-14

