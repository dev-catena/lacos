# 🔧 Solução: "null está inacessível" no Expo

## ❌ Problema

Ao escanear o QR code, aparece erro "Este site não pode ser acessado - null está inacessível".

## 🔍 Causa

O Expo não está gerando a URL corretamente, resultando em `null` na URL do QR code.

## ✅ Solução

### Passo 1: Limpar Tudo

```bash
cd /home/darley/lacos

# Parar processos
pkill -f "expo start"
pkill -f "metro"

# Limpar cache
rm -rf .expo
rm -rf node_modules/.cache
```

### Passo 2: Iniciar com Tunnel Mode

```bash
# Opção 1: Usar o script
bash INICIAR_EXPO_FIX.sh

# Opção 2: Comando direto
npx expo start --tunnel --clear
```

### Passo 3: Verificar se Funcionou

No terminal, você deve ver:
```
Metro waiting on exp://...
```

E um QR code. **A URL deve começar com `exp://` e não ser `null`!**

## 🎯 Comandos Alternativos

Se o tunnel não funcionar, tente:

### Opção A: LAN Mode

```bash
npx expo start --lan --clear
```

### Opção B: Normal com IP Explícito

```bash
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 npx expo start --clear
```

Depois, no app:
- Expo Go → "Enter URL manually"
- Digite: `exp://192.168.0.20:8081`

### Opção C: Usar Dev Client

Se você tem `expo-dev-client` instalado:

```bash
npx expo start --dev-client --clear
```

## ⚠️ Se Ainda Não Funcionar

1. **Verificar se há erros no terminal:**
   - Procure por mensagens de erro em vermelho
   - Verifique se o Metro bundler iniciou

2. **Reinstalar dependências:**
```bash
rm -rf node_modules
npm install
```

3. **Verificar versão do Expo:**
```bash
npx expo --version
# Deve ser 54.0.16 ou similar
```

4. **Verificar se o projeto está correto:**
```bash
npx expo config
```

## 📝 Nota

O erro "null" geralmente acontece quando:
- O servidor Metro não inicia corretamente
- Há problema na configuração de rede
- O cache está corrompido

A solução com `--tunnel --clear` resolve a maioria dos casos!

