# 🔐 Sistema de Login - Gestão Root

## ✅ O que foi implementado

### Frontend
- **LoginScreen** - Tela de login com validação
- **AuthService** - Serviço de autenticação
- **Proteção de Rotas** - App verifica autenticação antes de mostrar conteúdo
- **Logout** - Botão de sair no sidebar

### Backend
- **AdminAuthController** - Controller para login/logout de admin
- **Rotas** - `/api/admin/login` e `/api/admin/logout`

## 🚀 Como Instalar no Servidor

### 1. Instalar AdminAuthController

```bash
sudo bash /tmp/INSTALAR_ADMIN_AUTH.sh
```

Ou manualmente:

```bash
cd /var/www/lacos-backend
cp /tmp/AdminAuthController.php .
mkdir -p app/Http/Controllers/Api
mv AdminAuthController.php app/Http/Controllers/Api/
chown www-data:www-data app/Http/Controllers/Api/AdminAuthController.php
```

### 2. Verificar Rotas

As rotas já foram adicionadas ao `routes_api_corrigido.php`:
- `POST /api/admin/login` - Login
- `POST /api/admin/logout` - Logout (requer auth)

### 3. Criar Usuário Root

Veja o arquivo `CRIAR_USUARIO_ROOT.md` para instruções.

**Forma rápida:**

```bash
cd /var/www/lacos-backend
php artisan tinker --execute="
\$user = App\Models\User::create([
    'name' => 'Root Admin',
    'email' => 'root@lacos.com',
    'password' => Hash::make('sua_senha_segura'),
    'profile' => 'caregiver',
    'is_blocked' => false,
]);
echo 'Usuário criado: ' . \$user->email;
"
```

## 📱 Como Usar

1. Acesse `http://localhost:3000`
2. A tela de login será exibida
3. Digite email e senha do usuário root
4. Após login, você terá acesso ao sistema de gestão

## 🔒 Segurança

- O login verifica se o usuário está bloqueado
- Tokens são armazenados em `localStorage`
- Logout remove tokens e dados do usuário
- Todas as requisições incluem o token de autenticação

## ⚠️ Importante

Por padrão, qualquer usuário não bloqueado pode fazer login. Se quiser restringir apenas a usuários root específicos, edite o `AdminAuthController.php` e adicione uma verificação:

```php
// Exemplo: apenas email específico
if ($user->email !== 'root@lacos.com') {
    return response()->json([
        'message' => 'Acesso negado. Apenas usuários root podem acessar.'
    ], 403);
}
```

Ou adicione uma coluna `is_root` na tabela `users` e verifique:

```php
if (!$user->is_root) {
    return response()->json([
        'message' => 'Acesso negado. Apenas usuários root podem acessar.'
    ], 403);
}
```

