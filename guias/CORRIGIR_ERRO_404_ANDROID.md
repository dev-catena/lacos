# 🔧 Corrigir Erro 404 no Android

## ❌ Problema

O app Android está retornando erro 404 ao tentar fazer login:
```
ERROR ❌ API Error: Erro na requisição: 404
```

## 🔍 Causa

O app está configurado para usar `http://localhost:8000/api`, mas quando roda no Android:
- **Emulador**: `localhost` se refere ao próprio emulador, não ao computador
- **Dispositivo físico**: `localhost` se refere ao dispositivo, não ao computador

## ✅ Solução

Atualizar a URL da API para usar o **IP da máquina** em vez de `localhost`.

### 1. Descobrir o IP da máquina

```bash
hostname -I | awk '{print $1}'
# Ou
ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1
```

**IP encontrado**: `10.102.0.103`

### 2. Atualizar configuração da API

Arquivo: `src/config/api.js`

**Antes:**
```javascript
BASE_URL: 'http://localhost:8000/api',
```

**Depois:**
```javascript
BASE_URL: 'http://10.102.0.103:8000/api',
```

### 3. Verificar se o servidor está acessível

```bash
# Testar do computador
curl http://10.102.0.103:8000/api/gateway/status

# Deve retornar JSON:
# {"status":"ativo"}
```

### 4. Verificar firewall

Se ainda não funcionar, verificar firewall:

```bash
# Ubuntu/Debian
sudo ufw allow 8000/tcp

# Ou desabilitar temporariamente para teste
sudo ufw disable
```

## 📱 Configuração por Plataforma

### Opção 1: IP Fixo (Recomendado para desenvolvimento)

```javascript
// src/config/api.js
const getBaseURL = () => {
  if (Platform.OS === 'android') {
    return 'http://10.102.0.103:8000/api'; // IP da máquina
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:8000/api'; // iOS Simulator pode usar localhost
  }
  return 'http://localhost:8000/api';
};

const API_CONFIG = {
  BASE_URL: getBaseURL(),
  // ...
};
```

### Opção 2: Variável de Ambiente

Criar arquivo `.env`:
```
API_BASE_URL=http://10.102.0.103:8000/api
```

E usar no código:
```javascript
import { API_BASE_URL } from '@env';

const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  // ...
};
```

## 🔍 Verificações

### 1. Servidor está rodando?

```bash
ps aux | grep "php artisan serve"
netstat -tuln | grep 8000
```

### 2. Rotas estão configuradas?

```bash
cd backend-laravel
php artisan route:list | grep login
```

Deve mostrar:
```
POST   api/login ................ AuthController@login
```

### 3. Testar endpoint manualmente

```bash
curl -X POST http://10.102.0.103:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"test@test.com","password":"123456"}'
```

## ⚠️ Importante

- **IP pode mudar**: Se o IP da máquina mudar, atualizar a configuração
- **Rede local**: O dispositivo Android precisa estar na mesma rede Wi-Fi
- **Firewall**: Garantir que a porta 8000 está aberta

## 🚀 Após Corrigir

1. Reiniciar o app Android
2. Tentar fazer login novamente
3. Verificar logs do servidor Laravel:
   ```bash
   tail -f backend-laravel/storage/logs/laravel.log
   ```

## 📝 Notas

- Para produção, usar um domínio/IP fixo
- Para desenvolvimento, pode usar `adb reverse` para mapear porta:
  ```bash
  adb reverse tcp:8000 tcp:8000
  ```
  Depois usar `http://localhost:8000/api` no app






