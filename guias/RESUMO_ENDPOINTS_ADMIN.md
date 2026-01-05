# 📋 Resumo - Endpoints Admin Criados

## ✅ Arquivos Criados

1. **AdminUserController.php** - Gestão de usuários
2. **AdminDoctorController.php** - Gestão de médicos
3. **add_is_blocked_to_users.php** - Migration para campo is_blocked
4. **add_doctor_fields_to_users.php** - Migration para campos de médico
5. **INSTALAR_ENDPOINTS_ADMIN.sh** - Script de instalação

## 🚀 Como Instalar no Servidor

### 1. Copiar arquivos para o servidor

Os arquivos já foram copiados para `/tmp/` no servidor.

### 2. Executar no servidor

```bash
sudo bash /tmp/INSTALAR_ENDPOINTS_ADMIN.sh
```

### 3. Verificar rotas

As rotas foram adicionadas ao arquivo `routes_api_corrigido.php`. Verifique se este arquivo está sendo usado nas rotas da API.

## 📡 Endpoints Criados

### Usuários
- `GET /api/admin/users` - Listar todos os usuários
- `POST /api/admin/users/{id}/block` - Bloquear usuário
- `POST /api/admin/users/{id}/unblock` - Desbloquear usuário
- `GET /api/admin/users/{id}/plan` - Obter plano do usuário

### Médicos
- `GET /api/admin/doctors/pending` - Listar médicos pendentes
- `GET /api/admin/doctors` - Listar todos os médicos
- `POST /api/admin/doctors/{id}/approve` - Aprovar médico
- `POST /api/admin/doctors/{id}/reject` - Rejeitar médico
- `POST /api/admin/doctors/{id}/block` - Bloquear médico

## ⚠️ IMPORTANTE - Verificação no Login

**Você precisa adicionar a verificação de bloqueio no método de login do AuthController.**

Veja o arquivo `VERIFICAR_BLOQUEIO_LOGIN.md` para instruções detalhadas.

### Resumo rápido:

No método `login` do AuthController, adicione:

```php
$user = User::where('email', $request->email)->first();

// Verificar se está bloqueado
if ($user && $user->is_blocked) {
    return response()->json([
        'message' => 'Acesso negado. Sua conta foi bloqueada.',
        'error' => 'account_blocked'
    ], 403);
}

// Para médicos, verificar aprovação
if ($user && $user->profile === 'doctor') {
    if (!$user->doctor_approved_at) {
        return response()->json([
            'message' => 'Acesso negado. Sua conta ainda não foi aprovada.',
            'error' => 'account_not_approved'
        ], 403);
    }
}
```

## 🧪 Testar Endpoints

### Listar usuários
```bash
curl -X GET http://193.203.182.22/api/admin/users \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Accept: application/json"
```

### Bloquear usuário
```bash
curl -X POST http://193.203.182.22/api/admin/users/1/block \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Accept: application/json"
```

### Listar médicos pendentes
```bash
curl -X GET http://193.203.182.22/api/admin/doctors/pending \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Accept: application/json"
```

### Aprovar médico
```bash
curl -X POST http://193.203.182.22/api/admin/doctors/1/approve \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Accept: application/json"
```

## 📝 Notas

- Todos os endpoints requerem autenticação (`auth:sanctum`)
- Considere adicionar middleware para verificar se o usuário é root/admin
- Os tokens são revogados quando um usuário/médico é bloqueado
- Médicos aprovados aparecem nas listas, bloqueados não conseguem fazer login

