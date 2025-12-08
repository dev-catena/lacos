# 📹 Guia de Implementação de Chamada de Vídeo

## 🎯 Opções Disponíveis

### 1. **Agora.io** (Recomendado para começar)
- ✅ Fácil de implementar
- ✅ Plano gratuito (10.000 minutos/mês)
- ✅ SDK oficial para React Native
- ✅ Servidor gerenciado (não precisa configurar)
- ✅ Boa documentação

### 2. **react-native-webrtc**
- ✅ Open-source e gratuito
- ❌ Requer servidor de sinalização próprio
- ❌ Mais complexo de configurar
- ✅ Controle total

### 3. **Twilio Video**
- ✅ Muito robusto e confiável
- ❌ Pago (mas tem trial)
- ✅ Excelente qualidade
- ✅ SDK oficial

### 4. **Socket.io + WebRTC Custom**
- ✅ Controle total
- ❌ Muito complexo
- ❌ Requer conhecimento avançado

---

## 🚀 Implementação com Agora.io (Recomendado)

### Passo 1: Instalar Dependências

```bash
npm install react-native-agora
```

Para Expo, você precisará usar `expo-dev-client` (não funciona com Expo Go):

```bash
npx expo install expo-dev-client
npm install react-native-agora
```

### Passo 2: Criar Conta no Agora.io

1. Acesse: https://www.agora.io/
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Anote o **App ID** e **App Certificate**

### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env`:

```env
AGORA_APP_ID=seu_app_id_aqui
AGORA_APP_CERTIFICATE=seu_app_certificate_aqui
```

### Passo 4: Implementar o Serviço de Vídeo

Veja o arquivo `src/services/videoCallService.js` (será criado abaixo)

---

## 🔧 Implementação com react-native-webrtc (Alternativa)

### Passo 1: Instalar

```bash
npm install react-native-webrtc
```

### Passo 2: Configurar Servidor de Sinalização

Você precisará de um servidor WebSocket para sinalização (Socket.io já está no projeto).

---

## 📝 Código de Exemplo

Veja os arquivos:
- `src/services/videoCallService.js` - Serviço de vídeo
- `src/screens/Home/DoctorVideoCallScreen.js` - Tela atualizada com vídeo real

