# ✅ expo-dev-client Instalado - Próximos Passos

## 🎉 Status Atual

✅ `expo-dev-client` instalado com sucesso!
✅ `app.json` configurado com o plugin
✅ Permissões de câmera adicionadas

---

## 📱 Próximos Passos

### 1. Gerar Build de Desenvolvimento

Você tem duas opções:

#### Opção A: Build Local (Requer Android Studio)

```bash
# No diretório do projeto
cd /home/darley/lacos

# Gerar e instalar no dispositivo/emulador Android
npx expo run:android
```

**Requisitos:**
- Android Studio instalado
- Emulador Android configurado OU dispositivo físico conectado via USB
- Habilitar "Modo Desenvolvedor" e "Depuração USB" no dispositivo

#### Opção B: EAS Build (Mais Fácil - Recomendado)

```bash
# 1. Instalar EAS CLI (se ainda não tiver)
npm install -g eas-cli

# 2. Fazer login (criar conta gratuita)
eas login

# 3. Configurar projeto (primeira vez)
eas build:configure

# 4. Gerar build de desenvolvimento
eas build --profile development --platform android
```

**Vantagens:**
- ✅ Não precisa do Android Studio
- ✅ Build na nuvem (mais rápido)
- ✅ Gera APK para download
- ✅ Funciona em qualquer sistema operacional

---

### 2. Instalar o App no Dispositivo

#### Se usou Build Local:
- O app será instalado automaticamente no dispositivo/emulador

#### Se usou EAS Build:
1. Aguarde o build terminar (receberá um link)
2. Baixe o APK do link
3. Instale no dispositivo Android:
   ```bash
   # Via ADB (se dispositivo conectado)
   adb install caminho/para/app.apk
   
   # Ou transfira o APK para o dispositivo e instale manualmente
   ```

---

### 3. Iniciar Servidor de Desenvolvimento

```bash
# No diretório do projeto
cd /home/darley/lacos

# Iniciar com dev client
npx expo start --dev-client
```

**Ou com cache limpo:**
```bash
npx expo start --dev-client -c
```

---

### 4. Conectar o Dispositivo

Após iniciar o servidor:

1. **Abra o app customizado** no dispositivo (não o Expo Go!)
2. **Escaneie o QR code** que aparece no terminal
3. **OU** pressione `a` no terminal para abrir automaticamente no Android

---

## 🔍 Verificar Instalação

```bash
# Verificar se expo-dev-client está instalado
npm list expo-dev-client

# Verificar configuração do projeto
npx expo config

# Ver plugins instalados
npx expo config --type public | grep plugins
```

---

## ⚠️ Importante

1. **Não use Expo Go** após instalar expo-dev-client
   - Use o app customizado gerado pelo build
   - O Expo Go não suporta bibliotecas nativas

2. **Primeira vez pode demorar**
   - O build inicial pode levar 10-20 minutos
   - Builds subsequentes são mais rápidos

3. **Teste em dispositivo real**
   - Emuladores podem ter problemas com vídeo/câmera
   - Dispositivo físico é recomendado

---

## 🐛 Problemas Comuns

### Erro: "Cannot find module expo-dev-client"
```bash
npm install
npx expo start --dev-client -c
```

### App não conecta ao servidor
- Verifique se dispositivo e computador estão na mesma rede Wi-Fi
- Certifique-se de usar `--dev-client` no comando start
- Verifique se o app instalado é o dev client (não Expo Go)

### Build falha
```bash
# Limpar e tentar novamente
npx expo prebuild --clean
npx expo run:android
```

---

## 📝 Checklist

- [x] expo-dev-client instalado
- [x] app.json configurado
- [ ] Build gerado (local ou EAS)
- [ ] App instalado no dispositivo
- [ ] Servidor iniciado com `--dev-client`
- [ ] App conectado e funcionando

---

## 🎯 Comando Rápido (Resumo)

```bash
# 1. Gerar build
npx expo run:android

# 2. Iniciar servidor
npx expo start --dev-client

# 3. Conectar dispositivo e testar!
```


