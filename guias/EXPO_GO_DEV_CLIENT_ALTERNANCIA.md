# 🔄 Alternando Entre Expo Go e expo-dev-client

## ⚠️ Resposta Importante

**Depende do que você precisa!**

- ✅ **Pode alternar**: Se não usar bibliotecas nativas
- ❌ **Não pode alternar**: Se usar bibliotecas nativas (Agora.io, WebRTC, etc.)

---

## 📊 Cenários Possíveis

### ✅ Cenário 1: Sem Bibliotecas Nativas

**Você PODE alternar entre Expo Go e expo-dev-client:**

```bash
# Desenvolvimento normal (Expo Go)
npx expo start
# → Usa Expo Go da App Store

# Quando quiser testar algo específico (expo-dev-client)
npx expo start --dev-client
# → Usa app customizado gerado
```

**Mas por quê?** Se não precisa de nativo, não faz sentido gerar build. Use Expo Go direto!

---

### ❌ Cenário 2: Com Bibliotecas Nativas (Agora.io, WebRTC)

**Você NÃO PODE usar Expo Go depois de adicionar bibliotecas nativas:**

```javascript
// Seu código tem:
import { RtcEngine } from 'react-native-agora';
// ou
import { RTCView } from 'react-native-webrtc';
```

**O que acontece:**
- ❌ Expo Go **não tem** essas bibliotecas compiladas
- ❌ App vai **quebrar** se tentar usar Expo Go
- ✅ Precisa usar **sempre** o app customizado (expo-dev-client)

---

## 🎯 Estratégia Recomendada

### Fase 1: Desenvolvimento Inicial (Expo Go)

```bash
# Desenvolva a maior parte do app sem bibliotecas nativas
npx expo start
# → Use Expo Go para desenvolvimento rápido
```

**O que funciona:**
- ✅ Telas e navegação
- ✅ Lógica de negócio
- ✅ APIs e serviços
- ✅ Estado e contexto
- ✅ Estilos e componentes

**O que NÃO funciona:**
- ❌ Bibliotecas nativas (Agora.io, WebRTC, etc.)

---

### Fase 2: Adicionar Funcionalidades Nativas

```bash
# Quando precisar de bibliotecas nativas:
npm install react-native-agora

# Gerar build customizado
eas build --profile development --platform android

# Instalar app customizado no dispositivo
```

**A partir daqui:**
- ✅ Use **sempre** `npx expo start --dev-client`
- ❌ **Não pode mais** usar Expo Go
- ✅ Hot Reload continua funcionando normalmente

---

## 💡 Estratégia Híbrida (Recomendada)

### Desenvolver em Fases

**1. Desenvolvimento Básico (Expo Go)**
```bash
# Desenvolva tudo que não precisa de nativo
npx expo start
# → Use Expo Go
```

**2. Quando Precisar de Nativo**
```bash
# Adicione biblioteca nativa
npm install react-native-agora

# Gere build
eas build --profile development --platform android

# Instale app customizado
```

**3. Desenvolvimento Contínuo (expo-dev-client)**
```bash
# Continue desenvolvendo normalmente
npx expo start --dev-client
# → Use app customizado
# → Hot Reload funciona igual
```

**4. Não Volte para Expo Go**
- ❌ Seu código tem `react-native-agora`
- ❌ Expo Go não tem essa biblioteca
- ❌ App vai quebrar no Expo Go

---

## 🔄 Alternância Prática

### ✅ Pode Alternar (Sem Nativo)

```bash
# Manhã: Expo Go (mais rápido)
npx expo start

# Tarde: expo-dev-client (se quiser testar algo específico)
npx expo start --dev-client
```

**Mas não faz muito sentido** se não precisa de nativo.

---

### ❌ Não Pode Alternar (Com Nativo)

```bash
# Você adicionou Agora.io
npm install react-native-agora

# Gerou build
eas build --profile development --platform android

# Agora você ESTÁ PRESO ao expo-dev-client
npx expo start --dev-client  # ✅ Funciona
npx expo start                # ❌ Quebra (Expo Go não tem Agora.io)
```

---

## 📝 Resumo Prático

### Para Telemedicina (Agora.io/WebRTC)

**Fluxo recomendado:**

1. **Desenvolva sem vídeo primeiro** (Expo Go)
   ```bash
   npx expo start
   # → Desenvolva telas, navegação, lógica
   ```

2. **Quando precisar de vídeo:**
   ```bash
   npm install react-native-agora
   eas build --profile development --platform android
   # → Instale app customizado
   ```

3. **Continue desenvolvendo** (expo-dev-client)
   ```bash
   npx expo start --dev-client
   # → Desenvolva funcionalidades de vídeo
   # → Hot Reload funciona normalmente
   ```

4. **Não volte para Expo Go**
   - ❌ Seu código tem `react-native-agora`
   - ❌ Expo Go não suporta
   - ✅ Continue com expo-dev-client

---

## ⚠️ Importante

### Uma vez que você adiciona bibliotecas nativas:

- ✅ **Pode continuar desenvolvendo** normalmente
- ✅ **Hot Reload funciona** igual ao Expo Go
- ✅ **Não precisa gerar novo build** a cada teste
- ❌ **Não pode mais usar Expo Go** para esse projeto

### Mas isso não é um problema!

- ✅ Desenvolvimento continua igual (hot reload funciona)
- ✅ Só precisa gerar build uma vez
- ✅ Depois desenvolve normalmente
- ✅ Expo Go era só para começar rápido

---

## 🎯 Conclusão

**Pergunta original:** "Posso instalar expo-dev-client, gerar build, testar e depois continuar usando Expo Go?"

**Resposta:**
- ✅ **Sim**, se não usar bibliotecas nativas (mas não faz sentido)
- ❌ **Não**, se usar bibliotecas nativas (Agora.io, WebRTC, etc.)

**Para telemedicina:**
- Desenvolva sem vídeo no Expo Go
- Quando precisar de vídeo, gere build com expo-dev-client
- Continue desenvolvendo com expo-dev-client (hot reload funciona)
- Não volte para Expo Go (não vai funcionar)

**Mas não se preocupe!** O desenvolvimento com expo-dev-client é igual ao Expo Go (hot reload, fast refresh, etc.). A única diferença é que você precisa gerar o build uma vez.

