# Instruções para Instalar Endpoint de Disponibilidade do Médico

## Arquivos Necessários

Os arquivos foram copiados para `/tmp` no servidor:
- `/tmp/getAvailability_method.php` - Método para adicionar ao DoctorController
- `/tmp/create_doctor_availability_tables.php` - Migration para criar tabelas

## Passo a Passo

### 1. Adicionar Método ao DoctorController

```bash
ssh darley@193.203.182.22
sudo nano /var/www/lacos-backend/app/Http/Controllers/Api/DoctorController.php
```

Adicione o conteúdo de `/tmp/getAvailability_method.php` **antes do último `}`** da classe.

### 2. Adicionar Rota ao routes/api.php

```bash
sudo nano /var/www/lacos-backend/routes/api.php
```

Encontre a linha:
```php
Route::apiResource('doctors', DoctorController::class);
```

Adicione logo após:
```php
Route::get('doctors/{doctorId}/availability', [DoctorController::class, 'getAvailability']);
```

### 3. Criar Migration

```bash
cd /var/www/lacos-backend
TIMESTAMP=$(date +"%Y_%m_%d_%H%M%S")
sudo cp /tmp/create_doctor_availability_tables.php database/migrations/${TIMESTAMP}_create_doctor_availability_tables.php
```

### 4. Executar Migration

```bash
sudo php artisan migrate
```

### 5. Limpar Cache

```bash
sudo php artisan route:clear
sudo php artisan config:clear
sudo php artisan cache:clear
```

### 6. Testar Endpoint

```bash
curl -H "Authorization: Bearer {seu_token}" http://193.203.182.22/api/doctors/28/availability
```

## Estrutura de Resposta Esperada

```json
{
  "success": true,
  "data": {
    "availableDays": ["2025-12-15", "2025-12-16"],
    "daySchedules": {
      "2025-12-15": ["08:00", "09:00", "14:00"],
      "2025-12-16": ["08:00", "10:00", "15:00"]
    }
  }
}
```

## Nota

Se as tabelas `doctor_availability` e `doctor_availability_times` não existirem, o endpoint retornará uma estrutura vazia, permitindo que o frontend funcione enquanto as tabelas não são criadas.


