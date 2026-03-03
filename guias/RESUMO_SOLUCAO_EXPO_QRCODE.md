# 🎯 Resumo: Solução para Problema de QR Code no Expo Go

## 📋 Problema
- ❌ QR code não funciona no iOS (não tem campo para digitar URL)
- ⚠️ QR code não funciona no Android (só funciona digitando URL manualmente)
- ✅ Funciona digitando URL manualmente no Android: `exp://192.168.0.20:8081`

## ✅ Solução Imediata (Recomendada)

**Use Tunnel Mode** - Funciona sempre:

```bash
cd /home/darley/lacos
./INICIAR_EXPO_TUNNEL.sh
```

Ou manualmente:
```bash
npx expo start --tunnel --clear
```

**Por que funciona:**
- ✅ Não depende de rede local
- ✅ QR code funciona no iOS e Android
- ✅ Funciona mesmo em redes diferentes
- ✅ Mais confiável que LAN mode

## 🔍 Diagnóstico

Execute o diagnóstico completo:

```bash
./DIAGNOSTICO_EXPO.sh
```

Isso vai verificar:
- IP da máquina
- Porta 8081
- Firewall
- Configuração Expo
- Metro config
- Versão Expo

## 🛠️ Soluções Alternativas

### 1. Corrigir Metro Config
```bash
./CORRIGIR_METRO_CONFIG.sh
```

### 2. Usar Script Interativo
```bash
./SOLUCAO_DEFINITIVA_EXPO_QRCODE.sh
```
Este script oferece 3 opções e você escolhe qual usar.

### 3. Verificar Rede
- Certifique-se que iOS e computador estão na mesma Wi-Fi
- Verifique se não há "AP Isolation" no roteador
- Desative VPN se estiver ativa

### 4. Migrar para Expo Dev Client
Se o Expo Go continuar com problemas:
```bash
npx expo install expo-dev-client
npx expo run:ios
npx expo run:android
npx expo start --dev-client
```

## 📱 Para iOS Especificamente

O iOS não tem campo para digitar URL, então:

1. **Use Tunnel Mode** (mais fácil)
2. **Ou compartilhe URL via AirDrop/Email:**
   - Copie a URL do terminal: `exp://192.168.0.20:8081`
   - Envie para o iPhone
   - Toque na URL para abrir no Expo Go

## 🎯 Próximos Passos

1. Execute `./INICIAR_EXPO_TUNNEL.sh`
2. Escaneie o QR code no iOS
3. Se funcionar, problema resolvido!
4. Se não funcionar, execute `./DIAGNOSTICO_EXPO.sh` e me envie o resultado

