# 🔧 Instalação Backend - Funcionalidade de Cuidadores Profissionais

## 📋 Resumo

Este documento contém todas as instruções e arquivos necessários para implementar a funcionalidade de busca de cuidadores profissionais no backend.

---

## 📦 Arquivos Necessários

### 1. Migrations

#### Migration 1: Adicionar campos na tabela users
**Arquivo:** `database/migrations/YYYY_MM_DD_HHMMSS_add_caregiver_fields_to_users_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Campos de localização
            $table->decimal('latitude', 10, 8)->nullable()->after('profile');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            $table->string('city', 100)->nullable()->after('longitude');
            $table->string('neighborhood', 100)->nullable()->after('city');
            
            // Campos específicos de cuidador profissional
            $table->text('formation_details')->nullable()->after('neighborhood');
            $table->decimal('hourly_rate', 8, 2)->nullable()->after('formation_details');
            $table->text('availability')->nullable()->after('hourly_rate');
            $table->boolean('is_available')->default(true)->after('availability');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'latitude',
                'longitude',
                'city',
                'neighborhood',
                'formation_details',
                'hourly_rate',
                'availability',
                'is_available',
            ]);
        });
    }
};
```

#### Migration 2: Tabela de cursos
**Arquivo:** `database/migrations/YYYY_MM_DD_HHMMSS_create_caregiver_courses_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('caregiver_courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('institution');
            $table->year('year');
            $table->text('description')->nullable();
            $table->string('certificate_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('caregiver_courses');
    }
};
```

#### Migration 3: Tabela de avaliações
**Arquivo:** `database/migrations/YYYY_MM_DD_HHMMSS_create_caregiver_reviews_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('caregiver_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('caregiver_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('group_id')->nullable()->constrained('groups')->onDelete('set null');
            $table->integer('rating')->unsigned();
            $table->text('comment');
            $table->timestamps();
            
            $table->unique(['caregiver_id', 'author_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('caregiver_reviews');
    }
};
```

---

### 2. Models

#### Model: CaregiverCourse
**Arquivo:** `app/Models/CaregiverCourse.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaregiverCourse extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'institution',
        'year',
        'description',
        'certificate_url',
    ];

    protected $casts = [
        'year' => 'integer',
    ];

    public function caregiver()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
```

#### Model: CaregiverReview
**Arquivo:** `app/Models/CaregiverReview.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaregiverReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'caregiver_id',
        'author_id',
        'group_id',
        'rating',
        'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function caregiver()
    {
        return $this->belongsTo(User::class, 'caregiver_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function group()
    {
        return $this->belongsTo(Group::class, 'group_id');
    }
}
```

---

### 3. Atualizar Model User

**Arquivo:** `app/Models/User.php`

Adicionar no array `$fillable`:
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

Adicionar relacionamentos:
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

---

### 4. Controller

**Arquivo:** `app/Http/Controllers/Api/CaregiverController.php`

[O conteúdo completo está no arquivo /tmp/CaregiverController.php que foi criado]

---

### 5. Rotas

**Arquivo:** `routes/api.php`

Adicionar no início (imports):
```php
use App\Http\Controllers\Api\CaregiverController;
```

Adicionar dentro de `Route::middleware('auth:sanctum')->group(function () {`:
```php
// Cuidadores Profissionais
Route::get('/caregivers', [CaregiverController::class, 'index']);
Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);
```

---

## 🚀 Como Instalar

### Passo 1: Conectar ao servidor
```bash
ssh darley@192.168.0.20
cd /var/www/lacos-backend
```

### Passo 2: Criar as migrations
```bash
php artisan make:migration add_caregiver_fields_to_users_table
php artisan make:migration create_caregiver_courses_table
php artisan make:migration create_caregiver_reviews_table
```

Depois, copie o conteúdo das migrations acima para os arquivos criados.

### Passo 3: Criar os Models
```bash
php artisan make:model CaregiverCourse
php artisan make:model CaregiverReview
```

Copie o conteúdo dos models acima.

### Passo 4: Criar o Controller
```bash
php artisan make:controller Api/CaregiverController
```

Copie o conteúdo do controller (está em /tmp/CaregiverController.php no servidor).

### Passo 5: Atualizar Model User
Edite `app/Models/User.php` e adicione os campos e relacionamentos conforme descrito acima.

### Passo 6: Adicionar Rotas
Edite `routes/api.php` e adicione as rotas conforme descrito acima.

### Passo 7: Executar Migrations
```bash
php artisan migrate
```

### Passo 8: Limpar Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

---

## 📝 Endpoints Criados

### GET `/api/caregivers`
Lista cuidadores profissionais com filtros opcionais:
- `min_rating`: avaliação mínima (1-5)
- `max_distance`: distância máxima em km
- `latitude` e `longitude`: coordenadas do usuário (para filtro de distância)
- `search`: busca por nome, cidade ou bairro
- `city`: filtrar por cidade
- `formation`: filtrar por formação

### GET `/api/caregivers/{id}`
Retorna detalhes completos de um cuidador, incluindo:
- Informações básicas
- Cursos e certificações
- Avaliações e comentários

### POST `/api/caregivers/{id}/reviews`
Cria ou atualiza uma avaliação sobre um cuidador:
- `rating`: 1 a 5
- `comment`: texto do comentário
- `group_id`: ID do grupo (opcional)

---

## ✅ Verificação

Após instalar, teste os endpoints:

```bash
# Listar cuidadores
curl -X GET "http://192.168.0.20/api/caregivers" \
  -H "Authorization: Bearer SEU_TOKEN"

# Detalhes de um cuidador
curl -X GET "http://192.168.0.20/api/caregivers/1" \
  -H "Authorization: Bearer SEU_TOKEN"
```

