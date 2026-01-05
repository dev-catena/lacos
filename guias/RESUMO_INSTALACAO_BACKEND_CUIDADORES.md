# 📦 Resumo - Instalação Backend Cuidadores Profissionais

## ✅ Status Atual

**Frontend:** ✅ Implementado (com dados mockados)
**Backend:** ⚠️ Parcialmente implementado

### O que já está no backend:
- ✅ Validação do campo `profile` aceita `professional_caregiver`
- ✅ Campo `profile` retornado automaticamente
- ✅ ENUM atualizado no banco de dados

### O que falta no backend:
- ⚠️ Migrations para novos campos
- ⚠️ Models (CaregiverCourse, CaregiverReview)
- ⚠️ Controller (CaregiverController)
- ⚠️ Rotas na API
- ⚠️ Relacionamentos no Model User

---

## 📁 Arquivos Prontos no Servidor

Todos os arquivos necessários estão em `/tmp/` no servidor:

1. `/tmp/CaregiverController.php` - Controller completo
2. `/tmp/CaregiverCourse.php` - Model de cursos
3. `/tmp/CaregiverReview.php` - Model de avaliações
4. `/tmp/add_caregiver_fields_to_users_table.php` - Migration 1
5. `/tmp/create_caregiver_courses_table.php` - Migration 2
6. `/tmp/create_caregiver_reviews_table.php` - Migration 3

---

## 🚀 Instruções de Instalação

### Passo 1: Conectar ao servidor
```bash
ssh darley@193.203.182.22
cd /var/www/lacos-backend
```

### Passo 2: Criar e configurar migrations

```bash
# Criar migrations
php artisan make:migration add_caregiver_fields_to_users_table
php artisan make:migration create_caregiver_courses_table
php artisan make:migration create_caregiver_reviews_table

# Copiar conteúdo das migrations
sudo cp /tmp/add_caregiver_fields_to_users_table.php database/migrations/$(ls -t database/migrations/*add_caregiver_fields_to_users_table.php | head -1 | xargs basename)
sudo cp /tmp/create_caregiver_courses_table.php database/migrations/$(ls -t database/migrations/*create_caregiver_courses_table.php | head -1 | xargs basename)
sudo cp /tmp/create_caregiver_reviews_table.php database/migrations/$(ls -t database/migrations/*create_caregiver_reviews_table.php | head -1 | xargs basename)
```

### Passo 3: Copiar Models e Controller

```bash
# Copiar controller
sudo cp /tmp/CaregiverController.php app/Http/Controllers/Api/CaregiverController.php
sudo chown www-data:www-data app/Http/Controllers/Api/CaregiverController.php

# Copiar models
sudo cp /tmp/CaregiverCourse.php app/Models/CaregiverCourse.php
sudo cp /tmp/CaregiverReview.php app/Models/CaregiverReview.php
sudo chown www-data:www-data app/Models/CaregiverCourse.php app/Models/CaregiverReview.php
```

### Passo 4: Atualizar Model User

Edite `app/Models/User.php` e adicione no array `$fillable`:
```php
'latitude',
'longitude',
'city',
'neighborhood',
'formation_details',
'hourly_rate',
'availability',
'is_available',
```

E adicione os relacionamentos:
```php
public function caregiverCourses()
{
    return $this->hasMany(CaregiverCourse::class, 'user_id');
}

public function caregiverReviews()
{
    return $this->hasMany(CaregiverReview::class, 'caregiver_id');
}
```

### Passo 5: Adicionar Rotas

Edite `routes/api.php` e adicione no início (imports):
```php
use App\Http\Controllers\Api\CaregiverController;
```

E dentro de `Route::middleware('auth:sanctum')->group(function () {`, adicione:
```php
// Cuidadores Profissionais
Route::get('/caregivers', [CaregiverController::class, 'index']);
Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);
```

### Passo 6: Executar Migrations

```bash
php artisan migrate
```

### Passo 7: Limpar Cache

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

---

## 📋 Endpoints Disponíveis

### GET `/api/caregivers`
Lista cuidadores profissionais

**Query Parameters:**
- `min_rating` (opcional): Avaliação mínima (1-5)
- `max_distance` (opcional): Distância máxima em km
- `latitude` (opcional): Latitude do usuário (para filtro de distância)
- `longitude` (opcional): Longitude do usuário (para filtro de distância)
- `search` (opcional): Busca por nome, cidade ou bairro
- `city` (opcional): Filtrar por cidade
- `formation` (opcional): Filtrar por formação

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Maria Silva",
      "city": "Belo Horizonte",
      "neighborhood": "Centro",
      "rating": 4.8,
      "hourly_rate": 45.00,
      ...
    }
  ],
  "count": 1
}
```

### GET `/api/caregivers/{id}`
Detalhes completos de um cuidador

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Maria Silva",
    "city": "Belo Horizonte",
    "neighborhood": "Centro",
    "rating": 4.8,
    "formation_details": "...",
    "hourly_rate": 45.00,
    "availability": "24 horas",
    "caregiver_courses": [...],
    "reviews": [...]
  }
}
```

### POST `/api/caregivers/{id}/reviews`
Criar/atualizar avaliação

**Body:**
```json
{
  "rating": 5,
  "comment": "Excelente profissional!",
  "group_id": 1
}
```

---

## ✅ Verificação

Após instalar, teste:

```bash
# Listar cuidadores
curl -X GET "http://193.203.182.22/api/caregivers" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Accept: application/json"

# Detalhes
curl -X GET "http://193.203.182.22/api/caregivers/1" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Accept: application/json"
```

---

## 📝 Documentação Completa

Veja o arquivo `INSTALAR_BACKEND_CUIDADORES.md` para documentação detalhada com todos os códigos completos.

