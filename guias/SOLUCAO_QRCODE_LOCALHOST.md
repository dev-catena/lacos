# 🔧 Solução: QR Code Apontando para localhost:8001

## ❌ Problema

O QR code está apontando para `localhost:8001` (porta errada) ao invés de usar o tunnel correto.

## ✅ Solução

### Opção 1: Script Automático (Recomendado)

```bash
cd /home/darley/lacos
./CORRIGIR_EXPO_QRCODE.sh
```

Este script vai:
- ✅ Parar todos os processos Expo
- ✅ Limpar cache completamente
- ✅ Liberar porta 8081
- ✅ Iniciar Expo com `--tunnel` e porta correta
- ✅ Detectar se precisa `--dev-client`

### Opção 2: Manual

```bash
cd /home/darley/lacos

# 1. Parar tudo
pkill -f "expo start"
pkill -f "metro"
sleep 2

# 2. Limpar cache
rm -rf .expo node_modules/.cache

# 3. Liberar porta
lsof -ti :8081 | xargs kill -9 2>/dev/null

# 4. Iniciar com tunnel (porta 8081)
npx expo start --tunnel --clear --port 8081
```

### Opção 3: Se Usar expo-dev-client

Se você tem `expo-dev-client` instalado:

```bash
cd /home/darley/lacos

# Parar e limpar
pkill -f "expo start"
rm -rf .expo node_modules/.cache

# Iniciar com dev-client
npx expo start --tunnel --dev-client --clear --port 8081
```

## 📱 Como Verificar se Funcionou

Após iniciar o Expo, você deve ver no terminal:

```
› Metro waiting on exp://XXXXX-XXXXX.exp.direct:80
```

**OU** (se LAN):

```
› Metro waiting on exp://192.168.X.X:8081
```

**NÃO deve aparecer:**
- ❌ `localhost:8001`
- ❌ `localhost:8081` (se estiver usando tunnel)

## 🎯 URL Correta para Manual

Se precisar digitar manualmente no Expo Go:

1. **Com Tunnel**: `exp://XXXXX-XXXXX.exp.direct:80`
   - (Substitua XXXXX-XXXXX pela URL que aparece no terminal)

2. **Com LAN**: `exp://192.168.X.X:8081`
   - (Substitua 192.168.X.X pelo IP local da sua máquina)

## ⚠️ Importante

- **NÃO use** `localhost:8001` ou `localhost:8081` no celular
- **Use** a URL do tunnel (`exp.direct`) ou LAN (`192.168.X.X`)
- O QR code deve mostrar a URL correta automaticamente

## 🔍 Se Ainda Não Funcionar

1. Verifique se o firewall não está bloqueando a porta 8081
2. Tente usar `--lan` ao invés de `--tunnel`:
   ```bash
   npx expo start --lan --clear --port 8081
   ```
3. Verifique se está na mesma rede Wi-Fi (se usar LAN)

