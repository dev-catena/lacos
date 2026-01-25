# ✅ Instruções Finais - Adicionar Relacionamentos ao User

## 📝 Passo 1: Copiar arquivo atualizado

No servidor, execute:

```bash
cd /var/www/lacos-backend
sudo cp /tmp/User_MODEL_COMPLETO.php app/Models/User.php
sudo chown www-data:www-data app/Models/User.php
```

## 📝 Passo 2: Verificar sintaxe

```bash
php -l app/Models/User.php
```

Deve mostrar: `No syntax errors detected`

## 📝 Passo 3: Limpar cache

```bash
php artisan optimize:clear
```

## ✅ Teste

Agora teste a rota `/api/caregivers` no app. Deve funcionar!

## 🔍 Se ainda der erro 404

Verifique os logs do Laravel:

```bash
tail -f storage/logs/laravel.log
```

E teste a rota diretamente:

```bash
curl -X GET "http://10.102.0.103/api/caregivers" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Accept: application/json"
```

