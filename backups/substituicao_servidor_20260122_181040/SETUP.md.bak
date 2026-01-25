# 🚀 Guia de Setup - Laços App

Este guia irá ajudá-lo a configurar e executar o aplicativo Laços pela primeira vez.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 14 ou superior): [Download](https://nodejs.org/)
- **npm** ou **yarn**: Vem com Node.js
- **Expo CLI**: Instale globalmente
  ```bash
  npm install -g expo-cli
  ```
- **Expo Go App**: Baixe no seu smartphone
  - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Android - Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🔧 Instalação

### Passo 1: Instalar Dependências

```bash
cd /home/darley/lacos
npm install
```

Isso irá instalar todas as dependências listadas no `package.json`:
- React Native e Expo
- React Navigation (Stack e Bottom Tabs)
- AsyncStorage
- React Native Vector Icons
- Outras bibliotecas necessárias

### Passo 2: Verificar Instalação

```bash
npm list
```

Verifique se todas as dependências foram instaladas sem erros.

## ▶️ Executando o Aplicativo

### Modo Desenvolvimento

1. **Iniciar o servidor Expo:**
   ```bash
   npm start
   ```
   ou
   ```bash
   expo start
   ```

2. **Você verá um QR Code no terminal e uma janela abrirá no navegador**

3. **Testar no dispositivo físico:**
   - Abra o app **Expo Go** no seu smartphone
   - Escaneie o QR Code:
     - iOS: Use o app da Câmera nativa
     - Android: Use o scanner dentro do app Expo Go
   - O app será carregado no seu dispositivo

4. **Testar no emulador:**
   ```bash
   # Android
   npm run android
   
   # iOS (apenas macOS)
   npm run ios
   
   # Web
   npm run web
   ```

## 🎨 Assets Faltantes

O projeto foi criado sem os arquivos de imagem. Para gerar os ícones e splash screen:

### Opção 1: Usar Imagens Temporárias

Crie arquivos de imagem simples ou use placeholders e coloque na pasta `assets/`:
- `icon.png` (1024x1024px)
- `adaptive-icon.png` (1024x1024px)
- `splash.png` (2048x3840px)
- `favicon.png` (48x48px)

### Opção 2: Usar ferramentas online

Use serviços como:
- [Canva](https://www.canva.com/) - Para criar ícones
- [Figma](https://www.figma.com/) - Design de UI
- [IconKitchen](https://icon.kitchen/) - Gerador de ícones para apps

## 🧪 Testando o App

### Fluxo de Teste Inicial

1. **Tela de Boas-vindas**
   - Abra o app
   - Você verá a tela Welcome com opções "Criar Conta" e "Já tenho conta"

2. **Criar uma Conta**
   - Clique em "Criar Conta"
   - Preencha os campos:
     - Nome e Sobrenome
     - E-mail
     - Senha (mínimo 6 caracteres)
     - Confirmar Senha
   - Clique em "Criar Conta"

3. **Explorar o App**
   - Após login, você verá 4 abas:
     - **Home**: Visão geral e ações rápidas
     - **Grupos**: Gerenciar grupos de cuidados
     - **Notificações**: Ver alertas e lembretes
     - **Perfil**: Configurações da conta

4. **Testar Logout**
   - Vá para aba "Perfil"
   - Role até o final
   - Clique em "Sair da Conta"

## 🔍 Estrutura de Arquivos

```
lacos/
├── App.js                 # Ponto de entrada principal
├── src/
│   ├── config/           # Configurações da API
│   ├── constants/        # Cores e constantes
│   ├── contexts/         # Context API (Auth)
│   ├── navigation/       # Navegadores
│   └── screens/          # Telas do app
├── assets/               # Imagens e ícones
├── package.json          # Dependências
└── app.json             # Configuração do Expo
```

## 🐛 Resolução de Problemas

### Erro: "Module not found"
```bash
# Limpe o cache e reinstale
rm -rf node_modules
npm install
```

### Erro: "Expo CLI not found"
```bash
# Instale o Expo CLI globalmente
npm install -g expo-cli
```

### Erro com AsyncStorage
```bash
# Reinstale a dependência específica
npm install @react-native-async-storage/async-storage
```

### Erro com React Navigation
```bash
# Reinstale as dependências de navegação
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
```

### App não carrega no dispositivo
1. Certifique-se de que o computador e o smartphone estão na mesma rede Wi-Fi
2. Desabilite VPN se estiver usando
3. Tente usar o modo "Tunnel" no Expo DevTools
4. Reinicie o servidor Expo (Ctrl+C e depois `npm start`)

## 📱 Próximos Passos

Após configurar o ambiente:

1. **Explore o código** - Familiarize-se com a estrutura
2. **Personalize as cores** - Edite `src/constants/colors.js`
3. **Configure a API** - Ajuste `src/config/api.js` com sua URL backend
4. **Implemente funcionalidades** - Comece pelos casos de uso definidos

## 📚 Documentação Útil

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

## 💡 Dicas

- Use `console.log()` para debug durante desenvolvimento
- Recarregue o app com "r" no terminal do Expo
- Use hot reload - as mudanças aparecem automaticamente
- Verifique o console do navegador (Expo DevTools) para erros

## ✅ Checklist de Setup Completo

- [ ] Node.js instalado
- [ ] Expo CLI instalado globalmente
- [ ] Dependências instaladas (`npm install`)
- [ ] Expo Go instalado no smartphone
- [ ] Servidor Expo iniciado (`npm start`)
- [ ] App carregado no dispositivo/emulador
- [ ] Testado fluxo de criar conta e login
- [ ] Exploradas todas as 4 abas principais

---

**Pronto! Você está pronto para começar a desenvolver o Laços! 🎉**

Em caso de dúvidas, consulte a documentação ou revise este guia.

