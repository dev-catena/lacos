# 🔧 Adicionar Relacionamentos ao Modelo User

## ❌ Problema

O `CaregiverController` precisa dos relacionamentos `caregiverReviews()` e `caregiverCourses()` no modelo `User`, mas eles não existem.

## ✅ Solução

### 1. Editar `app/Models/User.php`

**1.1. Adicionar imports (após os outros imports, por volta da linha 5-10):**

Localize a seção de imports e adicione:
```php
use App\Models\CaregiverReview;
use App\Models\CaregiverCourse;
```

**1.2. Adicionar relacionamentos (antes do fechamento da classe `}`):**

Localize o método `getPhotoUrlAttribute()` (deve estar no final do arquivo) e adicione ANTES do fechamento `}`:

```php
    /**
     * Relacionamento com avaliações recebidas como cuidador profissional
     */
    public function caregiverReviews()
    {
        return $this->hasMany(CaregiverReview::class, 'caregiver_id');
    }

    /**
     * Relacionamento com cursos e certificações do cuidador profissional
     */
    public function caregiverCourses()
    {
        return $this->hasMany(CaregiverCourse::class, 'user_id');
    }
```

### 2. Verificar sintaxe

```bash
cd /var/www/lacos-backend
php -l app/Models/User.php
```

### 3. Limpar cache

```bash
php artisan optimize:clear
```

## 📝 Exemplo Completo

O final do arquivo `app/Models/User.php` deve ficar assim:

```php
    public function getPhotoUrlAttribute()
    {
        if ($this->photo) {
            return asset('storage/' . $this->photo);
        }
        return null;
    }

    /**
     * Relacionamento com avaliações recebidas como cuidador profissional
     */
    public function caregiverReviews()
    {
        return $this->hasMany(CaregiverReview::class, 'caregiver_id');
    }

    /**
     * Relacionamento com cursos e certificações do cuidador profissional
     */
    public function caregiverCourses()
    {
        return $this->hasMany(CaregiverCourse::class, 'user_id');
    }

}
```

