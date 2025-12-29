# 🔧 Solução: QR Code abrindo navegador com localhost:8081

## ❌ Problema
Quando você lê o QR code:
- Abre um **navegador** ao invés do Expo Go
- Mostra `http://localhost:8081` 
- Erro: `ERR_CONNECTION_FAILED`

## 🔍 Causa Raiz

O problema é que o **expo-dev-client** está instalado e o Expo está gerando QR code para dev-client, que:
1. Gera URL com `http://` ao invés de `exp://`
2. Abre no navegador ao invés do Expo Go
3. Usa localhost ao invés do IP correto

## ✅ Soluções

### Solução 1: Forçar Expo Go (Recomendado) ⭐

```bash
cd /home/darley/lacos
./USAR_EXPO_GO_APENAS.sh
```

Este script:
- ✅ Força uso do Expo Go (não dev-client)
- ✅ Gera QR code com formato `exp://`
- ✅ Abre no Expo Go (não no navegador)
- ✅ Usa tunnel mode (mais confiável)

### Solução 2: Usar Script Interativo

```bash
cd /home/darley/lacos
./CORRIGIR_QRCODE_EXP_FORMAT.sh
```

Este script pergunta se você quer usar Expo Go ou dev-client.

### Solução 3: Remover expo-dev-client Temporariamente

Se você não precisa do dev-client agora:

```bash
cd /home/darley/lacos

# Fazer backup do package.json
cp package.json package.json.backup

# Remover expo-dev-client temporariamente
npm uninstall expo-dev-client

# Limpar cache
rm -rf .expo
rm -rf node_modules/.cache

# Iniciar Expo Go
npx expo start --tunnel --clear
```

Depois, se precisar do dev-client:
```bash
npm install expo-dev-client
```

### Solução 4: Usar Dev Client Corretamente

Se você **quer** usar dev-client, precisa:

1. **Gerar build de desenvolvimento:**
   ```bash
   npx expo run:android
   npx expo run:ios
   ```

2. **Instalar o app no dispositivo**

3. **Iniciar servidor:**
   ```bash
   npx expo start --dev-client
   ```

4. **Abrir o app customizado** (não Expo Go) e escanear o QR code

## 🎯 Por que está abrindo no navegador?

1. **expo-dev-client instalado** → Expo gera QR code para dev-client
2. **Dev-client não instalado no dispositivo** → Tenta abrir no navegador
3. **URL com http://** → Navegador tenta abrir
4. **localhost:8081** → Não acessível do dispositivo

## ✅ Solução Recomendada Imediata

**Use Expo Go** (não dev-client):

```bash
cd /home/darley/lacos
./USAR_EXPO_GO_APENAS.sh
```

Isso vai:
- ✅ Forçar Expo Go
- ✅ Gerar QR code correto (`exp://`)
- ✅ Abrir no Expo Go (não no navegador)
- ✅ Funcionar no iOS e Android

## 🔍 Verificar se Funcionou

Após iniciar, verifique:

1. **No terminal**, deve mostrar:
   ```
   Metro waiting on exp://10.102.0.103:8081
   ```
   **NÃO deve mostrar:** `http://localhost:8081`

2. **No QR code**, deve mostrar:
   ```
   exp://10.102.0.103:8081
   ```
   **NÃO deve mostrar:** `http://localhost:8081`

3. **Ao escanear**, deve abrir no **Expo Go** (não no navegador)

## ⚠️ Se Ainda Abrir no Navegador

1. **Verifique se Expo Go está instalado** no dispositivo
2. **Desinstale e reinstale Expo Go** (pode ter cache)
3. **Use tunnel mode** (mais confiável)
4. **Verifique permissões** de câmera no dispositivo

