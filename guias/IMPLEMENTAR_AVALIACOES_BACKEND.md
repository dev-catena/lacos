# 🔧 Implementar Funcionalidade de Avaliações no Backend

## 📋 O que foi criado

1. **CaregiverController atualizado** (`/tmp/CaregiverController_REVIEW.php`)
   - Método `createReview()` implementado
   - Validação de dados (rating 1-5, comment 10-500 caracteres)
   - Suporte para criar ou atualizar avaliação existente
   - Associação automática com grupo (se usuário e cuidador estiverem no mesmo grupo)

2. **Model CaregiverReview** (`/tmp/CaregiverReview_MODEL.php`)
   - Relacionamentos com User (caregiver e author) e Group
   - Campos fillable configurados

3. **Script de atualização** (`/tmp/ATUALIZAR_AVALIACOES_BACKEND.sh`)
   - Copia arquivos necessários
   - Verifica e cria migration se necessário
   - Adiciona rotas se não existirem
   - Limpa cache

## 🚀 Como executar no servidor

### Opção 1: Executar script automático (Recomendado)

```bash
ssh darley@192.168.0.20
sudo bash /tmp/ATUALIZAR_AVALIACOES_BACKEND.sh
```

### Opção 2: Executar manualmente

```bash
ssh darley@192.168.0.20
cd /var/www/lacos-backend

# 1. Fazer backup do controller atual
sudo cp app/Http/Controllers/Api/CaregiverController.php app/Http/Controllers/Api/CaregiverController.php.bak

# 2. Copiar novo controller
sudo cp /tmp/CaregiverController_REVIEW.php app/Http/Controllers/Api/CaregiverController.php
sudo chown www-data:www-data app/Http/Controllers/Api/CaregiverController.php

# 3. Copiar modelo
sudo cp /tmp/CaregiverReview_MODEL.php app/Models/CaregiverReview.php
sudo chown www-data:www-data app/Models/CaregiverReview.php

# 4. Verificar se a rota existe
grep "Route::post('/caregivers/{id}/reviews'" routes/api.php

# Se não existir, adicionar manualmente em routes/api.php:
# - Adicionar import: use App\Http\Controllers\Api\CaregiverController;
# - Adicionar rota dentro do grupo auth:sanctum:
#   Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);

# 5. Verificar migration
ls -la database/migrations/*caregiver_reviews*.php

# Se não existir, criar migration manualmente ou executar:
php artisan make:migration create_caregiver_reviews_table

# 6. Executar migration (se necessário)
php artisan migrate --path=database/migrations/*caregiver_reviews*.php --force

# 7. Limpar cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# 8. Verificar rotas
php artisan route:list | grep caregivers
```

## ✅ Verificação

Após executar, verifique se:

1. **Rotas estão registradas:**
```bash
php artisan route:list | grep caregivers
```

Deve mostrar:
```
GET|HEAD  api/caregivers ................. caregivers.index
GET|HEAD  api/caregivers/{id} ............ caregivers.show
POST      api/caregivers/{id}/reviews .... caregivers.createReview
```

2. **Tabela existe:**
```bash
php artisan tinker
>>> Schema::hasTable('caregiver_reviews')
=> true
```

3. **Model funciona:**
```bash
php artisan tinker
>>> \App\Models\CaregiverReview::count()
=> 0 (ou número de avaliações existentes)
```

## 📡 Endpoint de Avaliação

### POST `/api/caregivers/{id}/reviews`

**Autenticação:** Requerida (Bearer token)

**Body:**
```json
{
  "rating": 5,
  "comment": "Excelente cuidador, muito atencioso e profissional."
}
```

**Validações:**
- `rating`: obrigatório, inteiro, entre 1 e 5
- `comment`: obrigatório, string, entre 10 e 500 caracteres

**Resposta de sucesso (201):**
```json
{
  "success": true,
  "message": "Avaliação criada com sucesso",
  "data": {
    "id": 1,
    "rating": 5,
    "comment": "Excelente cuidador, muito atencioso e profissional."
  }
}
```

**Resposta de atualização (200):**
```json
{
  "success": true,
  "message": "Avaliação atualizada com sucesso",
  "data": {
    "id": 1,
    "rating": 4,
    "comment": "Muito bom, mas poderia melhorar a pontualidade."
  }
}
```

**Erros possíveis:**
- `401`: Usuário não autenticado
- `404`: Cuidador não encontrado
- `422`: Dados inválidos (validação falhou)
- `500`: Erro interno do servidor

## 🔄 Comportamento

- **Primeira avaliação:** Cria nova avaliação
- **Avaliação existente:** Atualiza a avaliação anterior do mesmo usuário
- **Grupo:** Se o usuário e o cuidador estiverem no mesmo grupo, a avaliação será associada a esse grupo
- **Limite:** Um usuário pode ter apenas uma avaliação por cuidador (único por `caregiver_id` + `author_id`)

## 📝 Notas

- A avaliação é vinculada ao grupo apenas se ambos (autor e cuidador) estiverem no mesmo grupo
- Se não houver grupo em comum, `group_id` será `null`
- O método `show()` do CaregiverController já retorna as avaliações com informações do autor e grupo

