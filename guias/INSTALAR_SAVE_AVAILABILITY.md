# Instruções para Instalar Método saveAvailability

## Problema Identificado

A médica Maria tem horários cadastrados na agenda, mas não estão sendo salvos no banco de dados porque a função `saveAvailability` no frontend não está chamando o backend.

## Solução

### 1. Adicionar método saveAvailability ao DoctorController

O arquivo `DoctorController_COM_SAVE_AVAILABILITY.php` contém o método completo. Adicione o método `saveAvailability` ao `DoctorController.php` no servidor:

```php
/**
 * Salvar agenda disponível de um médico
 * POST /api/doctors/{doctorId}/availability
 */
public function saveAvailability(Request $request, $doctorId)
{
    // ... (código completo no arquivo DoctorController_COM_SAVE_AVAILABILITY.php)
}
```

### 2. Adicionar rota POST

No arquivo `routes/api.php`, adicione após a rota GET:

```php
Route::post('doctors/{doctorId}/availability', [DoctorController::class, 'saveAvailability']);
```

### 3. Arquivos já atualizados no frontend

✅ `src/services/doctorService.js` - Método `saveAvailability` adicionado
✅ `src/screens/Home/DoctorHomeScreen.js` - Função `saveAvailability` implementada
✅ `src/screens/Home/DoctorHomeScreen.js` - Função `loadAvailability` implementada
✅ `src/screens/Home/DoctorHomeScreen.js` - Import do `doctorService` adicionado

### 4. Após instalar

1. Limpar cache: `php artisan route:clear && php artisan config:clear`
2. Testar salvando a agenda no app
3. Verificar se os dados foram salvos no banco

## Arquivos Prontos

- `DoctorController_COM_SAVE_AVAILABILITY.php` - Controller completo
- `routes_api_com_availability.php` - Rotas atualizadas


