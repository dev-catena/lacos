# 🚀 Guia: EAS Build + Desenvolvimento Contínuo

## ✅ Resposta Rápida

**SIM!** Você pode gerar um build com EAS **uma vez** e depois continuar desenvolvendo normalmente com Expo, **sem precisar gerar novos builds** a cada teste.

---

## 📋 Como Funciona

### 1. **Build Inicial (Uma Vez)**

Gere um build de desenvolvimento com EAS:

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
- ✅ Gerar um APK/IPA com `expo-dev-client` embutido
- ✅ Instalar no dispositivo (ou baixar e instalar manualmente)
- ✅ **Você só precisa fazer isso UMA VEZ!**

### 2. **Desenvolvimento Contínuo (Sem Novos Builds)**

Após instalar o build inicial, você desenvolve normalmente:

```bash
# Iniciar servidor de desenvolvimento
npx expo start --dev-client
```

**O que acontece:**
- ✅ O app customizado se conecta ao servidor Expo
- ✅ **Hot Reload funciona normalmente**
- ✅ **Fast Refresh funciona normalmente**
- ✅ Você pode fazer alterações no código e ver instantaneamente
- ✅ **NÃO precisa gerar novo build!**

---

## 🔄 Fluxo de Trabalho

### Primeira Vez (Setup)

```bash
# 1. Gerar build de desenvolvimento (UMA VEZ)
eas build --profile development --platform android

# 2. Instalar o APK no dispositivo

# 3. Iniciar servidor
npx expo start --dev-client

# 4. Conectar o app (escanear QR code)
```

### Desenvolvimento Diário

```bash
# Apenas iniciar o servidor (SEM gerar novo build!)
npx expo start --dev-client

# Fazer alterações no código
# → O app recarrega automaticamente
# → Hot Reload funciona normalmente
```

---

## ⚠️ Quando Precisa Gerar Novo Build?

Você **só precisa gerar um novo build** quando:

1. **Adicionar nova biblioteca nativa** (que requer código nativo)
   - Exemplo: `react-native-vision-camera`, `react-native-webrtc`
   - Solução: `npx expo install <biblioteca>` + novo build

2. **Alterar configurações nativas** (`app.json`, permissões, etc.)
   - Exemplo: Adicionar nova permissão de câmera
   - Solução: Novo build

3. **Atualizar dependências nativas**
   - Exemplo: Atualizar `expo-dev-client` para versão nova
   - Solução: Novo build

4. **Preparar para produção**
   - Solução: `eas build --profile production`

### ❌ NÃO Precisa de Novo Build Para:

- ✅ Alterar código JavaScript/TypeScript
- ✅ Adicionar novas telas
- ✅ Modificar estilos
- ✅ Alterar lógica de negócio
- ✅ Adicionar bibliotecas JavaScript puras
- ✅ Testar funcionalidades

---

## 🎯 Exemplo Prático

### Cenário: Adicionar Nova Tela

```bash
# 1. Criar nova tela (src/screens/NewScreen.js)
# 2. Adicionar rota
# 3. Salvar arquivo
# → App recarrega automaticamente
# → Nova tela aparece
# ✅ SEM gerar novo build!
```

### Cenário: Adicionar Biblioteca Nativa

```bash
# 1. Instalar biblioteca nativa
npx expo install react-native-vision-camera

# 2. Gerar novo build (necessário!)
eas build --profile development --platform android

# 3. Instalar novo APK
# 4. Continuar desenvolvendo normalmente
npx expo start --dev-client
```

---

## 📱 Comparação: Expo Go vs Dev Client

| Recurso | Expo Go | Dev Client (EAS Build) |
|---------|---------|------------------------|
| Hot Reload | ✅ | ✅ |
| Fast Refresh | ✅ | ✅ |
| Bibliotecas Nativas | ❌ | ✅ |
| Desenvolvimento Contínuo | ✅ | ✅ |
| Build Necessário | ❌ | ✅ (uma vez) |

---

## 💡 Dicas

1. **Use o mesmo build por semanas/meses**
   - Só gere novo build quando realmente necessário

2. **Mantenha o servidor rodando**
   - `npx expo start --dev-client` pode ficar rodando o dia todo

3. **Cache do Metro**
   - Se algo não atualizar, limpe o cache: `npx expo start --dev-client -c`

4. **Build de Produção**
   - Use `eas build --profile production` apenas quando for publicar

---

## 🚀 Comandos Essenciais

```bash
# Gerar build de desenvolvimento (UMA VEZ)
eas build --profile development --platform android

# Iniciar servidor (TODO DIA)
npx expo start --dev-client

# Limpar cache e iniciar
npx expo start --dev-client -c

# Ver builds gerados
eas build:list

# Gerar build de produção (quando pronto)
eas build --profile production --platform android
```

---

## ✅ Resumo

1. **Gere o build UMA VEZ** com `eas build --profile development`
2. **Instale no dispositivo**
3. **Desenvolva normalmente** com `npx expo start --dev-client`
4. **Hot Reload funciona** sem precisar de novos builds
5. **Só gere novo build** quando adicionar bibliotecas nativas ou alterar configurações nativas

**Você pode desenvolver por semanas/meses com o mesmo build!** 🎉


