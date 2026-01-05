# 🧪 Guia Completo de Teste - Sensor de Queda

## ✅ Checklist Pré-Teste

Antes de começar, verifique se tudo está instalado:

- [ ] Tabela `fall_sensor_data` criada no banco de dados
- [ ] Model `FallSensorData.php` em `app/Models/`
- [ ] Controller `FallSensorController.php` em `app/Http/Controllers/Api/`
- [ ] Rotas adicionadas no arquivo de rotas
- [ ] Dependências do frontend instaladas (`npm install`)
- [ ] App mobile compilado e instalado no dispositivo
- [ ] Sensor WT901BLE67 carregado e ligado

## 🔍 1. Verificar Instalação no Backend

### 1.1 Verificar Tabela

```bash
cd /var/www/lacos-backend
sudo mysql lacos -e "DESCRIBE fall_sensor_data;"
```

Deve mostrar a estrutura da tabela.

### 1.2 Verificar Arquivos

```bash
cd /var/www/lacos-backend

# Verificar Model
ls -la app/Models/FallSensorData.php

# Verificar Controller
ls -la app/Http/Controllers/Api/FallSensorController.php

# Verificar sintaxe
php -l app/Models/FallSensorData.php
php -l app/Http/Controllers/Api/FallSensorController.php
```

### 1.3 Verificar Rotas

```bash
cd /var/www/lacos-backend
php artisan route:list | grep fall-sensor
```

Deve mostrar as 4 rotas:
- POST `/api/groups/{groupId}/fall-sensor/data`
- GET `/api/groups/{groupId}/fall-sensor/history`
- GET `/api/groups/{groupId}/fall-sensor/latest`
- GET `/api/groups/{groupId}/fall-sensor/alerts`

## 🧪 2. Testar API do Backend

### 2.1 Obter Token de Autenticação

```bash
# Fazer login e obter token
curl -X POST http://193.203.182.22/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu_email@exemplo.com","password":"sua_senha"}'
```

Copie o `token` da resposta.

### 2.2 Testar Salvar Dados do Sensor

```bash
# Substitua TOKEN e GROUP_ID pelos valores corretos
TOKEN="seu_token_aqui"
GROUP_ID=1

curl -X POST "http://193.203.182.22/api/groups/${GROUP_ID}/fall-sensor/data" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_mac": "24E4B9E48D8F",
    "posture": "standing",
    "acceleration_x": 0.5,
    "acceleration_y": -0.2,
    "acceleration_z": 9.8,
    "gyro_x": 0.1,
    "gyro_y": 0.05,
    "gyro_z": -0.03,
    "magnitude": 9.85,
    "is_fall_detected": false,
    "confidence": 85.5,
    "sensor_timestamp": "2025-12-14 10:00:00"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Dados do sensor salvos com sucesso",
  "data": { ... }
}
```

### 2.3 Testar Buscar Histórico

```bash
curl -X GET "http://193.203.182.22/api/groups/${GROUP_ID}/fall-sensor/history?limit=10" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 2.4 Testar Buscar Última Postura

```bash
curl -X GET "http://193.203.182.22/api/groups/${GROUP_ID}/fall-sensor/latest" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 2.5 Testar Buscar Alertas de Queda

```bash
curl -X GET "http://193.203.182.22/api/groups/${GROUP_ID}/fall-sensor/alerts?hours=24" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 📱 3. Testar no App Mobile

### 3.1 Verificar se o Card Aparece

1. Abra o app e faça login
2. Acesse um grupo de cuidados
3. Verifique se o card **"Sensor de Queda"** aparece na lista
   - ⚠️ Só aparece se a feature `sensorQuedas` estiver habilitada no plano do usuário

### 3.2 Testar Conexão BLE

1. Toque no card "Sensor de Queda"
2. Toque em **"Conectar ao Sensor"**
3. Certifique-se de que:
   - Bluetooth está ativado no dispositivo
   - Sensor WT901BLE67 está ligado e próximo (máximo 10 metros)
4. O app escaneará por 10 segundos
5. Quando encontrar o sensor (MAC: 24E4B9E48D8F), conectará automaticamente

**O que verificar:**
- ✅ Status muda para "Conectado" (indicador verde)
- ✅ MAC address do sensor é exibido
- ✅ Instrução "Coloque o sensor no cinto" aparece

### 3.3 Testar Detecção de Postura

1. Com o sensor conectado, coloque-o no cinto (ou segure próximo ao corpo)
2. Realize os seguintes movimentos e observe a tela:

   **Em Pé:**
   - Fique de pé normalmente
   - ✅ Deve mostrar "Em Pé"
   - ✅ Confiança deve aparecer (ex: 80%)

   **Sentado:**
   - Sente-se em uma cadeira
   - ✅ Deve mudar para "Sentado"
   - ✅ Histórico deve atualizar

   **Deitado:**
   - Deite-se de costas (decúbito dorsal)
   - ✅ Deve mostrar "Deitado - Decúbito Dorsal"
   - Deite-se de bruços (decúbito ventral)
   - ✅ Deve mostrar "Deitado - Decúbito Ventral"
   - Deite-se sobre o lado direito
   - ✅ Deve mostrar "Deitado - Decúbito Lateral Direito"
   - Deite-se sobre o lado esquerdo
   - ✅ Deve mostrar "Deitado - Decúbito Lateral Esquerdo"

### 3.4 Testar Detecção de Queda

⚠️ **CUIDADO:** Simule uma queda com segurança!

1. Com o sensor conectado, simule uma queda:
   - Deixe o sensor cair de uma altura pequena (ex: 30cm)
   - OU mova o sensor rapidamente para baixo e pare bruscamente

2. Verifique:
   - ✅ Alerta de queda aparece na tela
   - ✅ Badge vermelho "Queda Detectada" é exibido
   - ✅ Alerta aparece na lista de alertas
   - ✅ Notificação pode aparecer (se configurado)

### 3.5 Verificar Salvamento no Backend

1. Aguarde alguns segundos após conectar o sensor
2. Verifique o timestamp "Último salvamento" na tela
3. No servidor, verifique os dados:

```bash
cd /var/www/lacos-backend
sudo mysql lacos -e "SELECT id, posture, posture_pt, is_fall_detected, created_at FROM fall_sensor_data ORDER BY created_at DESC LIMIT 5;"
```

## 🔧 4. Troubleshooting

### Problema: Card não aparece no grupo

**Solução:**
1. Verifique se a feature `sensorQuedas` está habilitada no plano do usuário
2. Acesse a tela web de root → Gestão de Planos
3. Marque a feature "Sensor de Quedas" para o plano do usuário
4. Recarregue o app

### Problema: Sensor não encontrado

**Soluções:**
1. Verifique se o Bluetooth está ativado
2. Verifique se o sensor está ligado (LED deve estar piscando)
3. Aproxime o sensor (máximo 10 metros)
4. Tente desligar e ligar o sensor novamente
5. Verifique as permissões de Bluetooth no dispositivo

### Problema: Conexão falha

**Soluções:**
1. Verifique os logs do app (console/terminal)
2. Verifique se os UUIDs estão corretos (veja logs de serviços descobertos)
3. Tente desconectar e conectar novamente
4. Reinicie o app

### Problema: Dados não aparecem

**Soluções:**
1. Verifique se a conexão está ativa (status "Conectado")
2. Verifique os logs do app para erros de parse
3. Verifique se o formato dos dados está correto
4. Tente mover o sensor para gerar dados

### Problema: Postura incorreta

**Soluções:**
1. A classificação usa thresholds - pode precisar de ajustes
2. Certifique-se de que o sensor está posicionado corretamente
3. Aguarde alguns segundos para estabilização
4. Verifique a confiança da classificação (deve ser > 60%)

### Problema: Dados não salvam no backend

**Soluções:**
1. Verifique a conexão com a API
2. Verifique os logs do Laravel: `tail -f storage/logs/laravel.log`
3. Verifique se o token de autenticação está válido
4. Verifique se o groupId está correto

### Problema: Erro 403 ou 401 na API

**Soluções:**
1. Verifique se o token está válido
2. Faça login novamente no app
3. Verifique se o usuário tem permissão para acessar o grupo

## 📊 5. Verificar Dados no Banco

### 5.1 Ver Últimos Registros

```bash
sudo mysql lacos -e "
SELECT 
    id,
    group_id,
    user_id,
    posture,
    posture_pt,
    is_fall_detected,
    confidence,
    created_at
FROM fall_sensor_data 
ORDER BY created_at DESC 
LIMIT 10;
"
```

### 5.2 Ver Alertas de Queda

```bash
sudo mysql lacos -e "
SELECT 
    id,
    group_id,
    posture_pt,
    confidence,
    created_at
FROM fall_sensor_data 
WHERE is_fall_detected = 1 
ORDER BY created_at DESC;
"
```

### 5.3 Estatísticas por Postura

```bash
sudo mysql lacos -e "
SELECT 
    posture,
    posture_pt,
    COUNT(*) as total,
    AVG(confidence) as confianca_media
FROM fall_sensor_data 
GROUP BY posture, posture_pt
ORDER BY total DESC;
"
```

## 🎯 6. Teste Completo de Fluxo

### Passo a Passo:

1. **Backend:**
   - ✅ Tabela criada
   - ✅ Rotas funcionando
   - ✅ API respondendo

2. **App Mobile:**
   - ✅ Card aparece no grupo
   - ✅ Tela do sensor abre
   - ✅ Botão conectar funciona

3. **BLE:**
   - ✅ Sensor encontrado no scan
   - ✅ Conexão estabelecida
   - ✅ MAC address exibido

4. **Dados:**
   - ✅ Postura detectada em tempo real
   - ✅ Mudanças de postura registradas
   - ✅ Dados salvos no backend (verificar timestamp)

5. **Queda:**
   - ✅ Queda simulada detectada
   - ✅ Alerta exibido
   - ✅ Registro salvo com `is_fall_detected = 1`

6. **Histórico:**
   - ✅ Histórico de posturas aparece
   - ✅ Alertas de queda aparecem
   - ✅ Dados corretos no banco

## ✅ Checklist Final

- [ ] Tabela criada e funcionando
- [ ] Rotas adicionadas e funcionando
- [ ] API testada com sucesso
- [ ] Card aparece no app
- [ ] Conexão BLE funciona
- [ ] Postura "Em Pé" detectada
- [ ] Postura "Sentado" detectada
- [ ] Postura "Deitado" detectada (todos os tipos)
- [ ] Queda simulada detectada
- [ ] Dados salvos no backend
- [ ] Histórico exibido corretamente
- [ ] Alertas de queda funcionando

## 📝 Notas Importantes

- Os dados são salvos automaticamente a cada 5 segundos
- A classificação de postura usa thresholds - pode precisar de ajustes finos
- O parse dos dados do sensor assume formato específico do WT901BLE67
- Se o formato for diferente, ajuste o método `parseSensorData` em `bleService.js`
- Os UUIDs BLE podem variar - verifique os logs do console para descobrir os corretos

