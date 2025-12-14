# 🚀 Desenvolvimento com Expo Go (Sem expo-dev-client)

## ✅ Configuração Atual

O projeto está configurado para funcionar **com Expo Go** por enquanto, sem precisar de `expo-dev-client`.

### 📹 Serviço de Vídeo

O `videoCallService.js` está configurado com **modo mock** que funciona no Expo Go:

- ✅ **Detecta automaticamente** se Agora.io está disponível
- ✅ **Se não estiver** (Expo Go), usa modo mock
- ✅ **Se estiver** (expo-dev-client), usa Agora.io real
- ✅ **Não quebra** o app no Expo Go

### 🎯 Como Funciona

```javascript
// O serviço tenta importar Agora.io
try {
  const agoraModule = require('react-native-agora');
  // Se funcionar, usa Agora.io real
} catch (error) {
  // Se não funcionar (Expo Go), usa modo mock
  // Simula todas as funções sem quebrar
}
```

---

## 🚀 Desenvolvimento Atual

### Use Expo Go Normalmente

```bash
# Desenvolva normalmente
npx expo start

# Escaneie QR code no Expo Go
# → Tudo funciona normalmente
# → Vídeo mostra placeholder (modo mock)
```

### O Que Funciona

- ✅ Todas as telas
- ✅ Navegação
- ✅ Lógica de negócio
- ✅ APIs e serviços
- ✅ Estado e contexto
- ✅ Tela de vídeo (modo mock)

### O Que Não Funciona (Ainda)

- ❌ Vídeo real (precisa expo-dev-client)
- ❌ Áudio real (precisa expo-dev-client)

---

## 📱 Tela de Vídeo

A tela `DoctorVideoCallScreen.js` funciona no Expo Go:

- ✅ Mostra interface completa
- ✅ Controles funcionam (mute, vídeo, encerrar)
- ✅ Modais de prescrição funcionam
- ⚠️ Vídeo mostra placeholder (modo mock)

**Quando precisar de vídeo real:**
1. Gere build com expo-dev-client
2. Instale app customizado
3. Vídeo real funcionará automaticamente

---

## 🔄 Migração Futura (Quando Precisar de Vídeo)

### Passo 1: Instalar Agora.io

```bash
npm install react-native-agora
```

### Passo 2: Gerar Build

```bash
eas build --profile development --platform android
```

### Passo 3: Instalar App Customizado

- Baixar APK do link do EAS
- Instalar no dispositivo

### Passo 4: Continuar Desenvolvendo

```bash
npx expo start --dev-client
```

**O código já está pronto!** O serviço detectará automaticamente que Agora.io está disponível e usará vídeo real.

---

## ✅ Vantagens Desta Abordagem

1. **Desenvolve rápido**: Use Expo Go sem build
2. **Não quebra**: Código funciona em ambos os modos
3. **Migração fácil**: Só gerar build quando precisar
4. **Sem atrasos**: Continue desenvolvendo normalmente

---

## 📝 Resumo

- ✅ **Agora**: Desenvolva com Expo Go normalmente
- ✅ **Vídeo**: Funciona em modo mock (placeholder)
- ✅ **Código**: Já preparado para vídeo real
- ✅ **Futuro**: Quando precisar, só gerar build

**Continue desenvolvendo sem se preocupar com build!** 🚀


