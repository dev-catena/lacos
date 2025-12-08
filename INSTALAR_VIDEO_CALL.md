# 📹 Instruções de Instalação - Chamada de Vídeo

## 🎯 Opção Recomendada: Agora.io

### Passo 1: Instalar Dependências

```bash
# Instalar Agora SDK
npm install react-native-agora

# Se usar Expo, instalar dev client (não funciona com Expo Go)
npx expo install expo-dev-client
```

### Passo 2: Criar Conta no Agora.io

1. Acesse: https://www.agora.io/
2. Crie uma conta gratuita
3. Vá em "Console" → "Projects" → "Create"
4. Anote o **App ID**

### Passo 3: Configurar App ID

Edite `src/services/videoCallService.js` e substitua:

```javascript
this.appId = 'SEU_APP_ID_AQUI';
```

### Passo 4: Para Android (se necessário)

Adicione no `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        // ...
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }
}
```

### Passo 5: Para iOS (se necessário)

No `ios/Podfile`, adicione:

```ruby
pod 'AgoraRtcEngine_iOS', '~> 4.0'
```

Depois execute:

```bash
cd ios && pod install
```

---

## 🔄 Alternativa: react-native-webrtc

### Passo 1: Instalar

```bash
npm install react-native-webrtc
```

### Passo 2: Configurar Servidor de Sinalização

Você precisará configurar um servidor WebSocket (Socket.io já está no projeto).

### Passo 3: Configurar STUN/TURN Servers

Edite o arquivo de serviço e adicione seus servidores:

```javascript
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Adicione servidores TURN se necessário
  ],
};
```

---

## ✅ Testar

1. Execute o app
2. Entre em uma consulta
3. Clique em "Iniciar Consulta"
4. A chamada de vídeo deve iniciar

---

## 📝 Notas Importantes

- **Expo Go não suporta WebRTC nativo**: Use `expo-dev-client` ou build nativo
- **Permissões**: Certifique-se de solicitar permissões de câmera e microfone
- **Teste em dispositivos reais**: Emuladores podem ter problemas com vídeo

---

## 🆘 Problemas Comuns

### Erro: "Module not found"
```bash
npm install react-native-agora
npx expo start -c
```

### Erro: "Permission denied"
Verifique se as permissões de câmera e microfone estão configuradas no `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Permitir acesso à câmera para consultas de vídeo"
        }
      ]
    ]
  }
}
```

### Vídeo não aparece
- Verifique se o App ID está correto
- Teste em dispositivo real (não emulador)
- Verifique conexão de internet

