# 🔐 Como Adicionar Endpoint de Trocar Senha

## 📋 Passo a Passo

### 1. Copiar o Controller

O arquivo `ChangePasswordController.php` já foi criado. Copie para o diretório correto:

```bash
cd /var/www/lacos-backend
cp ChangePasswordController.php app/Http/Controllers/Api/ChangePasswordController.php
chown www-data:www-data app/Http/Controllers/Api/ChangePasswordController.php
```

### 2. Adicionar Rota

Adicione a rota no arquivo `routes/api.php` dentro do grupo de rotas autenticadas:

```php
use App\Http\Controllers\Api\ChangePasswordController;

// Dentro do grupo Route::middleware('auth:sanctum')->group(function () {
Route::post('/change-password', [ChangePasswordController::class, 'changePassword']);
```

### 3. Verificar

Teste o endpoint:

```bash
# No servidor
curl -X POST https://gateway.lacosapp.com/api/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "current_password": "senha_atual",
    "new_password": "nova_senha",
    "new_password_confirmation": "nova_senha"
  }'
```

## ✅ Endpoint Criado

**POST** `/api/change-password`

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body:**
```json
{
  "current_password": "senha_atual",
  "new_password": "nova_senha",
  "new_password_confirmation": "nova_senha"
}
```

**Respostas:**

- **200 OK**: Senha alterada com sucesso
- **401**: Não autenticado
- **422**: Dados inválidos (senha atual incorreta, senha muito curta, etc)
- **500**: Erro interno do servidor

