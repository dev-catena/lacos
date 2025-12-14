# Resumo: Instalação do Endpoint de Disponibilidade do Médico

## Status Atual

Os arquivos necessários foram copiados para o servidor em `/tmp`:
- ✅ `/tmp/getAvailability_method.php` - Método para adicionar ao DoctorController
- ✅ `/tmp/create_doctor_availability_tables.php` - Migration para criar tabelas

## Problema

A rota `/api/doctors/{doctorId}/availability` não está funcionando porque:
1. O método `getAvailability()` ainda não foi adicionado ao `DoctorController.php`
2. A rota ainda não foi adicionada ao `routes/api.php`

## Solução Manual

Execute os seguintes comandos no servidor (como root ou com permissões adequadas):

### 1. Conectar ao servidor
```bash
ssh darley@193.203.182.22
```

### 2. Adicionar método ao DoctorController
```bash
cd /var/www/lacos-backend
sudo nano app/Http/Controllers/Api/DoctorController.php
```

**Adicione o conteúdo de `/tmp/getAvailability_method.php` ANTES do último `}` da classe.**

### 3. Adicionar rota ao routes/api.php
```bash
sudo nano routes/api.php
```

**Encontre a linha:**
```php
Route::apiResource('doctors', DoctorController::class);
```

**Adicione logo após:**
```php
Route::get('doctors/{doctorId}/availability', [DoctorController::class, 'getAvailability']);
```

### 4. Criar e executar migration
```bash
cd /var/www/lacos-backend
TIMESTAMP=$(date +"%Y_%m_%d_%H%M%S")
sudo cp /tmp/create_doctor_availability_tables.php database/migrations/${TIMESTAMP}_create_doctor_availability_tables.php
sudo php artisan migrate
```

### 5. Limpar cache
```bash
sudo php artisan route:clear
sudo php artisan config:clear
sudo php artisan cache:clear
```

### 6. Testar
```bash
curl -H "Authorization: Bearer {seu_token}" http://193.203.182.22/api/doctors/28/availability
```

## Estrutura de Resposta Esperada

```json
{
  "success": true,
  "data": {
    "availableDays": [],
    "daySchedules": {}
  },
  "message": "Tabela de agenda não configurada ainda"
}
```

(Se as tabelas não existirem, retornará estrutura vazia. Se existirem, retornará os dados reais)

## Arquivos Locais Criados

- `DoctorController_getAvailability.php` - Método completo
- `create_doctor_availability_tables.php` - Migration completa
- `INSTRUCOES_INSTALAR_AVAILABILITY.md` - Instruções detalhadas


