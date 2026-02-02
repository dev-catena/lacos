# 📋 Scripts para Adicionar Campo consultation_price

## 📁 Arquivos

1. **`ADICIONAR_CONSULTATION_PRICE.sh`** - Executa remotamente via SSH
2. **`ADICIONAR_CONSULTATION_PRICE_LOCAL.sh`** - Executa diretamente no servidor

## 🚀 Como Usar

### Opção 1: Executar Remotamente (via SSH)

```bash
# No seu computador local
cd /caminho/para/lacos
bash scripts/ADICIONAR_CONSULTATION_PRICE.sh
```

**Requisitos:**
- Ter `sshpass` instalado: `sudo apt-get install sshpass` (Linux) ou `brew install sshpass` (Mac)
- Ter acesso SSH ao servidor

### Opção 2: Executar Diretamente no Servidor (Recomendado)

```bash
# 1. Copiar o script para o servidor
scp scripts/ADICIONAR_CONSULTATION_PRICE_LOCAL.sh darley@10.102.0.103:/tmp/

# 2. Conectar ao servidor
ssh darley@10.102.0.103

# 3. Executar o script
sudo bash /tmp/ADICIONAR_CONSULTATION_PRICE_LOCAL.sh
```

## ✅ O que o script faz

1. **Faz backup** dos arquivos `User.php` e `UserController.php`
2. **Atualiza Model User**:
   - Adiciona `'consultation_price'` ao array `$fillable`
   - Adiciona `'consultation_price' => 'decimal:2'` ao array `$casts`
3. **Atualiza UserController**:
   - Adiciona validação: `'consultation_price' => 'sometimes|nullable|numeric|min:0'`
   - Adiciona `'consultation_price'` à lista de campos do `$request->only()`
4. **Cria migration** para adicionar a coluna `consultation_price` na tabela `users`
5. **Executa a migration** no banco de dados
6. **Limpa o cache** do Laravel
7. **Verifica** se todas as alterações foram aplicadas corretamente

## 🔍 Verificação Manual

Após executar o script, você pode verificar manualmente:

```bash
# Verificar Model User
grep -A 2 "consultation_price" /var/www/lacos-backend/app/Models/User.php

# Verificar UserController
grep "consultation_price" /var/www/lacos-backend/app/Http/Controllers/Api/UserController.php

# Verificar banco de dados
mysql -u root -pyhvh77 lacos -e "DESCRIBE users;" | grep consultation_price
```

## ⚠️ Notas Importantes

- O script verifica se as alterações já foram feitas antes de aplicá-las (idempotente)
- Backups são criados automaticamente com timestamp
- Se algo der errado, você pode restaurar os backups
- O script usa `sudo` para garantir permissões corretas

## 🐛 Troubleshooting

Se o script falhar:

1. **Verificar permissões**: Certifique-se de ter permissão sudo
2. **Verificar sintaxe PHP**: Execute `php -l app/Models/User.php` e `php -l app/Http/Controllers/Api/UserController.php`
3. **Verificar banco**: Certifique-se de que o MySQL está acessível
4. **Restaurar backup**: Se necessário, restaure os arquivos de backup criados

