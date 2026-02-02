# 📋 Instruções - Sistema de Planos

## 🚀 Instalação

### 1. Executar Migrations

Execute o script de instalação:

```bash
cd backend-laravel
./INSTALAR_PLANOS.sh
```

Ou execute manualmente:

```bash
php artisan migrate --path=create_plans_table.php
php artisan migrate --path=create_user_plans_table.php
```

### 2. Verificar Rotas

As rotas já foram adicionadas ao arquivo `routes_api_corrigido.php`:

- `GET /api/plans` - Listar todos os planos
- `GET /api/plans/{id}` - Obter um plano específico
- `POST /api/plans` - Criar novo plano
- `PUT /api/plans/{id}` - Atualizar plano
- `DELETE /api/plans/{id}` - Deletar plano
- `GET /api/user/plan` - Obter plano do usuário autenticado

## 📊 Estrutura do Banco de Dados

### Tabela `plans`

```sql
- id (bigint)
- name (string) - Nome do plano
- slug (string, unique) - Identificador único
- is_default (boolean) - Se é o plano padrão
- features (json) - Funcionalidades disponíveis
- created_at, updated_at
```

### Tabela `user_plans`

```sql
- id (bigint)
- user_id (foreign key) - Referência ao usuário
- plan_id (foreign key) - Referência ao plano
- is_active (boolean) - Se o plano está ativo
- started_at (timestamp) - Data de início
- expires_at (timestamp) - Data de expiração (opcional)
- created_at, updated_at
```

## 🎯 Planos Padrão

O sistema cria automaticamente 4 planos:

1. **Básico** (is_default: true) - Plano padrão para novos usuários
2. **Intermediário**
3. **Avançado**
4. **Pleno**

Todos começam com todas as funcionalidades desativadas.

## 🔧 Funcionalidades Configuráveis

Cada plano pode ter as seguintes funcionalidades ativadas/desativadas:

- `grupoCuidados` - Grupo de cuidados
- `historico` - Histórico
- `remedios` - Remédios
- `receitas` - Receitas médicas e prescrições
- `agenda` - Agenda
- `medicos` - Médicos
- `arquivos` - Arquivos
- `midias` - Mídias
- `sinaisVitais` - Sinais vitais
- `configuracoes` - Configurações
- `smartwatch` - Smartwatch (ainda não implementado)
- `sensorQuedas` - Sensor de Quedas (ainda não implementado)
- `cameras` - Câmeras (ainda não implementado)

## 📱 Integração com App Mobile

O app mobile deve verificar o plano do usuário através do endpoint:

```
GET /api/user/plan
```

Este endpoint retorna:
```json
{
  "plan": {
    "id": 1,
    "name": "Básico",
    "slug": "basico",
    "is_default": true,
    "features": {
      "grupoCuidados": true,
      "historico": false,
      ...
    }
  },
  "user_plan": {
    "user_id": 1,
    "plan_id": 1,
    "is_active": true,
    "started_at": "2024-01-01T00:00:00.000000Z"
  }
}
```

## 🔐 Permissões

**Importante**: As rotas de gestão de planos (`/api/plans/*`) devem ser protegidas para apenas usuários root/admin. Adicione middleware de autorização se necessário.

## 🧪 Testando

### 1. Listar Planos

```bash
curl -X GET http://10.102.0.103/api/plans \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 2. Atualizar Plano

```bash
curl -X PUT http://10.102.0.103/api/plans/1 \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "grupoCuidados": true,
      "historico": true,
      "remedios": false
    }
  }'
```

### 3. Obter Plano do Usuário

```bash
curl -X GET http://10.102.0.103/api/user/plan \
  -H "Authorization: Bearer SEU_TOKEN"
```

## ⚠️ Notas Importantes

1. **Plano Padrão**: Não é possível deletar o plano marcado como padrão
2. **Usuários Existentes**: Todos os usuários existentes recebem automaticamente o plano Básico
3. **Novos Usuários**: Novos usuários recebem automaticamente o plano padrão ao se cadastrarem
4. **Plano Ativo**: Um usuário pode ter apenas um plano ativo por vez

