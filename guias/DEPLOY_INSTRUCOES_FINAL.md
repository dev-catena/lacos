# Instruções de Deploy - Final

## ✅ O que foi feito

1. **Frontend atualizado:**
   - Botão de adicionar imagens com cor azul pastel (#A8D5E2)
   - Correção de tipos de dados (price como number, stock como integer)
   - Melhor tratamento de erros com mensagens específicas

2. **Backend atualizado:**
   - Processamento de upload de imagens via FormData
   - Suporte para múltiplas imagens (até 8)
   - Armazenamento em `storage/app/public/products/`
   - URLs das imagens salvas no campo `images` (JSON)

3. **Arquivos enviados:**
   - Frontend: `/tmp/lacos-deploy/` no servidor
   - Backend: `/tmp/SupplierProductController.php` no servidor

## 📝 Comandos para executar no servidor

### 1. Deploy do Frontend

```bash
ssh -p 63022 darley@192.168.0.20
# Senha: yhvh77

# Mover arquivos para produção
sudo rm -rf /var/www/lacos-website/*
sudo cp -r /tmp/lacos-deploy/* /var/www/lacos-website/
sudo chown -R www-data:www-data /var/www/lacos-website
sudo rm -rf /tmp/lacos-deploy

# Reiniciar nginx
sudo systemctl restart nginx
```

### 2. Deploy do Backend

```bash
# Copiar arquivo do controller
sudo cp /tmp/SupplierProductController.php /var/www/lacos-backend/app/Http/Controllers/Api/SupplierProductController.php
sudo chown www-data:www-data /var/www/lacos-backend/app/Http/Controllers/Api/SupplierProductController.php

# Reiniciar o PHP-FPM (PHP 8.2)
sudo systemctl restart php8.2-fpm

# Limpar cache do Laravel (opcional mas recomendado)
cd /var/www/lacos-backend
sudo -u www-data php artisan config:clear
sudo -u www-data php artisan cache:clear
```

### 3. Verificar permissões do storage

```bash
# Garantir que o diretório de storage existe e tem permissões corretas
cd /var/www/lacos-backend
sudo mkdir -p storage/app/public/products
sudo chown -R www-data:www-data storage
sudo chmod -R 775 storage

# Criar link simbólico se não existir
sudo -u www-data php artisan storage:link
```

## 🎨 Alterações implementadas

### Frontend:
- ✅ Campo de preço com máscara para Real (R$)
- ✅ Campo de categoria como select/combo
- ✅ Upload de imagens (até 8 imagens)
- ✅ Botão de upload com cor azul pastel (#A8D5E2)
- ✅ Remoção do campo de URL de imagem
- ✅ Validação: pelo menos 1 imagem obrigatória
- ✅ Correção de tipos de dados (price e stock)

### Backend:
- ✅ Processamento de upload de imagens
- ✅ Suporte para múltiplas imagens
- ✅ Armazenamento em storage/app/public/products/
- ✅ URLs salvas no campo images (JSON)
- ✅ Primeira imagem usada como image_url principal

## 🔍 Verificação

Após executar os comandos, acesse:
- https://lacosapp.com/fornecedor/dashboard
- Tente criar um produto com imagens
- Verifique se o botão está com cor azul pastel
- Verifique se as imagens são salvas corretamente

