# 🔧 Restaurar Funcionamento Normal do Expo Go

## ❌ Problema

O Expo Go parou de funcionar normalmente:
- QR code não abre tela de boas-vindas
- App não carrega corretamente
- Fluxo normal quebrado

## 🔍 Causa Provável

O `expo-dev-client` está instalado, o que pode fazer o Expo gerar QR codes para dev-client ao invés do Expo Go.

## ✅ Solução: Forçar Expo Go

### Opção 1: Usar Script (Recomendado)

```bash
cd /home/darley/lacos
./scripts/USAR_EXPO_GO_APENAS.sh
```

Este script:
- ✅ Força uso do Expo Go (não dev-client)
- ✅ Gera QR code com formato `exp://`
- ✅ Limpa cache
- ✅ Configura variáveis corretas

### Opção 2: Manual

```bash
cd /home/darley/lacos

# Parar processos
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true

# Limpar cache
rm -rf .expo
rm -rf node_modules/.cache

# Configurar para Expo Go
export EXPO_USE_DEV_CLIENT=0
export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.105
export EXPO_PACKAGER_HOSTNAME=192.168.1.105

# Iniciar Expo Go
npx expo start --tunnel --clear
```

## 🧪 Verificar se Funcionou

Após iniciar, o terminal deve mostrar:
```
Metro waiting on exp://192.168.1.105:8081
```

**NÃO deve mostrar:** `http://localhost:8081` ou qualquer coisa com `dev-client`

## 📱 Fluxo Esperado

1. ✅ Escaneia QR code: `exp://192.168.1.105:8081`
2. ✅ Expo Go abre normalmente
3. ✅ Tela de boas-vindas aparece
4. ✅ Usuário escolhe fazer login
5. ✅ Após login, vê grupos ou cria novo

## ⚠️ Importante

- O código de deep links **NÃO interfere** com URLs `exp://`
- Deep links só processam URLs HTTP/HTTPS específicas
- Expo Go funciona normalmente sem interferência





