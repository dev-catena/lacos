# 🔒 Verificação de Bloqueio no Login

## ⚠️ IMPORTANTE

Após instalar os endpoints, você precisa adicionar a verificação de bloqueio no método de login.

## 📝 Onde adicionar

No arquivo do AuthController (provavelmente em `app/Http/Controllers/Api/AuthController.php`), no método `login`, adicione esta verificação:

```php
public function login(Request $request)
{
    // ... código existente de validação ...

    $user = User::where('email', $request->email)->first();

    // ADICIONAR ESTA VERIFICAÇÃO:
    if ($user && $user->is_blocked) {
        return response()->json([
            'message' => 'Acesso negado. Sua conta foi bloqueada.',
            'error' => 'account_blocked'
        ], 403);
    }

    // ... resto do código de autenticação ...
}
```

## 🔍 Para médicos

No login, também verifique se o médico foi aprovado:

```php
if ($user && $user->profile === 'doctor') {
    if ($user->is_blocked || !$user->doctor_approved_at) {
        return response()->json([
            'message' => 'Acesso negado. Sua conta ainda não foi aprovada ou foi bloqueada.',
            'error' => 'account_not_approved'
        ], 403);
    }
}
```

## 📋 Resumo

1. ✅ Controllers criados
2. ✅ Rotas adicionadas
3. ✅ Migrations criadas
4. ⏳ **FALTA**: Adicionar verificação no login

