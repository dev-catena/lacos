# 🔒 Verificação de Bloqueio - Endpoint /api/user

## 📋 O que foi implementado

O endpoint `/api/user` agora verifica automaticamente se o usuário está bloqueado:

- ✅ Retorna **403** com `error: 'account_blocked'` se o usuário estiver bloqueado
- ✅ **Revoga todos os tokens** do usuário bloqueado automaticamente
- ✅ Impede que usuários bloqueados façam requisições autenticadas

## 🚀 Como aplicar no servidor

Você tem **2 opções**:

### Opção 1: Modificar apenas a rota /user (Recomendado)

Este script modifica apenas a rota `/user` no arquivo `routes/api.php` existente, mantendo todas as outras rotas intactas.

```bash
# No servidor
cd /var/www/lacos-backend
sudo bash APLICAR_VERIFICACAO_BLOQUEIO.sh
```

**Vantagens:**
- ✅ Não altera outras rotas
- ✅ Mais seguro
- ✅ Mantém configurações existentes

### Opção 2: Restaurar todas as rotas

Este script copia o arquivo `routes_api_corrigido.php` completo para `routes/api.php`, substituindo todas as rotas.

```bash
# No servidor
cd /var/www/lacos-backend

# Primeiro, copie o routes_api_corrigido.php para o servidor (se ainda não estiver)
# Depois execute:
sudo bash RESTAURAR_ROTAS_COM_BLOQUEIO.sh
```

**Vantagens:**
- ✅ Garante que todas as rotas estão atualizadas
- ✅ Útil se você quiser sincronizar todas as rotas de uma vez

**⚠️ Atenção:** Este script substitui **todas** as rotas. Use apenas se tiver certeza.

## 📝 O que o script faz

1. ✅ Cria backup do `routes/api.php` atual
2. ✅ Verifica se a rota `/user` existe
3. ✅ Adiciona/modifica a rota com verificação de bloqueio
4. ✅ Verifica sintaxe PHP
5. ✅ Limpa cache do Laravel
6. ✅ Ajusta permissões

## 🧪 Como testar

### 1. Bloquear um usuário
- Acesse a interface web de gestão
- Bloqueie um usuário qualquer

### 2. Testar endpoint
```bash
# Com token de um usuário bloqueado
curl -H "Authorization: Bearer TOKEN_DO_USUARIO_BLOQUEADO" \
     http://192.168.0.20/api/user
```

**Resposta esperada:**
```json
{
  "message": "Acesso negado. Sua conta foi bloqueada.",
  "error": "account_blocked"
}
```

### 3. Verificar no frontend
- O frontend deve detectar o erro 403
- O usuário deve ser desconectado automaticamente
- Não deve conseguir fazer login novamente

## 🔍 Verificação manual

Se quiser verificar manualmente se a verificação está funcionando:

```bash
# No servidor
cd /var/www/lacos-backend

# Verificar se a rota tem a verificação
grep -A 10 "Route::get.*'/user'" routes/api.php | grep -i "is_blocked"
```

Deve mostrar algo como:
```php
if ($user && $user->is_blocked) {
    $user->tokens()->delete();
    return response()->json([
        'message' => 'Acesso negado. Sua conta foi bloqueada.',
        'error' => 'account_blocked'
    ], 403);
}
```

## 🔄 Reverter mudanças

Se precisar reverter:

```bash
# No servidor
cd /var/www/lacos-backend

# Listar backups
ls -la routes/api.php.backup.*

# Restaurar backup (substitua TIMESTAMP pelo timestamp do backup)
cp routes/api.php.backup.TIMESTAMP routes/api.php

# Limpar cache
php artisan route:clear
php artisan config:clear
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do Laravel: `tail -f storage/logs/laravel.log`
2. Verifique sintaxe: `php -l routes/api.php`
3. Verifique permissões: `ls -la routes/api.php`
4. Limpe cache: `php artisan route:clear && php artisan config:clear`

## ✅ Checklist de implementação

- [ ] Backup do `routes/api.php` criado
- [ ] Script executado com sucesso
- [ ] Sintaxe PHP válida
- [ ] Cache limpo
- [ ] Teste realizado com usuário bloqueado
- [ ] Frontend desconecta usuário bloqueado automaticamente

