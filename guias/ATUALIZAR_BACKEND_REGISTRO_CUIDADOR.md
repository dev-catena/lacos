# 🔧 Atualizar Backend - Registro de Cuidador Profissional

## 📋 Campos Adicionais no Registro

Quando um usuário se registra como "Cuidador profissional" (`profile: 'professional_caregiver'`), os seguintes campos devem ser aceitos:

### Campos Obrigatórios:
- `gender` (string) - "Masculino" ou "Feminino"
- `city` (string) - Cidade
- `neighborhood` (string) - Bairro
- `formation_details` (string) - "Cuidador" ou "Auxiliar de enfermagem"
- `hourly_rate` (decimal) - Valor por hora (ex: 50.00)
- `availability` (text) - Disponibilidade (ex: "24 horas" ou "Segunda a Sexta, 8h às 18h")

### Campos Opcionais:
- `latitude` (decimal) - Latitude (pode ser obtida via geolocalização)
- `longitude` (decimal) - Longitude (pode ser obtida via geolocalização)
- `is_available` (boolean) - Disponível para novos atendimentos (padrão: true)

---

## 🚀 Como Atualizar

### Arquivo: `app/Http/Controllers/Api/AuthController.php`

No método `register()`, adicionar validação condicional:

```php
public function register(Request $request)
{
    // Validação base
    $rules = [
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:6|confirmed',
        'phone' => 'nullable|string|max:20',
        'birth_date' => 'nullable|date',
        'gender' => 'nullable|string|max:20',
        'profile' => 'nullable|in:caregiver,accompanied,professional_caregiver',
    ];

    // Se for cuidador profissional, adicionar validações específicas
    if ($request->profile === 'professional_caregiver') {
        $rules = array_merge($rules, [
            'gender' => 'required|string|in:Masculino,Feminino',
            'city' => 'required|string|max:100',
            'neighborhood' => 'required|string|max:100',
            'formation_details' => 'required|string|in:Cuidador,Auxiliar de enfermagem',
            'hourly_rate' => 'required|numeric|min:0',
            'availability' => 'required|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_available' => 'nullable|boolean',
        ]);
    }

    $validated = $request->validate($rules);

    // Criar usuário
    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'phone' => $validated['phone'] ?? null,
        'birth_date' => $validated['birth_date'] ?? null,
        'gender' => $validated['gender'] ?? null,
        'profile' => $validated['profile'] ?? 'caregiver',
        
        // Campos específicos de cuidador profissional
        'city' => $validated['city'] ?? null,
        'neighborhood' => $validated['neighborhood'] ?? null,
        'formation_details' => $validated['formation_details'] ?? null,
        'hourly_rate' => $validated['hourly_rate'] ?? null,
        'availability' => $validated['availability'] ?? null,
        'latitude' => $validated['latitude'] ?? null,
        'longitude' => $validated['longitude'] ?? null,
        'is_available' => $validated['is_available'] ?? true,
    ]);

    // ... resto do código (token, etc)
}
```

---

## ✅ Verificação

Após atualizar, testar o registro:

```bash
curl -X POST http://192.168.0.20/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Maria Silva",
    "email": "maria@teste.com",
    "password": "123456",
    "password_confirmation": "123456",
    "profile": "professional_caregiver",
    "gender": "Feminino",
    "city": "Belo Horizonte",
    "neighborhood": "Centro",
    "formation_details": "Auxiliar de enfermagem",
    "hourly_rate": 50.00,
    "availability": "24 horas"
  }'
```

---

## 📝 Notas

- Os campos devem estar no `$fillable` do Model `User`
- A migration `add_caregiver_fields_to_users_table` já adiciona esses campos
- O campo `gender` também foi adicionado na migration

