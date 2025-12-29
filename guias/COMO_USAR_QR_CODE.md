# 📱 Como Usar o QR Code do Expo

## ✅ Status Atual

O servidor Expo está funcionando! O JSON que você vê no navegador é **normal** - é a resposta do servidor Expo.

A URL `bmkigtw-darley-8081.exp.direct` mostra que o **tunnel está funcionando corretamente**.

## 🚫 O Que NÃO Fazer

❌ **NÃO acesse no navegador** - O navegador vai mostrar um JSON (isso é normal, mas não é para usar assim)

## ✅ O Que Fazer

### Passo 1: Ver o QR Code

No terminal onde você rodou `npx expo start --tunnel`, você deve ver:
- Um **QR code grande** (ASCII art)
- Uma URL como: `exp://bmkigtw-darley-8081.exp.direct:80`

### Passo 2: Escanear com o App

#### Se você tem Expo Go instalado:

1. **Abra o app Expo Go** no seu iPhone/Android
2. **Toque em "Scan QR Code"** (ou use a câmera)
3. **Escaneie o QR code** que aparece no terminal
4. O app vai carregar automaticamente

#### Se você tem app customizado (expo-dev-client):

1. **Abra o app customizado** (não o Expo Go!)
2. **Escaneie o QR code** do terminal
3. O app vai conectar ao servidor

### Passo 3: Se Não Ver o QR Code no Terminal

Se você não vê o QR code no terminal, tente:

```bash
# Ver QR code no navegador
# Abra: http://localhost:8081
```

Ou pressione `s` no terminal para mostrar o QR code.

## 🔍 Verificar se Está Funcionando

No terminal, você deve ver algo como:

```
› Metro waiting on exp://bmkigtw-darley-8081.exp.direct:80
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

## 📝 Nota Importante

- O JSON no navegador é **normal** - não é um erro!
- O servidor está funcionando corretamente
- Use o **Expo Go** ou **app customizado** para escanear o QR code
- **NÃO** tente abrir a URL no navegador

## 🎯 Resumo

1. ✅ Servidor Expo está rodando (o JSON prova isso)
2. ✅ Tunnel está funcionando (`bmkigtw-darley-8081.exp.direct`)
3. 📱 Use o Expo Go para escanear o QR code
4. ❌ Não acesse no navegador

