# Correção: Validação de Acesso ao Grupo para Médicos

## Problema Identificado

Médicos não fazem parte dos grupos de pacientes. A relação médico-paciente é estabelecida através de **consultas (appointments)**, não através de grupos.

O código atual está tentando verificar se o médico pertence ao grupo, o que resulta no erro:
```
Você não tem acesso a este grupo
```

## Solução

Alterar a validação para:
- **Médicos**: Verificar se têm consulta com o grupo/paciente
- **Cuidadores/Pacientes**: Manter validação de grupo (como está)

## Arquivo a Corrigir

`backend-laravel/app/Http/Controllers/Api/PrescriptionController.php`

## Métodos a Corrigir

1. `generateSignedRecipe` (linha ~90-97)
2. `generateSignedCertificate` (linha ~201-208)

## Passo a Passo

### 1. Adicionar import do DB (se não existir)

No topo do arquivo, verificar se existe:
```php
use Illuminate\Support\Facades\DB;
```

Se não existir, adicionar junto com os outros imports.

### 2. Localizar e Substituir no método `generateSignedRecipe`

**Código ANTIGO (linhas ~90-97):**
```php
// Verificar se o usuário pertence ao grupo
$group = $user->groups()->find($validated['group_id']);
if (!$group) {
    return response()->json([
        'success' => false,
        'message' => 'Você não tem acesso a este grupo',
    ], 403);
}
```

**Código NOVO:**
```php
// Verificar acesso ao grupo
$user = Auth::user();
$isDoctor = $user->profile === 'doctor';

if ($isDoctor) {
    // Para médicos: verificar se tem consulta com o grupo/paciente
    $hasAppointment = DB::table('appointments')
        ->where('doctor_id', $user->id)
        ->where('group_id', $validated['group_id'])
        ->exists();
    
    // Se não tem consulta geral, verificar se tem a consulta específica
    if (!$hasAppointment && ($validated['appointment_id'] ?? null)) {
        $appointment = DB::table('appointments')
            ->where('id', $validated['appointment_id'])
            ->where('doctor_id', $user->id)
            ->where('group_id', $validated['group_id'])
            ->first();
        
        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Você não tem permissão para gerar documentos para esta consulta.',
            ], 403);
        }
    } elseif (!$hasAppointment) {
        return response()->json([
            'success' => false,
            'message' => 'Você não tem consultas agendadas com este paciente/grupo.',
        ], 403);
    }
} else {
    // Para não-médicos (cuidadores): verificar se pertence ao grupo
    $group = $user->groups()->find($validated['group_id']);
    if (!$group) {
        return response()->json([
            'success' => false,
            'message' => 'Você não tem acesso a este grupo',
        ], 403);
    }
}
```

### 3. Localizar e Substituir no método `generateSignedCertificate`

**Código ANTIGO (linhas ~201-208):**
```php
// Verificar se o usuário pertence ao grupo
$group = $user->groups()->find($validated['group_id']);
if (!$group) {
    return response()->json([
        'success' => false,
        'message' => 'Você não tem acesso a este grupo',
    ], 403);
}
```

**Código NOVO:** (mesmo código do passo 2)

## Verificação

Após fazer as alterações:

1. Verificar sintaxe PHP:
```bash
php -l app/Http/Controllers/Api/PrescriptionController.php
```

2. Limpar cache:
```bash
php artisan optimize:clear
```

3. Testar gerando um atestado como médico

## Notas Importantes

- A verificação para médicos é feita através da tabela `appointments`
- Se uma `appointment_id` específica for fornecida, verifica se ela pertence ao médico
- Caso contrário, verifica se o médico tem qualquer consulta com aquele grupo
- Cuidadores e pacientes continuam com a validação original (verificação de grupo)


