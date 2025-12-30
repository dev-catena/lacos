# 🔧 Corrigir Thumbnail de Paciente para Médicos

## ❌ Problema

Quando um médico entra no perfil de pacientes e clica em "detalhes" de uma paciente (ex: Terezinha de Jesus Silva), o thumbnail/foto não aparece, mesmo que o cuidador/admin já tenha cadastrado a foto dela.

## 🔍 Causa

No método `getClientDetails` do `CaregiverController`, quando o usuário é médico, o código usa `DB::table('users')` que retorna apenas o caminho relativo da foto (ex: `photos/123.jpg`), não a URL completa. O modelo User tem um accessor `getPhotoUrlAttribute()` que retorna `asset('storage/' . $this->photo)`, mas quando usamos query builder direto, esse accessor não é aplicado.

## ✅ Solução

Corrigir o método `getClientDetails` para construir a URL completa da foto usando `asset()`.

### Executar no servidor:

```bash
ssh darley@193.203.182.22
cd /var/www/lacos-backend
sudo bash /home/darley/lacos/backend-laravel/CORRIGIR_PHOTO_URL_GETCLIENTDETAILS.sh
```

### Ou manualmente:

1. **Editar `app/Http/Controllers/Api/CaregiverController.php`:**

Localize o método `getClientDetails` e encontre a seção para médicos (dentro do `if ($isDoctor)`):

```php
$patientData = [
    'id' => $patient->id,
    'name' => $patient->name,
    'email' => $patient->email,
    'phone' => $patient->phone,
    'age' => $age,
    'gender' => $patient->gender === 'male' ? 'Masculino' : ($patient->gender === 'female' ? 'Feminino' : ($patient->gender ?? 'Não informado')),
    'city' => $patient->city,
    'neighborhood' => $patient->neighborhood,
    'photo_url' => $patient->photo,  // ❌ PROBLEMA: retorna apenas o caminho relativo
    'photo' => $patient->photo,      // ❌ PROBLEMA: retorna apenas o caminho relativo
    'last_appointment_date' => $lastAppointment->appointment_date ?? null,
    'last_appointment_title' => $lastAppointment->title ?? null,
    'reviews' => [],
];
```

Substitua por:

```php
$patientData = [
    'id' => $patient->id,
    'name' => $patient->name,
    'email' => $patient->email,
    'phone' => $patient->phone,
    'age' => $age,
    'gender' => $patient->gender === 'male' ? 'Masculino' : ($patient->gender === 'female' ? 'Feminino' : ($patient->gender ?? 'Não informado')),
    'city' => $patient->city,
    'neighborhood' => $patient->neighborhood,
    'photo_url' => $patient->photo ? asset('storage/' . $patient->photo) : null,  // ✅ CORRIGIDO: URL completa
    'photo' => $patient->photo ? asset('storage/' . $patient->photo) : null,      // ✅ CORRIGIDO: URL completa
    'last_appointment_date' => $lastAppointment->appointment_date ?? null,
    'last_appointment_title' => $lastAppointment->title ?? null,
    'reviews' => [],
];
```

2. **Também corrigir para cuidadores** (se necessário):

Localize a seção para cuidadores e faça a mesma correção:

```php
$clientData = [
    'id' => $client->id,
    'name' => $client->name,
    'email' => $client->email,
    'phone' => $client->phone,
    'city' => $client->city,
    'neighborhood' => $client->neighborhood,
    'photo_url' => $client->photo ? asset('storage/' . $client->photo) : null,  // ✅ CORRIGIDO
    'photo' => $client->photo ? asset('storage/' . $client->photo) : null,      // ✅ CORRIGIDO
    'group_name' => $client->group_name,
    'group_id' => $client->group_id,
    'rating' => $rating ? round($rating, 1) : 0,
    'reviews_count' => $reviews->count(),
    'reviews' => $reviews,
];
```

3. **Verificar sintaxe:**

```bash
php -l app/Http/Controllers/Api/CaregiverController.php
```

4. **Limpar cache:**

```bash
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

## 🧪 Teste

1. Fazer login como médico
2. Ir em "Pacientes" no menu inferior
3. Clicar em "Detalhes" de uma paciente que tenha foto cadastrada
4. Verificar se o thumbnail aparece corretamente

## 📝 Notas

- O helper `asset()` é global no Laravel, então não precisa de import
- `asset('storage/' . $photo)` constrói a URL completa baseada no `APP_URL` configurado no `.env`
- Se a foto não existir (`null`), retorna `null` em vez de tentar construir uma URL inválida






