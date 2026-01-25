# 📹 Guia Completo: Implementação de Telemedicina com Agora.io

## ✅ Resposta Direta

**SIM!** O Agora.io precisa de recursos nativos e **requer build com `expo-dev-client`**. Não funciona no Expo Go.

---

## 📋 Por Que Precisa de Build?

O Agora.io usa:
- ✅ **Câmera nativa** (acesso direto ao hardware)
- ✅ **Microfone nativo** (acesso direto ao hardware)
- ✅ **WebRTC nativo** (biblioteca C++ compilada)
- ✅ **Codecs de vídeo/áudio** (processamento nativo)

Esses recursos **não estão disponíveis no Expo Go**, então você precisa:
1. Gerar um build customizado com `expo-dev-client`
2. Instalar o app no dispositivo
3. Desenvolver normalmente (com hot reload)

---

## 🚀 Passo a Passo Completo

### **Fase 1: Preparação (Uma Vez)**

#### 1.1. Instalar Dependências

```bash
cd /home/darley/lacos

# Instalar Agora SDK
npm install react-native-agora

# Verificar se expo-dev-client está instalado
npm list expo-dev-client
# Se não estiver: npx expo install expo-dev-client
```

#### 1.2. Criar Conta no Agora.io

1. Acesse: https://www.agora.io/
2. Crie uma conta gratuita (10.000 minutos/mês grátis)
3. Vá em **Console** → **Projects** → **Create**
4. Anote o **App ID** (ex: `75ae244af79944a18a059d2fcb18c1dc`)

#### 1.3. Configurar App ID

Edite `src/services/videoCallService.js` e atualize o `appId`:

```javascript
this.appId = 'SEU_APP_ID_AQUI';
```

---

### **Fase 2: Gerar Build (Uma Vez)**

#### 2.1. Verificar Configuração

O `app.json` já deve ter:
- ✅ `expo-dev-client` no `plugins`
- ✅ Permissões de câmera e microfone

#### 2.2. Gerar Build com EAS

```bash
# Instalar EAS CLI (se ainda não tiver)
npm install -g eas-cli

# Fazer login
eas login

# Configurar projeto (primeira vez)
eas build:configure

# Gerar build de desenvolvimento
eas build --profile development --platform android
```

**Isso vai:**
- ✅ Compilar o app com `react-native-agora` embutido
- ✅ Gerar um APK para download
- ✅ Levar cerca de 10-15 minutos

#### 2.3. Instalar APK no Dispositivo

1. Baixe o APK do link gerado pelo EAS
2. Instale no dispositivo Android:
   ```bash
   adb install caminho/para/app.apk
   ```
   Ou transfira manualmente e instale

---

### **Fase 3: Desenvolvimento (Diário)**

#### 3.1. Iniciar Servidor

```bash
cd /home/darley/lacos
npx expo start --dev-client
```

#### 3.2. Conectar Dispositivo

1. Abra o app customizado (não Expo Go!)
2. Escaneie o QR code OU pressione `a` no terminal
3. O app vai se conectar ao servidor

#### 3.3. Desenvolver Normalmente

- ✅ Faça alterações no código
- ✅ Hot Reload funciona normalmente
- ✅ **NÃO precisa gerar novo build!**
- ✅ Só gere novo build se adicionar outra biblioteca nativa

---

## 🔧 Implementação no Código

### 1. Atualizar `DoctorVideoCallScreen.js`

O arquivo já existe, mas precisa ser atualizado para usar o Agora.io de verdade. Veja o exemplo completo abaixo.

### 2. Usar o Serviço de Vídeo

```javascript
import videoCallService from '../../services/videoCallService';

// Inicializar
await videoCallService.initialize();

// Entrar no canal
await videoCallService.joinChannel('consulta-123', userId);

// Obter views de vídeo
const localView = videoCallService.getLocalVideoView();
const remoteView = videoCallService.getRemoteVideoView(remoteUid);
```

---

## 📝 Checklist de Implementação

- [ ] Instalar `react-native-agora`
- [ ] Criar conta no Agora.io
- [ ] Obter App ID
- [ ] Configurar App ID no `videoCallService.js`
- [ ] Gerar build com EAS (`eas build --profile development`)
- [ ] Instalar APK no dispositivo
- [ ] Atualizar `DoctorVideoCallScreen.js` para usar vídeo real
- [ ] Testar chamada de vídeo
- [ ] Implementar controles (mute, vídeo on/off, encerrar)

---

## ⚠️ Importante

1. **Não funciona no Expo Go**: Use `expo-dev-client` ou build nativo
2. **Teste em dispositivo real**: Emuladores podem ter problemas com vídeo
3. **Permissões**: Certifique-se de solicitar permissões de câmera e microfone
4. **Build inicial**: Gere o build uma vez, depois desenvolva normalmente
5. **Novo build**: Só gere novo build se adicionar outra biblioteca nativa

---

## 🆘 Problemas Comuns

### Erro: "Module not found: react-native-agora"
```bash
npm install react-native-agora
npx expo start --dev-client -c
```

### Erro: "Cannot read property 'create' of undefined"
- Verifique se o build foi gerado com `expo-dev-client`
- Reinstale o app no dispositivo

### Vídeo não aparece
- Verifique permissões de câmera
- Teste em dispositivo real (não emulador)
- Verifique se o canal foi criado corretamente

---

## 🎯 Próximos Passos

1. **Instalar dependências** (script abaixo)
2. **Criar conta no Agora.io** e obter App ID
3. **Gerar build** com EAS
4. **Atualizar tela de vídeo** para usar Agora.io
5. **Testar** chamada de vídeo

---

## 📚 Recursos

- Documentação Agora.io: https://docs.agora.io/
- SDK React Native: https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=react-native
- Exemplos: https://github.com/AgoraIO-Community/react-native-agora


