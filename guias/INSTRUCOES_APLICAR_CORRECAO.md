# 🔧 Instruções: Aplicar Correção de Validação para Médicos

## ❌ Problema

Médicos estão recebendo o erro "Você não tem acesso a este grupo" ao tentar gerar atestados ou receitas.

## 🔍 Causa

O sistema estava verificando se o médico pertence ao grupo do paciente, mas **médicos não pertencem a grupos**. A relação médico-paciente é através de **consultas (appointments)**.

## ✅ Solução

A correção muda a validação para:
- **Médicos**: Verificam se têm consulta com o grupo/paciente através da tabela `appointments`
- **Cuidadores/Pacientes**: Continuam verificando acesso através de grupos (como estava)

## 📋 Como Aplicar

### Opção 1: Script Automático (Recomendado)

1. **Enviar o script para o servidor:**
   ```bash
   scp APLICAR_CORRECAO_MEDICO_LOCAL.sh usuario@servidor:/tmp/
   ```

2. **Conectar ao servidor:**
   ```bash
   ssh usuario@servidor
   ```

3. **Executar o script:**
   ```bash
   cd /var/www/lacos-backend  # ou o caminho do seu projeto Laravel
   bash /tmp/APLICAR_CORRECAO_MEDICO_LOCAL.sh
   ```

### Opção 2: Correção Manual

Se preferir fazer manualmente, edite o arquivo:
```
app/Http/Controllers/Api/PrescriptionController.php
```

#### Nos métodos `generateSignedRecipe` e `generateSignedCertificate`:

**SUBSTITUIR este código:**
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

**POR este código:**
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

#### Adicionar import do DB (no topo do arquivo):

Se não existir, adicionar:
```php
use Illuminate\Support\Facades\DB;
```

## ✅ Verificação

Após aplicar a correção:

1. **Verificar sintaxe PHP:**
   ```bash
   php -l app/Http/Controllers/Api/PrescriptionController.php
   ```

2. **Limpar cache:**
   ```bash
   php artisan optimize:clear
   ```

3. **Testar:**
   - Fazer login como médico
   - Tentar gerar um atestado para um paciente
   - O erro "Você não tem acesso a este grupo" não deve mais aparecer

## 📝 Notas Importantes

- A correção deve ser aplicada em **dois métodos**: `generateSignedRecipe` e `generateSignedCertificate`
- O backup é criado automaticamente pelo script
- Se houver erro, o script restaura o backup automaticamente
- A validação para cuidadores/pacientes continua a mesma (verificação de grupo)

## 🆘 Se Ainda Não Funcionar

1. Verifique se a consulta existe no banco de dados:
   ```sql
   SELECT * FROM appointments WHERE doctor_id = [ID_DO_MEDICO] AND group_id = [ID_DO_GRUPO];
   ```

2. Verifique se o campo `profile` do usuário está como `'doctor'`:
   ```sql
   SELECT id, name, profile FROM users WHERE id = [ID_DO_MEDICO];
   ```

3. Verifique os logs do Laravel:
   ```bash
   tail -f storage/logs/laravel.log
   ```

