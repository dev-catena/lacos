# Agendar Comando de Cancelamento de Reservas Expiradas

## Comando Criado

O comando `appointments:cancel-expired-reservations` foi criado para cancelar automaticamente consultas não pagas cuja reserva expirou (após 10 minutos).

## Como Agendar

### Opção 1: Usando o Agendador de Tarefas do Laravel (Recomendado)

Se o Laravel tiver um arquivo `app/Console/Kernel.php`, adicione o seguinte no método `schedule`:

```php
protected function schedule(Schedule $schedule)
{
    // Executar a cada minuto para verificar reservas expiradas
    $schedule->command('appointments:cancel-expired-reservations')
        ->everyMinute();
}
```

### Opção 2: Usando Cron do Sistema

Adicione ao crontab do servidor:

```bash
* * * * * cd /caminho/para/backend-laravel && php artisan appointments:cancel-expired-reservations >> /dev/null 2>&1
```

Isso executará o comando a cada minuto.

### Opção 3: Executar Manualmente

Para testar, execute:

```bash
php artisan appointments:cancel-expired-reservations
```

## O que o Comando Faz

1. Busca todas as consultas com:
   - `payment_status = 'pending'`
   - `reserved_until` não nulo
   - `reserved_until <= now()` (reserva expirada)
   - `status != 'cancelled'` (ainda não cancelada)

2. Para cada consulta encontrada:
   - Atualiza `status` para `'cancelled'`
   - Define `cancelled_by` como `'system'`
   - Limpa `reserved_until` (define como null)

3. Registra logs de todas as operações

## Notas

- O comando é seguro para executar frequentemente (a cada minuto)
- Apenas consultas com reserva expirada são canceladas
- Consultas já pagas não são afetadas


