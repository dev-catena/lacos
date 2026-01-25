# 🚀 Teste Rápido - Sensor de Queda

## ⚡ Teste Rápido (5 minutos)

### 1. Verificar Instalação (30 segundos)

```bash
cd /var/www/lacos-backend

# Verificar tabela
sudo mysql lacos -e "SELECT COUNT(*) FROM fall_sensor_data;"

# Verificar rotas
php artisan route:list | grep fall-sensor

# Verificar arquivos
ls -la app/Models/FallSensorData.php app/Http/Controllers/Api/FallSensorController.php
```

### 2. Testar API (1 minuto)

Edite o script `TESTAR_API_SENSOR_QUEDA.sh` com suas credenciais e execute:

```bash
cd /var/www/lacos-backend
bash TESTAR_API_SENSOR_QUEDA.sh
```

Ou teste manualmente:

```bash
# 1. Login
curl -X POST http://10.102.0.103/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"SEU_EMAIL","password":"SUA_SENHA"}'

# 2. Copie o token e teste salvar dados
curl -X POST "http://10.102.0.103/api/groups/1/fall-sensor/data" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_mac": "24E4B9E48D8F",
    "posture": "standing",
    "acceleration_x": 0.5,
    "acceleration_y": -0.2,
    "acceleration_z": 9.8,
    "magnitude": 9.85,
    "is_fall_detected": false,
    "confidence": 85.5
  }'
```

### 3. Testar no App Mobile (3 minutos)

1. **Abrir app** → Login → Acessar grupo
2. **Verificar card** "Sensor de Queda" aparece
3. **Conectar sensor:**
   - Toque no card
   - Toque em "Conectar ao Sensor"
   - Certifique-se que o sensor está ligado
   - Aguarde conexão
4. **Testar postura:**
   - Fique em pé → Deve mostrar "Em Pé"
   - Sente-se → Deve mostrar "Sentado"
5. **Verificar salvamento:**
   - Aguarde 5 segundos
   - Verifique "Último salvamento" na tela

### 4. Verificar Dados (30 segundos)

```bash
sudo mysql lacos -e "SELECT posture_pt, created_at FROM fall_sensor_data ORDER BY created_at DESC LIMIT 5;"
```

## ✅ Se tudo funcionar:

- ✅ API responde
- ✅ Dados são salvos
- ✅ App conecta ao sensor
- ✅ Postura é detectada
- ✅ Dados aparecem no banco

## ❌ Se algo não funcionar:

Consulte o guia completo: `GUIA_TESTE_SENSOR_QUEDA.md`

