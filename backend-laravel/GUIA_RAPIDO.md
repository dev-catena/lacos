# 🚀 Guia Rápido de Deploy

## ✅ Deploy Concluído!

Os arquivos foram instalados com sucesso no servidor **193.203.182.22**

---

## 📋 Status da Instalação

### ✅ Arquivos Copiados
- ✅ **MediaController.php** → `/var/www/lacos-backend/app/Http/Controllers/Api/`
- ✅ **AlertController.php** → `/var/www/lacos-backend/app/Http/Controllers/Api/`
- ✅ **GroupMedia.php** → `/var/www/lacos-backend/app/Models/`
- ✅ **PatientAlert.php** → `/var/www/lacos-backend/app/Models/`
- ✅ **Migrations** → `/var/www/lacos-backend/database/migrations/`
- ✅ **Documentação** → `/var/www/lacos-backend/`

---

## 🔧 Próximos Passos (OBRIGATÓRIOS)

### 1. Adicionar Rotas

**Conectar ao servidor:**
```bash
ssh darley@193.203.182.22
```

**Editar routes/api.php:**
```bash
sudo nano /var/www/lacos-backend/routes/api.php
```

**Adicionar no final, antes do último `});`:**
```php
    // ==================== MÍDIAS ====================
    
    // Listar mídias de um grupo
    Route::get('/groups/{groupId}/media', [MediaController::class, 'index']);
    
    // Postar nova mídia
    Route::post('/groups/{groupId}/media', [MediaController::class, 'store']);
    
    // Deletar mídia
    Route::delete('/media/{mediaId}', [MediaController::class, 'destroy']);
    
    
    // ==================== ALERTAS ====================
    
    // Listar alertas ativos
    Route::get('/groups/{groupId}/alerts/active', [AlertController::class, 'getActiveAlerts']);
    
    // Marcar medicamento como tomado
    Route::post('/alerts/{alertId}/taken', [AlertController::class, 'markMedicationTaken']);
    
    // Dispensar alerta
    Route::post('/alerts/{alertId}/dismiss', [AlertController::class, 'dismissAlert']);
```

**Adicionar imports no topo:**
```php
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\AlertController;
```

Salvar: `Ctrl+O` → `Enter` → `Ctrl+X`

---

### 2. Rodar Migrations

```bash
cd /var/www/lacos-backend
php artisan migrate
```

---

### 3. Configurar .env

```bash
sudo nano /var/www/lacos-backend/.env
```

**Adicionar/verificar:**
```env
FILESYSTEM_DISK=public
CRON_TOKEN=88b495ea5c9df76f253163d2359c0e0408eaef0820ecdcf68832251c57e0b8c2
```

Salvar e sair.

---

### 4. Testar Endpoints

**Listar mídias:**
```bash
curl -X GET "http://193.203.182.22/api/groups/1/media" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Listar alertas:**
```bash
curl -X GET "http://193.203.182.22/api/groups/1/alerts/active" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Se retornar `200 OK` com array vazio `[]`, está funcionando!

---

## 🕐 Configurar Cron Jobs (Opcional mas Recomendado)

```bash
crontab -e
```

**Adicionar:**
```bash
# Limpar mídias antigas (a cada hora)
0 * * * * cd /var/www/lacos-backend && php artisan schedule:run >> /dev/null 2>&1

# OU usar Laravel Scheduler (recomendado)
* * * * * cd /var/www/lacos-backend && php artisan schedule:run >> /dev/null 2>&1
```

**Configurar Scheduler no Laravel:**

Editar `/var/www/lacos-backend/app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Limpar mídias antigas
    $schedule->call(function () {
        \App\Http\Controllers\Api\MediaController::cleanOldMedia();
    })->hourly();

    // Gerar alertas de medicamentos
    $schedule->call(function () {
        \App\Http\Controllers\Api\AlertController::generateMedicationAlerts();
    })->everyMinute();

    // Limpar alertas expirados
    $schedule->call(function () {
        \App\Http\Controllers\Api\AlertController::cleanExpiredAlerts();
    })->hourly();
}
```

---

## 📱 Integrar com o App React Native

### Desativar Dados Mock (Opcional)

**Opção 1: Manter mock até backend estar 100% pronto**
- O app continuará mostrando dados de exemplo
- Útil para desenvolvimento

**Opção 2: Desativar mock agora**

Editar `/home/darley/lacos/src/services/mediaService.js`:
```javascript
// Linha 47 - comentar ou remover:
// return this.getMockMedia();

// Retornar vazio:
return { success: true, data: [] };
```

Editar `/home/darley/lacos/src/services/alertService.js`:
```javascript
// Linha 43 - já está retornando vazio
return [];
```

---

## 🧪 Verificar Instalação

### No Servidor

```bash
ssh darley@193.203.182.22

# Verificar arquivos
ls -la /var/www/lacos-backend/app/Http/Controllers/Api/
ls -la /var/www/lacos-backend/app/Models/
ls -la /var/www/lacos-backend/database/migrations/ | grep media
ls -la /var/www/lacos-backend/database/migrations/ | grep alert

# Verificar rotas
php artisan route:list | grep media
php artisan route:list | grep alert

# Verificar tabelas
php artisan tinker
```

No tinker:
```php
\App\Models\GroupMedia::count();
\App\Models\PatientAlert::count();
exit
```

---

## 📊 Endpoints Disponíveis

### Mídias
- `GET  /api/groups/{id}/media` - Listar mídias
- `POST /api/groups/{id}/media` - Upload de mídia
- `DELETE /api/media/{id}` - Deletar mídia

### Alertas
- `GET  /api/groups/{id}/alerts/active` - Listar alertas ativos
- `POST /api/alerts/{id}/taken` - Marcar medicamento tomado
- `POST /api/alerts/{id}/dismiss` - Dispensar alerta

---

## 📚 Documentação Completa

No servidor, em:
- `/var/www/lacos-backend/README_MEDIA_ALERTS.md`
- `/var/www/lacos-backend/INSTALACAO_MEDIA_ALERTS.md`
- `/var/www/lacos-backend/api_routes.php`

Ou localmente:
- `backend-laravel/README.md`
- `backend-laravel/INSTALACAO_BACKEND.md`

---

## ⚠️ Troubleshooting

### Erro 404 nos endpoints

Verificar se as rotas foram adicionadas:
```bash
php artisan route:list | grep media
```

Se não aparecer, adicione as rotas em `routes/api.php`

### Erro de permissão no upload

```bash
sudo chmod -R 775 /var/www/lacos-backend/storage
sudo chown -R www-data:www-data /var/www/lacos-backend/storage
php artisan storage:link
```

### Migrations não rodam

```bash
cd /var/www/lacos-backend
php artisan migrate:status
php artisan migrate --force
```

---

## ✅ Checklist Final

- [ ] Rotas adicionadas em `routes/api.php`
- [ ] Imports dos controllers adicionados
- [ ] Migrations executadas
- [ ] `.env` configurado (FILESYSTEM_DISK, CRON_TOKEN)
- [ ] Storage link criado
- [ ] Endpoints testados (retornam 200)
- [ ] Cron jobs configurados (opcional)
- [ ] Documentação revisada

---

## 🎉 Pronto!

Seu backend está instalado e pronto para uso!

**Próximo:** Teste fazendo upload de uma foto pelo app React Native na tela de Mídias.

---

**Suporte:** Veja logs em `/var/www/lacos-backend/storage/logs/laravel.log`

