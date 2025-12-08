# 🚀 Comandos Rápidos - expo-dev-client

## 📦 Instalação Inicial

```bash
# 1. Instalar expo-dev-client
npx expo install expo-dev-client

# 2. Instalar dependências
npm install

# 3. Verificar se app.json tem o plugin
# (já foi adicionado automaticamente)
```

## 🔨 Gerar Build de Desenvolvimento

### Android (Local - Requer Android Studio)

```bash
# Gerar e instalar no dispositivo/emulador
npx expo run:android

# Isso vai:
# - Compilar o app
# - Instalar no dispositivo conectado
# - Abrir automaticamente
```

### Android (EAS Build - Mais Fácil)

```bash
# 1. Instalar EAS CLI (se ainda não tiver)
npm install -g eas-cli

# 2. Fazer login
eas login

# 3. Configurar projeto (primeira vez)
eas build:configure

# 4. Gerar build de desenvolvimento
eas build --profile development --platform android

# 5. Baixar APK do link gerado e instalar no dispositivo
```

## ▶️ Iniciar Servidor de Desenvolvimento

```bash
# Iniciar com dev client
npx expo start --dev-client

# Ou simplesmente (se configurado no package.json)
npm start -- --dev-client

# Limpar cache e iniciar
npx expo start --dev-client -c
```

## 📱 Conectar Dispositivo

### Após iniciar o servidor:

1. **Android:**
   - Abra o app customizado (não Expo Go!)
   - Escaneie o QR code OU
   - Pressione `a` no terminal

2. **iOS:**
   - Abra o app customizado
   - Escaneie o QR code OU
   - Pressione `i` no terminal

## 🔄 Atualizar Código

Após fazer alterações no código:

1. Salve o arquivo
2. O app vai recarregar automaticamente (Hot Reload)
3. Se não recarregar, agite o dispositivo e escolha "Reload"

## 🛠️ Comandos Úteis

```bash
# Ver configuração do projeto
npx expo config

# Limpar cache do Metro
npx expo start -c

# Ver logs do dispositivo
npx expo start --dev-client --android

# Gerar build de produção (quando estiver pronto)
eas build --profile production --platform android
```

## ⚠️ Importante

- **Não use Expo Go** após instalar expo-dev-client
- Use o app customizado gerado pelo build
- O app customizado permite usar bibliotecas nativas (WebRTC, etc.)

## 📝 Checklist

- [ ] `expo-dev-client` instalado
- [ ] `app.json` atualizado com plugin
- [ ] Build gerado e instalado no dispositivo
- [ ] Servidor iniciado com `--dev-client`
- [ ] App conectado e funcionando

