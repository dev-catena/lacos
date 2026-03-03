# 🔐 Script para Adicionar Funcionalidade de Trocar Senha

Este script adiciona a funcionalidade de trocar senha ao backend Laravel.

## 📋 O que o script faz:

1. ✅ Adiciona o método `changePassword` ao `AuthController`
2. ✅ Adiciona a rota `POST /change-password` ao `routes/api.php`
3. ✅ Cria backups automáticos dos arquivos modificados
4. ✅ Verifica a sintaxe PHP após as modificações

## 🚀 Como usar:

### Opção 1: Usar o script auxiliar (recomendado)

```bash
# No diretório backend-laravel
./ENVIAR_SCRIPT_TROCAR_SENHA.sh usuario@servidor

# Exemplo:
./ENVIAR_SCRIPT_TROCAR_SENHA.sh root@192.168.0.20
```

### Opção 2: Enviar manualmente via SCP

```bash
# Enviar o script para o servidor
scp backend-laravel/ADICIONAR_TROCAR_SENHA.sh usuario@servidor:/tmp/

# Exemplo:
scp backend-laravel/ADICIONAR_TROCAR_SENHA.sh root@192.168.0.20:/tmp/
```

### Opção 3: Executar diretamente no servidor

```bash
# Conectar ao servidor
ssh usuario@servidor

# Dar permissão de execução
chmod +x /tmp/ADICIONAR_TROCAR_SENHA.sh

# Executar o script (pode precisar de sudo)
sudo bash /tmp/ADICIONAR_TROCAR_SENHA.sh
```

### Opção 4: Executar em uma linha

```bash
ssh usuario@servidor 'chmod +x /tmp/ADICIONAR_TROCAR_SENHA.sh && sudo bash /tmp/ADICIONAR_TROCAR_SENHA.sh'
```

## ⚙️ Configuração

O script procura o Laravel em `/var/www/lacos-backend` por padrão.

Se o seu projeto estiver em outro local, edite a variável `LARAVEL_DIR` no script:

```bash
LARAVEL_DIR="/caminho/para/seu/projeto"
```

## 📝 Verificação

Após executar o script, ele irá:

1. ✅ Verificar se o método foi adicionado ao AuthController
2. ✅ Verificar se a rota foi adicionada ao routes/api.php
3. ✅ Verificar a sintaxe PHP dos arquivos modificados

## 🔄 Reverter mudanças

Se precisar reverter as mudanças, os backups estão salvos com timestamp:

```bash
# Ver backups criados
ls -la app/Http/Controllers/Api/AuthController.php.backup.*
ls -la routes/api.php.backup.*

# Restaurar backup (exemplo)
cp app/Http/Controllers/Api/AuthController.php.backup.1234567890 app/Http/Controllers/Api/AuthController.php
cp routes/api.php.backup.1234567890 routes/api.php
```

## 🧪 Testar a funcionalidade

Após executar o script, teste através do app mobile:

1. Acesse: **Perfil → Segurança → Alterar Senha**
2. Preencha:
   - Senha atual
   - Nova senha (mínimo 6 caracteres)
   - Confirmar nova senha
3. Clique em "Alterar Senha"

## 📊 Logs

Se houver problemas, verifique os logs do Laravel:

```bash
tail -f storage/logs/laravel.log
```

## ⚠️ Requisitos

- Acesso SSH ao servidor
- Permissões de escrita nos arquivos do Laravel
- PHP instalado no servidor (para verificação de sintaxe)

## 🐛 Troubleshooting

### Erro: "Diretório não encontrado"
- Verifique se o caminho `/var/www/lacos-backend` está correto
- Edite a variável `LARAVEL_DIR` no script

### Erro: "Arquivo não encontrado"
- O script tenta encontrar automaticamente o AuthController
- Verifique se o arquivo existe em `app/Http/Controllers/Api/AuthController.php`

### Erro de sintaxe PHP
- O script verifica a sintaxe automaticamente
- Se houver erro, restaure o backup e verifique manualmente

### Rota não funciona
- Verifique se o arquivo `routes/api.php` está sendo carregado pelo Laravel
- Verifique se o middleware `auth:sanctum` está configurado corretamente
- Limpe o cache: `php artisan route:clear && php artisan config:clear`


