# ✅ Resumo da Implementação: CPF para Médicos, Email para Outros

## 📦 Arquivos Criados/Modificados

### Backend
1. **`backend-laravel/add_cpf_to_users_table.php`** - Migração para adicionar campo CPF
2. **`backend-laravel/AuthController_MODIFICADO_CPF_EMAIL.php`** - AuthController completo com suporte a CPF/Email
3. **`backend-laravel/MODIFICAR_AUTH_CPF_EMAIL.sh`** - Script para aplicar mudanças

### Frontend
1. **`src/utils/cpf.js`** - Funções para formatar e validar CPF
2. **`src/screens/Auth/ProfileSelectionScreen.js`** - Nova tela para seleção de perfil
3. **`src/screens/Auth/RegisterScreen.js`** - Modificado para CPF de médico
4. **`src/screens/Auth/LoginScreen.js`** - Modificado para aceitar CPF ou Email
5. **`src/contexts/AuthContext.js`** - Adicionado suporte a múltiplos perfis
6. **`src/navigation/AuthNavigator.js`** - Adicionada rota ProfileSelection

## 🔧 Próximos Passos para Aplicar no Servidor

### 1. Aplicar Migração
```bash
cd /var/www/lacos-backend
php artisan migrate --path=backend-laravel/add_cpf_to_users_table.php
```

### 2. Substituir AuthController
```bash
cd /var/www/lacos-backend
# Fazer backup
cp app/Http/Controllers/Api/AuthController.php app/Http/Controllers/Api/AuthController.php.bak

# Copiar versão modificada
cp backend-laravel/AuthController_MODIFICADO_CPF_EMAIL.php app/Http/Controllers/Api/AuthController.php
```

### 3. Adicionar Rota para Login com Perfil
Adicionar em `routes/api.php`:
```php
Route::post('/login/select-profile', [AuthController::class, 'loginWithProfile']);
```

## ✅ Funcionalidades Implementadas

### Registro
- ✅ Médico: CPF obrigatório, email opcional
- ✅ Outros perfis: Email obrigatório
- ✅ Validação de CPF no frontend
- ✅ Validação de CPF único no backend

### Login
- ✅ Aceita CPF ou Email
- ✅ Detecta automaticamente o tipo
- ✅ Suporta múltiplos perfis com mesmo email
- ✅ Tela de seleção de perfil quando necessário

### Multi-perfil
- ✅ Mesmo email pode ter múltiplos perfis
- ✅ Seleção de perfil no login
- ✅ Login independente por perfil

## ⚠️ Pendências

1. **Backend**: Aplicar migração e substituir AuthController no servidor
2. **Backend**: Adicionar rota `/login/select-profile`
3. **Backend**: Modificar exclusão para permitir reuso de CPF/Email (já implementado na lógica, mas pode precisar ajustes)
4. **Testes**: Testar fluxo completo de registro e login

## 📝 Notas

- A validação de CPF único para médicos é feita no código (não via índice único do MySQL, pois MySQL não suporta índices parciais)
- O campo email continua existindo para médicos, mas é opcional
- Quando um médico é excluído, o CPF pode ser reusado (não há bloqueio permanente)
- Quando outro perfil é excluído, o email pode ser reusado




