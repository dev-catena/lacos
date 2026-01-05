# 🚀 Comandos Rápidos - Laços App

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Instalar dependência específica
npm install [nome-da-dependência]

# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## ▶️ Execução

```bash
# Iniciar o servidor Expo
npm start

# Iniciar no Android
npm run android

# Iniciar no iOS (apenas macOS)
npm run ios

# Iniciar na Web
npm run web

# Iniciar com cache limpo
expo start -c
```

## 🔍 Debug e Desenvolvimento

```bash
# Recarregar o app no emulador/dispositivo
# Pressione 'r' no terminal do Expo

# Abrir DevTools
# Pressione 'd' no terminal do Expo

# Limpar cache do Expo
expo start -c

# Verificar dependências instaladas
npm list

# Atualizar dependências
npm update
```

## 📱 Gerenciamento de Dispositivos

```bash
# Ver dispositivos Android conectados
adb devices

# Ver simuladores iOS (macOS)
xcrun simctl list

# Abrir o app no emulador Android
npm run android

# Abrir o app no simulador iOS
npm run ios
```

## 🛠️ Ferramentas Úteis

```bash
# Ver estrutura de arquivos (se tree instalado)
tree -L 3 -I 'node_modules|.expo'

# Buscar arquivos
find . -name "*.js" | grep -v node_modules

# Ver tamanho do projeto
du -sh .

# Verificar versão do Node
node --version

# Verificar versão do npm
npm --version

# Verificar versão do Expo
expo --version
```

## 🔧 Problemas Comuns

### Erro: "Metro Bundler error"
```bash
expo start -c
# ou
rm -rf node_modules
npm install
expo start
```

### Erro: "Unable to resolve module"
```bash
npm install [módulo-faltando]
expo start -c
```

### Erro: "AsyncStorage não funciona"
```bash
npm install @react-native-async-storage/async-storage
expo start -c
```

### Erro: "React Navigation não funciona"
```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
expo start -c
```

### App não conecta no dispositivo
```bash
# Verifique se estão na mesma rede WiFi
# Tente usar modo Tunnel
expo start --tunnel
```

## 📚 Navegação no Código

```bash
# Abrir projeto no VS Code
code .

# Ver estrutura do src
ls -R src/

# Buscar texto no código
grep -r "searchTerm" src/

# Ver últimas modificações
git log --oneline -10
```

## 🧹 Limpeza

```bash
# Remover node_modules
rm -rf node_modules

# Remover cache do Expo
rm -rf .expo

# Limpar tudo e reinstalar
rm -rf node_modules .expo package-lock.json
npm install
```

## 📦 Build (Produção)

```bash
# Build para Android (quando pronto)
eas build --platform android

# Build para iOS (quando pronto)
eas build --platform ios

# Build para ambos
eas build --platform all
```

## 🔐 Variáveis de Ambiente

```bash
# Criar arquivo .env (quando necessário)
touch .env

# Editar .env
nano .env
# ou
code .env
```

## 📊 Informações do Projeto

```bash
# Ver package.json
cat package.json

# Ver configuração do Expo
cat app.json

# Ver dependências instaladas
npm list --depth=0

# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades
npm audit fix
```

## 🎨 Assets

```bash
# Verificar assets existentes
ls -lh assets/

# Adicionar imagem aos assets
cp /caminho/para/imagem.png assets/
```

## 🌐 Git (Controle de Versão)

```bash
# Inicializar repositório
git init

# Ver status
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "feat: descrição da mudança"

# Ver histórico
git log --oneline

# Criar branch
git checkout -b nome-da-branch

# Mudar de branch
git checkout main
```

## 🔥 Comandos de Emergência

```bash
# Parar todos os processos do Expo/Metro
killall node
# ou
pkill -f expo

# Limpar TUDO
rm -rf node_modules .expo package-lock.json
npm cache clean --force
npm install
expo start -c

# Reinstalar Expo CLI
npm install -g expo-cli
```

## 📱 Atalhos do Expo DevTools

Quando `npm start` está rodando:

- `r` - Recarregar app
- `d` - Abrir DevTools
- `i` - Abrir no iOS Simulator
- `a` - Abrir no Android Emulator
- `w` - Abrir na Web
- `c` - Mostrar QR code
- `Ctrl+C` - Parar o servidor

## 🎯 Comandos por Tarefa

### Começar do Zero
```bash
cd /home/darley/lacos
npm install
npm start
```

### Adicionar Nova Dependência
```bash
npm install nome-da-lib
expo start -c
```

### Testar em Novo Dispositivo
```bash
expo start
# Escanear QR code no Expo Go
```

### Atualizar Código e Ver Mudanças
```bash
# Salve o arquivo
# App recarrega automaticamente (Hot Reload)
# Se não recarregar, pressione 'r' no terminal
```

### Debug de Erro
```bash
1. Ler mensagem de erro no terminal
2. Verificar console do navegador (DevTools)
3. Limpar cache: expo start -c
4. Se persistir: rm -rf node_modules && npm install
```

## 💡 Dicas Finais

- Use `expo start -c` quando algo não funciona
- Mantenha Expo Go atualizado no smartphone
- Console.log é seu amigo para debug
- Leia os erros com atenção - geralmente dizem o que fazer
- Salve o código frequentemente (Ctrl+S)
- Use Git para não perder trabalho

---

**Estes comandos cobrem 95% das suas necessidades diárias de desenvolvimento!**

