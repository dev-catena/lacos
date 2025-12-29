# Como Obter o GROUP_ID

## Opção 1: Via Banco de Dados (Mais Rápido)

Execute no servidor:

```bash
cd /var/www/lacos-backend

# Descobrir nome do banco
DB_NAME=$(sudo grep "^DB_DATABASE=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')

# Listar grupos
sudo mysql $DB_NAME -e "SELECT id as group_id, name as nome FROM \`groups\` ORDER BY created_at DESC LIMIT 10;"
```

**Importante:** Use backticks (`` `groups` ``) porque `groups` é palavra reservada no MySQL.

## Opção 2: Via API (Requer Login)

### 1. Fazer login e obter token:

```bash
TOKEN=$(curl -s -X POST "http://193.203.182.22/api/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"seu_email@exemplo.com","password":"sua_senha"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)
```

### 2. Listar grupos do usuário:

```bash
curl -X GET "http://193.203.182.22/api/groups" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/json" \
  | python3 -m json.tool
```

A resposta mostrará os grupos com seus IDs:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Grupo da Família",
      ...
    },
    {
      "id": 2,
      "name": "Grupo de Cuidados",
      ...
    }
  ]
}
```

## Opção 3: Usar o Script Automático

Execute o script `LISTAR_GRUPOS.txt` que lista automaticamente:

```bash
# Copie e cole o conteúdo de LISTAR_GRUPOS.txt no terminal
```

## Opção 4: Ver no App Mobile

1. Abra o app e faça login
2. Acesse a tela de grupos
3. O ID do grupo pode ser visto na URL ou nos logs do app (se habilitados)

---

**💡 Dica:** Use o `group_id` da primeira coluna nos testes da API do sensor de queda.

