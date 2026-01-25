# 🔗 Conexão Backend - Sistema de Planos

## ✅ O que foi criado

### Backend Laravel

1. **Migrations**
   - `create_plans_table.php` - Cria tabela de planos com 4 planos padrão
   - `create_user_plans_table.php` - Cria tabela de relacionamento usuário-plano

2. **Models**
   - `Plan.php` - Model para planos
   - Relacionamentos com usuários

3. **Controller**
   - `PlanController.php` - CRUD completo de planos
   - Endpoint para obter plano do usuário autenticado

4. **Rotas**
   - Adicionadas ao `routes_api_corrigido.php`
   - Todas as rotas protegidas com `auth:sanctum`

### Aplicação Web

A aplicação web já está configurada para se conectar ao backend em:
- URL: `http://10.102.0.103/api`
- Endpoints: `/api/plans/*`

## 🚀 Como Instalar

### 1. No Servidor (Backend Laravel)

```bash
cd /var/www/lacos-backend  # ou caminho do seu Laravel
./INSTALAR_PLANOS.sh
```

Ou manualmente:

```bash
php artisan migrate --path=create_plans_table.php
php artisan migrate --path=create_user_plans_table.php
```

### 2. Verificar Rotas

As rotas já estão adicionadas. Verifique se o arquivo `routes_api_corrigido.php` está sendo usado nas rotas da API.

Se não estiver, copie as rotas para o arquivo correto:

```php
use App\Http\Controllers\Api\PlanController;

// Dentro do grupo auth:sanctum
Route::apiResource('plans', PlanController::class);
Route::get('/user/plan', [PlanController::class, 'getUserPlan']);
```

## 📡 Endpoints Disponíveis

### Gestão de Planos (Root User)

- `GET /api/plans` - Listar todos os planos
- `GET /api/plans/{id}` - Obter um plano específico
- `POST /api/plans` - Criar novo plano
- `PUT /api/plans/{id}` - Atualizar plano
- `DELETE /api/plans/{id}` - Deletar plano

### Plano do Usuário

- `GET /api/user/plan` - Obter plano do usuário autenticado

## 🔧 Configuração da Aplicação Web

A aplicação web já está configurada para usar a API. O serviço `plansService.js` está configurado para:

1. Buscar planos do backend
2. Salvar alterações no backend
3. Usar dados padrão se a API não estiver disponível (fallback)

## 📱 Integração com App Mobile

O app mobile deve verificar o plano do usuário ao fazer login:

```javascript
// Exemplo de uso no app mobile
const response = await api.get('/user/plan');
const { plan } = response.data;

// Verificar se funcionalidade está disponível
if (plan.features.grupoCuidados) {
  // Mostrar card de Grupo de Cuidados
}
```

## 🧪 Testando a Conexão

### 1. Testar do Backend

```bash
# Listar planos
curl -X GET http://10.102.0.103/api/plans \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Accept: application/json"
```

### 2. Testar da Aplicação Web

1. Acesse `http://localhost:3000`
2. A aplicação tentará buscar os planos do backend
3. Se a API estiver disponível, os dados virão do backend
4. Se não, usará dados padrão

### 3. Verificar no Banco de Dados

```sql
-- Ver planos
SELECT * FROM plans;

-- Ver planos dos usuários
SELECT u.name, p.name as plan_name, up.is_active
FROM user_plans up
JOIN users u ON u.id = up.user_id
JOIN plans p ON p.id = up.plan_id
WHERE up.is_active = 1;
```

## ⚠️ Importante

1. **Autenticação**: A aplicação web precisa ter um token válido em `localStorage` com a chave `@lacos:token`
2. **CORS**: Configure o CORS no Laravel para aceitar requisições de `http://localhost:3000`
3. **Permissões**: As rotas de gestão devem ser restritas a usuários root/admin

## 📝 Próximos Passos

1. ✅ Backend criado
2. ✅ Rotas adicionadas
3. ✅ Aplicação web conectada
4. ⏳ Executar migrations no servidor
5. ⏳ Configurar CORS se necessário
6. ⏳ Integrar verificação de planos no app mobile

## 🐛 Troubleshooting

### Erro 401 (Unauthorized)
- Verifique se o token está sendo enviado
- Verifique se o token é válido

### Erro 404 (Not Found)
- Verifique se as rotas estão registradas
- Verifique se o arquivo de rotas está sendo usado

### Erro 500 (Server Error)
- Verifique os logs do Laravel
- Verifique se as migrations foram executadas
- Verifique se o Model Plan está no namespace correto

