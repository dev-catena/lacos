# 🔧 Solução: Expo Usando Development Build ao Invés de Expo Go

## ❌ Problema Identificado

O terminal mostra:
```
› Using development build
› Press s │ switch to Expo Go
```

E o QR code mostra:
```
exp+lacos://expo-development-client/?url=...
```

Isso significa que o Expo está usando **development build** ao invés do **Expo Go**.

## ✅ Solução Rápida (No Terminal Atual)

**Enquanto o Expo está rodando, pressione `s` no terminal!**

Isso vai mudar para Expo Go e gerar um novo QR code correto.

## ✅ Solução Definitiva

Executei o script `FORCAR_EXPO_GO_DEFINITIVO.sh` que:
1. Para processos antigos
2. Limpa cache
3. Força Expo Go com flag `--go`
4. Configura variáveis corretas

## 🧪 Como Verificar se Funcionou

Após o script iniciar, o terminal deve mostrar:

**✅ CORRETO:**
```
› Metro waiting on exp://192.168.1.105:8081
```

**❌ ERRADO (se ainda aparecer):**
```
› Using development build
exp+lacos://expo-development-client/...
```

## 📱 No Dispositivo

### Android:
1. Abra o app **Expo Go** (não outro app)
2. Toque em "Scan QR Code"
3. Escaneie o QR code
4. Deve abrir normalmente

### iOS:
1. Abra o app **Expo Go**
2. Use a câmera do iOS para escanear
3. Toque na notificação que aparece
4. Deve abrir normalmente

## 🔄 Se Ainda Não Funcionar

### Opção 1: Pressionar `s` no Terminal
Se o Expo já está rodando, simplesmente pressione `s` para mudar para Expo Go.

### Opção 2: Reiniciar Manualmente
```bash
# Parar
pkill -f expo
pkill -f metro

# Limpar
rm -rf .expo
rm -rf node_modules/.cache

# Iniciar com --go
EXPO_USE_DEV_CLIENT=0 \
npx expo start --tunnel --clear --go
```

### Opção 3: Remover expo-dev-client Temporariamente
```bash
# Fazer backup
cp package.json package.json.backup

# Remover expo-dev-client
npm uninstall expo-dev-client

# Limpar e iniciar
rm -rf .expo node_modules/.cache
npx expo start --tunnel --clear

# Depois, se precisar, reinstalar:
# npm install expo-dev-client
```

## 🎯 O Que Deve Aparecer

**QR Code Correto:**
- Formato: `exp://192.168.1.105:8081` ou `exp://xxxxx.exp.direct:80`
- **NÃO** deve ter `exp+lacos://` ou `expo-development-client`

**Terminal Correto:**
- Deve mostrar: `Metro waiting on exp://...`
- **NÃO** deve mostrar: `Using development build`







