# 📱 Guia Completo: expo-dev-client

## 🎯 O que é expo-dev-client?

O `expo-dev-client` é uma versão customizada do Expo Go que permite usar bibliotecas nativas (como WebRTC, câmera nativa, etc.) que não funcionam no Expo Go padrão.

---

## 📋 Pré-requisitos

- Node.js instalado ✅ (já temos)
- Expo CLI instalado
- Android Studio (para Android) ou Xcode (para iOS - apenas macOS)

---

## 🚀 Passo a Passo

### Passo 1: Instalar expo-dev-client

```bash
cd /home/darley/lacos
npx expo install expo-dev-client
```

Isso vai:
- Adicionar `expo-dev-client` ao `package.json`
- Configurar o projeto para usar dev client

### Passo 2: Instalar Dependências

```bash
npm install
```

### Passo 3: Configurar app.json

O `app.json` já deve estar configurado, mas verifique se tem:

```json
{
  "expo": {
    "plugins": [
      "expo-dev-client"
    ]
  }
}
```

### Passo 4: Gerar Build de Desenvolvimento

#### Para Android:

```bash
# Gerar build de desenvolvimento
npx expo prebuild

# Ou usar EAS Build (recomendado)
npx eas build --profile development --platform android
```

#### Para iOS (apenas macOS):

```bash
npx eas build --profile development --platform ios
```

### Passo 5: Instalar o App no Dispositivo

#### Opção A: Build Local (Android)

```bash
# Gerar APK de desenvolvimento
npx expo run:android

# Isso vai:
# 1. Compilar o app
# 2. Instalar no emulador/dispositivo conectado
# 3. Abrir o app automaticamente
```

#### Opção B: EAS Build (Recomendado - mais fácil)

1. **Criar conta no EAS:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configurar projeto:**
   ```bash
   eas build:configure
   ```

3. **Gerar build:**
   ```bash
   # Android
   eas build --profile development --platform android
   
   # iOS
   eas build --profile development --platform ios
   ```

4. **Baixar e instalar:**
   - O EAS vai gerar um link para download
   - Baixe o APK/IPA e instale no dispositivo

---

## 🔧 Configuração Detalhada

### 1. Criar arquivo `eas.json`

Crie um arquivo `eas.json` na raiz do projeto:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

### 2. Atualizar `app.json`

Adicione configurações de desenvolvimento:

```json
{
  "expo": {
    "name": "Laços",
    "slug": "lacos",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "plugins": [
      "expo-dev-client",
      [
        "expo-camera",
        {
          "cameraPermission": "Permitir acesso à câmera para consultas de vídeo"
        }
      ]
    ],
    "android": {
      "package": "com.lacos.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "INTERNET"
      ]
    },
    "ios": {
      "bundleIdentifier": "com.lacos.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Permitir acesso à câmera para consultas de vídeo",
        "NSMicrophoneUsageDescription": "Permitir acesso ao microfone para consultas de vídeo"
      }
    }
  }
}
```

---

## 📱 Como Usar Após Instalar

### 1. Iniciar Servidor de Desenvolvimento

```bash
npx expo start --dev-client
```

Ou simplesmente:

```bash
npm start
```

### 2. Conectar Dispositivo

#### Android:
- Abra o app "Expo Go" (se ainda tiver) ou o app customizado
- Escaneie o QR code OU
- Pressione `a` no terminal para abrir no Android

#### iOS:
- Abra o app customizado
- Escaneie o QR code OU
- Pressione `i` no terminal para abrir no iOS

---

## 🔄 Diferenças: Expo Go vs expo-dev-client

| Recurso | Expo Go | expo-dev-client |
|---------|---------|-----------------|
| Bibliotecas nativas | ❌ Limitado | ✅ Todas |
| WebRTC | ❌ Não funciona | ✅ Funciona |
| Câmera nativa | ⚠️ Limitado | ✅ Completo |
| Instalação | ✅ Instantânea | ⚠️ Requer build |
| Atualizações | ✅ Instantâneas | ⚠️ Requer rebuild |

---

## 🛠️ Comandos Úteis

```bash
# Iniciar com dev client
npx expo start --dev-client

# Limpar cache e iniciar
npx expo start --dev-client -c

# Gerar build Android local
npx expo run:android

# Gerar build iOS local (macOS)
npx expo run:ios

# Verificar configuração
npx expo config

# Verificar plugins instalados
npx expo config --type public
```

---

## ⚠️ Problemas Comuns

### Erro: "expo-dev-client not found"
```bash
npx expo install expo-dev-client
npm install
```

### Erro: "Cannot find module"
```bash
rm -rf node_modules
npm install
npx expo start --dev-client -c
```

### App não conecta
1. Verifique se está usando `--dev-client` no comando start
2. Certifique-se de que o app instalado é o dev client (não Expo Go)
3. Verifique se dispositivo e servidor estão na mesma rede

### Build falha
```bash
# Limpar tudo e tentar novamente
npx expo prebuild --clean
npx expo run:android
```

---

## 📝 Próximos Passos

Após configurar o expo-dev-client:

1. ✅ Instalar bibliotecas nativas (ex: `react-native-agora`)
2. ✅ Testar chamadas de vídeo
3. ✅ Configurar permissões de câmera/microfone
4. ✅ Fazer build de produção quando estiver pronto

---

## 🎯 Resumo Rápido

```bash
# 1. Instalar
npx expo install expo-dev-client

# 2. Instalar dependências
npm install

# 3. Gerar build (Android)
npx expo run:android

# 4. Iniciar servidor
npx expo start --dev-client

# 5. Conectar dispositivo e testar!
```


