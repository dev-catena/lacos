# 🔧 Corrigir Erro 500 - Atualização de Dados de Cuidador

## ❌ Problema

Erro 500 ao tentar atualizar dados da cuidadora. O frontend está enviando um campo `courses` (array de cursos) que o backend não está processando.

## ✅ Solução

### Atualizar UserController

Execute no servidor:

```bash
cd /var/www/lacos-backend

# Fazer backup
sudo cp app/Http/Controllers/Api/UserController.php app/Http/Controllers/Api/UserController.php.bak

# Copiar versão corrigida (agora processa cursos também)
sudo cp /tmp/UserController_fixed.php app/Http/Controllers/Api/UserController.php
sudo chown www-data:www-data app/Http/Controllers/Api/UserController.php

# Limpar cache
php artisan optimize:clear
```

## 📋 O que foi corrigido

1. **Processamento de cursos**: O controller agora processa o array `courses` enviado pelo frontend
2. **Salvamento de cursos**: Os cursos são salvos na tabela `caregiver_courses` associados ao usuário
3. **Limpeza**: Cursos antigos são deletados antes de criar os novos

## ✅ Após corrigir

Teste novamente atualizando os dados da cuidadora. Os dados e cursos devem ser salvos corretamente.

