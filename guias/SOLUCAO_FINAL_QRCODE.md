# ✅ Solução Final: QR Code com IP Correto

## 🔴 Problema

O QR code continua mostrando `localhost:8081` mesmo após usar `--host 192.168.0.20`.

## ✅ Solução

O problema é que o Expo/Metro bundler precisa da variável de ambiente `REACT_NATIVE_PACKAGER_HOSTNAME` **passada diretamente no comando**, não apenas exportada.

## 🚀 Como Usar

### Opção 1: Script Corrigido (Recomendado)

```bash
cd /home/darley/lacos
./CORRIGIR_QRCODE_LOCALHOST.sh
```

Este script:
- ✅ Para todos os processos Expo/Metro
- ✅ Limpa cache completamente
- ✅ Exporta `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.20`
- ✅ **Passa a variável diretamente no comando** `expo start`
- ✅ Usa `--lan --host 192.168.0.20 --port 8081`

### Opção 2: Comando Manual

```bash
cd /home/darley/lacos

# Parar processos
pkill -f "expo start"
pkill -f "metro"

# Limpar cache
rm -rf .expo node_modules/.cache

# IMPORTANTE: Passar REACT_NATIVE_PACKAGER_HOSTNAME diretamente no comando
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.20 npx expo start --lan --host 192.168.0.20 --port 8081 --clear
```

### Opção 3: Se Usar expo-dev-client

```bash
cd /home/darley/lacos

# Parar e limpar
pkill -f "expo start"
rm -rf .expo node_modules/.cache

# Passar variável diretamente no comando
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.20 npx expo start --lan --host 192.168.0.20 --port 8081 --clear --dev-client
```

## 🔍 Por Que Funciona Agora?

A diferença crucial é:

**❌ NÃO funciona:**
```bash
export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.20
npx expo start --lan --host 192.168.0.20
```

**✅ FUNCIONA:**
```bash
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.20 npx expo start --lan --host 192.168.0.20
```

Quando você passa a variável **diretamente no comando**, ela é herdada pelo processo Metro bundler que o Expo inicia, garantindo que o QR code use o IP correto.

## 📱 Verificação

Após executar, você deve ver no terminal:

```
› Metro waiting on exp://192.168.0.20:8081
```

E o QR code deve conter: `exp://192.168.0.20:8081`

**NÃO deve aparecer:**
- ❌ `localhost:8081`
- ❌ `127.0.0.1:8081`

## 🎯 Teste Agora

1. Execute: `./CORRIGIR_QRCODE_LOCALHOST.sh`
2. Verifique que aparece `exp://192.168.0.20:8081` no terminal
3. Escaneie o QR code
4. O app deve conectar!

## 📝 Notas

- ✅ Certifique-se que celular e computador estão na **mesma rede Wi-Fi**
- ✅ O IP `192.168.0.20` é o IP local da sua máquina
- ✅ A variável `REACT_NATIVE_PACKAGER_HOSTNAME` **deve ser passada diretamente no comando**
- ✅ Não apenas exportada, mas passada como prefixo do comando

