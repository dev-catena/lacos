# Solução: Expo lento no iOS e "New update available, downloading" travado no Android

## ⚠️ SOLUÇÃO DEFINITIVA para Android travado em "downloading"

**Se o Android fica travado mesmo digitando exp://192.168.0.20:8081**, o celular **não consegue conectar** ao seu computador (rede diferente, firewall, etc.). 

**Use o modo TUNNEL** – o celular conecta aos servidores do Expo, que fazem túnel até seu PC:

```bash
npm run start:auto:tunnel
```

Ou, se preferir o script padrão:
```bash
npm run start:tunnel
```

Aguarde aparecer o QR code (pode levar 1–2 minutos). Escaneie com o Expo Go. O app deve carregar normalmente.

---

## Problema 1: iOS extremamente lento ao fazer download do bundle

**Causas comuns:**
- Cache corrompido
- IP incorreto (dispositivo não consegue conectar ao computador)
- Rede lenta ou instável

**Soluções:**

### 1. Limpar cache e reiniciar
```bash
# Parar o Expo (Ctrl+C) e executar:
npx expo start --clear
```

### 2. Verificar o IP da sua máquina
O projeto usa IP fixo `192.168.0.20`. **Se sua máquina tem outro IP, o dispositivo não conecta!**

Para ver seu IP atual:
```bash
node scripts/obter-ip-rede.js
```

Se o IP for diferente (ex: 192.168.1.105), edite:
- `metro.config.js` - linha 7: altere `EXPO_IP` para seu IP
- `start-expo-ip-forcado.js` - linha 13: altere `FORCED_IP` para seu IP

### 3. Usar IP automático (recomendado se o IP fixo não funcionar)
```bash
npm run start:auto
```
Detecta o IP da sua máquina automaticamente.

### 4. Usar modo Tunnel (contorna problemas de rede)
```bash
npm run start:tunnel
# ou com IP automático:
npm run start:auto:tunnel
```
O Tunnel usa servidores do Expo e funciona mesmo com firewall/NAT.

---

## Problema 2: Android travado em "New update available, downloading"

**Causa:** O Expo Go está tentando baixar o bundle do Metro mas a conexão falha ou é muito lenta.

**Soluções (em ordem):**

### 1. Celular e computador na mesma rede Wi-Fi
- Ambos devem estar no mesmo Wi-Fi
- Desative VPN no celular e no computador

### 2. Limpar cache do Expo Go (Android)
- Configurações → Apps → Expo Go → Armazenamento → Limpar cache
- Ou desinstale e reinstale o Expo Go

### 3. Corrigir o IP (mais comum)
Se o IP em `metro.config.js` e `start-expo-ip-forcado.js` estiver errado, o Android tenta conectar em um endereço inacessível e trava.

**Verifique:** O QR code mostra `exp://192.168.0.20:8081`? Se sua rede é 192.168.x.x, está errado!

### 4. Usar IP automático ou Tunnel
```bash
# IP automático (detecta o IP da sua máquina):
npm run start:auto

# Tunnel (funciona mesmo com rede diferente):
npm run start:auto:tunnel
```
Gera um novo QR code que funciona via internet (mais lento na primeira carga, mas evita problemas de rede local).

### 5. Reiniciar tudo
```bash
# No computador - parar Expo (Ctrl+C) e:
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null
rm -rf .expo node_modules/.cache .metro
npm run start
```

No celular: feche o Expo Go completamente (remova dos apps recentes) e abra de novo.

---

## Problema 3: Nenhum dos dois abre - download infinito em ambos

**Causa:** O middleware do Metro estava reescrevendo o bundle JavaScript e podia corrompê-lo.

**Solução aplicada:** O `metro.config.js` foi simplificado (middleware removido).

**Teste agora:**
```bash
# Parar qualquer Expo rodando (Ctrl+C), depois:
rm -rf .expo node_modules/.cache .metro
npm run start
# ou com tunnel:
npm run start:tunnel
```

---

## Resumo rápido

| Sintoma | Solução |
|---------|---------|
| iOS lento | `npx expo start --clear` |
| Android "downloading" infinito | `npm run start:tunnel` |
| Ambos travados em download | Metro simplificado - limpar cache e testar |
