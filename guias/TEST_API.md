# 🧪 Script de Teste da API

Execute estes comandos no servidor para testar a API:

## 1. Criar usuário de teste
```bash
curl -X POST http://localhost/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "App Laços Test",
    "email": "app@lacos.com",
    "password": "lacos2025",
    "password_confirmation": "lacos2025",
    "phone": "11987654321",
    "birth_date": "1990-01-01",
    "gender": "other"
  }'
```

## 2. Fazer login
```bash
curl -X POST http://localhost/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "app@lacos.com",
    "password": "lacos2025"
  }'
```

## 3. Testar endpoint protegido (usar token do passo 2)
```bash
TOKEN="cole_o_token_aqui"

curl -X GET http://localhost/api/user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

## 4. Criar grupo
```bash
TOKEN="cole_o_token_aqui"

curl -X POST http://localhost/api/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Família Teste",
    "accompanied_name": "Paciente Teste",
    "accompanied_birth_date": "1950-01-15",
    "accompanied_gender": "female"
  }'
```

## 5. Criar medicamento
```bash
TOKEN="cole_o_token_aqui"
GROUP_ID="cole_o_id_do_grupo_aqui"

curl -X POST http://localhost/api/medications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"group_id\": $GROUP_ID,
    \"name\": \"Losartana\",
    \"form\": \"pill\",
    \"dosage\": \"50\",
    \"unit\": \"mg\",
    \"administration_route\": \"oral\",
    \"frequency_type\": \"hours\",
    \"frequency_details\": {\"hours\": 12},
    \"first_dose_at\": \"2025-11-23T08:00:00Z\",
    \"duration_type\": \"continuous\",
    \"is_active\": true
  }"
```
