# 📡 Endpoint: POST /api/login

## URL Completa
```
http://10.102.0.103/api/login
```

## Método HTTP
```
POST
```

## Parâmetros POST (Body JSON)

### Obrigatórios:
- **`email`** (string, obrigatório, formato email)
  - Email do usuário
  - Exemplo: `"usuario@exemplo.com"`

- **`password`** (string, obrigatório)
  - Senha do usuário
  - Exemplo: `"senha123"`

## Headers

```
Content-Type: application/json
Accept: application/json
```

## Exemplo de Requisição

### cURL
```bash
curl -X POST http://10.102.0.103/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

### JavaScript (Fetch)
```javascript
const response = await fetch('http://10.102.0.103/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
    email: 'usuario@exemplo.com',
    password: 'senha123'
  })
});

const data = await response.json();
```

### JavaScript (Axios)
```javascript
const response = await axios.post('http://10.102.0.103/api/login', {
  email: 'usuario@exemplo.com',
  password: 'senha123'
}, {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});
```

## Respostas

### ✅ Sucesso (200 OK)
```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "Nome do Usuário",
    "email": "usuario@exemplo.com",
    "profile": "patient",
    ...
  }
}
```

### ❌ Erro: Credenciais Inválidas (401)
```json
{
  "success": false,
  "message": "Credenciais inválidas"
}
```

### ❌ Erro: Dados Inválidos (422)
```json
{
  "success": false,
  "message": "Dados inválidos",
  "errors": {
    "email": ["O campo email é obrigatório."],
    "password": ["O campo password é obrigatório."]
  }
}
```

### ❌ Erro: Conta Bloqueada (403)
```json
{
  "success": false,
  "message": "Acesso negado. Sua conta foi bloqueada.",
  "error": "account_blocked"
}
```

### ❌ Erro: Médico Pendente de Aprovação (403)
```json
{
  "success": false,
  "message": "Seu processo está em análise. Acompanhe pelo seu email.",
  "error": "doctor_pending_approval",
  "status": "pending_approval"
}
```

### ❌ Erro: Médico Não Ativado (403)
```json
{
  "success": false,
  "message": "Por favor, ative sua conta através do link enviado por email.",
  "error": "doctor_not_activated"
}
```

### ⚠️ Resposta: Requer 2FA (200 com requires_2fa)
Se o usuário tiver 2FA ativado:
```json
{
  "success": false,
  "requires_2fa": true,
  "message": "Código enviado via WhatsApp",
  "session_token": "temporary_session_token_here"
}
```

Neste caso, é necessário chamar `/api/2fa/login/verify` com o código recebido.

## Validações

- **email**: 
  - Obrigatório
  - Deve ser um email válido
  - Exemplo válido: `"usuario@exemplo.com"`
  - Exemplo inválido: `"usuario"` ou `"usuario@"`

- **password**: 
  - Obrigatório
  - Deve ser uma string
  - Não há validação de tamanho mínimo no endpoint (mas pode haver no backend)

## Notas Importantes

1. **Token de Autenticação**: 
   - Após login bem-sucedido, o token deve ser salvo e enviado em requisições subsequentes
   - Header: `Authorization: Bearer {token}`

2. **2FA (Autenticação de Dois Fatores)**:
   - Se o usuário tiver 2FA ativado, a resposta será `requires_2fa: true`
   - É necessário chamar `/api/2fa/login/verify` com o código recebido via WhatsApp

3. **Médicos**:
   - Médicos precisam ser aprovados pelo root/admin
   - Médicos precisam ativar a conta via link do email
   - Se não estiver aprovado ou ativado, retorna erro 403

4. **Contas Bloqueadas**:
   - Se a conta estiver bloqueada (`is_blocked = true`), retorna erro 403

## Exemplo Completo de Uso

```javascript
async function fazerLogin(email, password) {
  try {
    const response = await fetch('http://10.102.0.103/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.requires_2fa) {
      // Requer código 2FA
      return {
        success: false,
        requires2FA: true,
        message: data.message,
        sessionToken: data.session_token
      };
    }

    if (data.success && data.token) {
      // Login bem-sucedido
      // Salvar token e dados do usuário
      localStorage.setItem('@lacos:token', data.token);
      localStorage.setItem('@lacos:user', JSON.stringify(data.user));
      
      return {
        success: true,
        user: data.user,
        token: data.token
      };
    }

    // Erro
    return {
      success: false,
      message: data.message || 'Erro ao fazer login'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão: ' + error.message
    };
  }
}
```

