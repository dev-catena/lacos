# 🚀 Alternativas de Desenvolvimento React Native (Sem Metro/Expo)

## ❌ Problema Atual

Metro bundler parou de funcionar e Expo Go não conecta. Precisamos de alternativas.

## ✅ Soluções Alternativas

### 1. React Native CLI Puro (SEM Expo) ⭐ RECOMENDADO

**Vantagens:**
- ✅ Controle total
- ✅ Não depende de Expo
- ✅ Usa Metro nativo do React Native (mais estável)
- ✅ Funciona offline
- ✅ Build local direto no dispositivo

**Como migrar:**

```bash
# 1. Criar novo projeto React Native puro
npx react-native@latest init LacosApp

# 2. Copiar código do projeto atual
cp -r src/ LacosApp/src/
cp package.json LacosApp/package.json.backup

# 3. Instalar dependências
cd LacosApp
npm install

# 4. Rodar no Android
npx react-native run-android

# 5. Rodar no iOS
npx react-native run-ios
```

**Vantagem:** Build local, não precisa de servidor de desenvolvimento remoto.

---

### 2. Expo Dev Client (Build Customizado)

**Vantagens:**
- ✅ App customizado (não precisa Expo Go)
- ✅ Funciona offline após build inicial
- ✅ Mais controle que Expo Go
- ✅ Pode usar módulos nativos

**Como usar:**

```bash
# 1. Instalar dev client (se ainda não tiver)
npx expo install expo-dev-client

# 2. Gerar build de desenvolvimento
# Android
npx expo run:android

# iOS
npx expo run:ios

# 3. Instalar no dispositivo

# 4. Iniciar servidor (pode usar localhost agora)
npx expo start --dev-client
```

**Vantagem:** App instalado no dispositivo, não depende de conexão remota.

---

### 3. EAS Build (Expo Application Services)

**Vantagens:**
- ✅ Build na nuvem
- ✅ Não precisa configurar ambiente local
- ✅ Builds otimizados
- ✅ Fácil distribuição

**Como usar:**

```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Configurar
eas build:configure

# 3. Criar build de desenvolvimento
eas build --profile development --platform android
eas build --profile development --platform ios

# 4. Instalar no dispositivo via link ou QR code

# 5. Desenvolvimento local
npx expo start --dev-client
```

**Vantagem:** Build na nuvem, sem problemas de ambiente local.

---

### 4. React Native Web (Desenvolvimento Web Primeiro)

**Vantagens:**
- ✅ Desenvolve no navegador (rápido)
- ✅ Hot reload instantâneo
- ✅ Debug fácil (DevTools)
- ✅ Depois migra para mobile

**Como usar:**

```bash
# 1. Instalar react-native-web
npm install react-native-web

# 2. Configurar webpack/vite para web

# 3. Desenvolver no navegador
npm run web

# 4. Quando pronto, testar no mobile
```

**Vantagem:** Desenvolvimento rápido no navegador, sem problemas de rede.

---

### 5. Vite + React Native (Experimental)

**Vantagens:**
- ✅ Bundler moderno e rápido
- ✅ HMR muito rápido
- ✅ Alternativa ao Metro

**Como usar:**

```bash
# 1. Usar template com Vite
# (Ainda experimental, mas funciona)

# 2. Configurar Vite para React Native
```

**Status:** Experimental, mas promissor.

---

### 6. Desenvolvimento com Emulador/Simulador Local

**Vantagens:**
- ✅ Tudo local (sem rede)
- ✅ Build direto no emulador
- ✅ Não precisa Expo Go

**Como usar:**

```bash
# Android
# 1. Abrir Android Studio
# 2. Criar AVD (Android Virtual Device)
# 3. Rodar
npx react-native run-android

# iOS
# 1. Abrir Xcode
# 2. Rodar no simulador
npx react-native run-ios
```

**Vantagem:** Tudo local, zero problemas de rede.

---

### 7. Usar Flipper para Debug

**Vantagens:**
- ✅ Debug avançado
- ✅ Network inspector
- ✅ Layout inspector
- ✅ Logs detalhados

**Como usar:**

```bash
# 1. Instalar Flipper
# https://fbflipper.com/

# 2. Conectar app ao Flipper
# 3. Debug visual completo
```

---

### 8. Bundle Estático (Produção-like)

**Vantagens:**
- ✅ Testa como produção
- ✅ Não precisa servidor de dev
- ✅ Gera bundle e instala

**Como usar:**

```bash
# Android
npx react-native bundle --platform android --dev false \
  --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle

# Instalar APK
cd android && ./gradlew assembleDebug
```

---

## 🎯 Recomendação Imediata

### Opção 1: React Native CLI (Mais Simples)

```bash
# Criar projeto novo
npx react-native@latest init LacosApp

# Copiar seu código
# Instalar dependências
# Rodar localmente
npx react-native run-android
```

**Por quê:** Não depende de Expo, Metro nativo é mais estável, build local.

### Opção 2: Expo Dev Client (Se Quiser Manter Expo)

```bash
# Gerar build de desenvolvimento
npx expo run:android
npx expo run:ios

# Instalar no dispositivo
# Desenvolver localmente
npx expo start --dev-client
```

**Por quê:** Mantém Expo, mas com app customizado (não precisa Expo Go).

---

## 📋 Comparação Rápida

| Solução | Dificuldade | Precisa Rede? | Precisa Expo Go? | Build Local? |
|---------|-------------|--------------|------------------|--------------|
| React Native CLI | ⭐⭐ | ❌ Não | ❌ Não | ✅ Sim |
| Expo Dev Client | ⭐⭐⭐ | ❌ Não* | ❌ Não | ✅ Sim |
| EAS Build | ⭐⭐ | ✅ Sim (build) | ❌ Não | ❌ Não |
| React Native Web | ⭐⭐ | ❌ Não | ❌ Não | ✅ Sim |
| Emulador Local | ⭐⭐⭐ | ❌ Não | ❌ Não | ✅ Sim |

*Precisa rede apenas para build inicial, depois funciona offline.

---

## 🚀 Próximos Passos

1. **Escolha uma alternativa acima**
2. **Migre o código gradualmente**
3. **Teste no dispositivo/emulador**
4. **Configure CI/CD se necessário**

Qual alternativa você quer tentar primeiro?

