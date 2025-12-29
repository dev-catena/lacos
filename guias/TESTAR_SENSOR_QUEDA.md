# 🧪 Guia de Teste - Sensor de Queda WT901BLE67

## 📋 Pré-requisitos

1. ✅ Dependências instaladas (`npm install`)
2. ✅ Migration executada no servidor
3. ✅ Sensor WT901BLE67 carregado e ligado
4. ✅ Bluetooth ativado no dispositivo móvel
5. ✅ App compilado e instalado no dispositivo

## 🔧 Configuração Inicial

### 1. Executar Migration no Servidor

```bash
cd /var/www/lacos-backend
bash INSTALAR_SENSOR_QUEDA.sh
```

Ou manualmente:

```bash
cd /var/www/lacos-backend
php artisan migrate --path=create_fall_sensor_data_table.php
```

### 2. Verificar Rotas

Certifique-se de que as rotas foram adicionadas ao arquivo de rotas:

```php
// Em routes/api.php ou routes_api_corrigido.php
use App\Http\Controllers\Api\FallSensorController;

Route::middleware('auth:sanctum')->group(function () {
    // ... outras rotas ...
    
    Route::post('/groups/{groupId}/fall-sensor/data', [FallSensorController::class, 'store']);
    Route::get('/groups/{groupId}/fall-sensor/history', [FallSensorController::class, 'index']);
    Route::get('/groups/{groupId}/fall-sensor/latest', [FallSensorController::class, 'getLatest']);
    Route::get('/groups/{groupId}/fall-sensor/alerts', [FallSensorController::class, 'getFallAlerts']);
});
```

## 📱 Teste no App Mobile

### 1. Acessar o Sensor

1. Abra o app e faça login
2. Acesse um grupo de cuidados
3. Verifique se o card "Sensor de Queda" aparece (deve estar habilitado no plano)
4. Toque no card "Sensor de Queda"

### 2. Conectar ao Sensor

1. Na tela do sensor, toque em "Conectar ao Sensor"
2. Certifique-se de que o sensor WT901BLE67 está ligado e próximo
3. O app escaneará dispositivos BLE por 10 segundos
4. Quando encontrar o sensor (MAC: 24E4B9E48D8F), conectará automaticamente
5. Você verá o status "Conectado" e o MAC address do sensor

### 3. Verificar Conexão

- ✅ Status deve mostrar "Conectado" (indicador verde)
- ✅ MAC address deve ser exibido
- ✅ Instrução "Coloque o sensor no cinto" deve aparecer

### 4. Testar Detecção de Postura

1. Coloque o sensor no cinto (ou segure próximo ao corpo)
2. Realize os seguintes movimentos:
   - **Em pé**: Fique de pé normalmente
   - **Sentado**: Sente-se em uma cadeira
   - **Deitado dorsal**: Deite-se de costas
   - **Deitado ventral**: Deite-se de bruços
   - **Lateral direito**: Deite-se sobre o lado direito
   - **Lateral esquerdo**: Deite-se sobre o lado esquerdo

3. Observe a tela:
   - ✅ Postura atual deve ser exibida em tempo real
   - ✅ Confiança da classificação deve aparecer
   - ✅ Histórico de mudanças deve ser atualizado

### 5. Testar Detecção de Queda

1. Simule uma queda (cuidado!):
   - Deixe o sensor cair de uma altura pequena
   - OU mova o sensor rapidamente para baixo e pare bruscamente

2. Verifique:
   - ✅ Alerta de queda deve aparecer
   - ✅ Badge vermelho "Queda Detectada" deve ser exibido
   - ✅ Alerta deve aparecer na lista de alertas

### 6. Verificar Salvamento no Backend

1. Aguarde alguns segundos (dados são salvos a cada 5 segundos)
2. Verifique o timestamp "Último salvamento"
3. No servidor, verifique o banco de dados:

```bash
cd /var/www/lacos-backend
php artisan tinker
```

```php
// Verificar últimos registros
DB::table('fall_sensor_data')
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get();

// Verificar alertas de queda
DB::table('fall_sensor_data')
    ->where('is_fall_detected', true)
    ->orderBy('created_at', 'desc')
    ->get();
```

## 🔍 Troubleshooting

### Sensor não encontrado

1. Verifique se o Bluetooth está ativado
2. Verifique se o sensor está ligado
3. Verifique se o sensor está próximo (máximo 10 metros)
4. Tente desligar e ligar o sensor novamente
5. Verifique as permissões de Bluetooth no dispositivo

### Conexão falha

1. Verifique os logs do app (console)
2. Verifique se os UUIDs estão corretos (veja logs de serviços descobertos)
3. Tente desconectar e conectar novamente
4. Reinicie o app

### Dados não aparecem

1. Verifique se a conexão está ativa (status "Conectado")
2. Verifique os logs do app para erros de parse
3. Verifique se o formato dos dados está correto
4. Tente mover o sensor para gerar dados

### Postura incorreta

1. A classificação usa thresholds - pode precisar de ajustes
2. Certifique-se de que o sensor está posicionado corretamente
3. Aguarde alguns segundos para estabilização
4. Verifique a confiança da classificação (deve ser > 60%)

### Dados não salvam no backend

1. Verifique a conexão com a API
2. Verifique os logs do Laravel: `tail -f storage/logs/laravel.log`
3. Verifique se o token de autenticação está válido
4. Verifique se o groupId está correto

## 📊 UUIDs BLE

Se os UUIDs padrão não funcionarem, descubra os UUIDs corretos:

1. Conecte ao sensor
2. Verifique os logs do console - os serviços e características descobertos serão exibidos
3. Atualize os UUIDs em `src/services/bleService.js`:

```javascript
this.SERVICE_UUID = 'UUID_DESCOBERTO';
this.CHARACTERISTIC_UUID = 'UUID_DESCOBERTO';
```

## ✅ Checklist de Teste

- [ ] Migration executada com sucesso
- [ ] Rotas adicionadas ao arquivo de rotas
- [ ] App compilado e instalado
- [ ] Sensor encontrado no scan
- [ ] Conexão estabelecida
- [ ] Postura "Em Pé" detectada
- [ ] Postura "Sentado" detectada
- [ ] Postura "Deitado" detectada
- [ ] Queda simulada detectada
- [ ] Dados salvos no backend
- [ ] Histórico exibido corretamente
- [ ] Alertas de queda funcionando

## 📝 Notas

- Os dados são salvos automaticamente a cada 5 segundos
- A classificação de postura usa thresholds - pode precisar de ajustes finos
- O parse dos dados do sensor assume formato específico do WT901BLE67
- Se o formato for diferente, ajuste o método `parseSensorData` em `bleService.js`

