# Laços - App de Cuidados para Idosos

Aplicação mobile desenvolvida em React Native com Expo para facilitar o cuidado de pessoas idosas através de grupos de cuidadores compartilhados.

## 📱 Sobre o Projeto

O Laços permite criar grupos de cuidados onde familiares e profissionais de saúde podem compartilhar informações médicas, acompanhar medicações, agendar consultas e manter todos os cuidadores informados sobre o estado de saúde da pessoa acompanhada.

## 🚀 Tecnologias Utilizadas

- **React Native** (0.73.0)
- **Expo** (~50.0.0)
- **React Navigation** (v6)
  - Stack Navigator
  - Bottom Tabs Navigator
- **AsyncStorage** - Persistência local
- **React Native Vector Icons** - Ícones
- **Context API** - Gerenciamento de estado

## 📂 Estrutura do Projeto

```
lacos/
├── src/
│   ├── config/           # Configurações (API)
│   │   └── api.js
│   ├── constants/        # Constantes (cores)
│   │   └── colors.js
│   ├── contexts/         # Context API
│   │   └── AuthContext.js
│   ├── navigation/       # Navegação
│   │   ├── RootNavigator.js
│   │   ├── AuthNavigator.js
│   │   └── AppNavigator.js
│   └── screens/          # Telas
│       ├── Auth/
│       │   ├── WelcomeScreen.js
│       │   ├── LoginScreen.js
│       │   └── RegisterScreen.js
│       ├── Home/
│       │   └── HomeScreen.js
│       ├── Groups/
│       │   └── GroupsScreen.js
│       ├── Notifications/
│       │   └── NotificationsScreen.js
│       └── Profile/
│           └── ProfileScreen.js
├── App.js
├── app.json
├── package.json
└── babel.config.js
```

## 🎯 Casos de Uso Implementados (Estrutura Base)

### 1. Criação de Conta e Grupo Pessoal de Cuidados
- Tela de cadastro com validação de dados
- Criação automática de grupo pessoal ao criar conta
- Usuário como administrador do próprio grupo

### 2. Criação de Grupo de Cuidados para Outra Pessoa
- Interface para gerenciar múltiplos grupos
- Cadastro de dados da pessoa acompanhada
- Geração de código de pareamento

### 3. Adicionar Cuidador a um Grupo de Cuidados
- Sistema de convites com código
- Gerenciamento de permissões
- Controle de membros do grupo

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js (v14 ou superior)
- npm ou yarn
- Expo CLI
- Expo Go app (para testar no dispositivo)

### Instalação

1. Clone o repositório ou navegue até a pasta do projeto:
```bash
cd /home/darley/lacos
```

2. Instale as dependências:
```bash
npm install
```

### Executar o Projeto

1. Inicie o servidor Expo:
```bash
npm start
# ou
expo start
```

2. Para executar em plataformas específicas:
```bash
npm run android  # Para Android
npm run ios      # Para iOS (apenas macOS)
npm run web      # Para Web
```

3. Escaneie o QR Code com o app Expo Go (Android) ou Camera (iOS)

## 🎨 Design

- **Paleta de Cores**: Baseada em tons de índigo/roxo com acentos em rosa
- **Tipografia**: System fonts nativas para melhor performance
- **Ícones**: Ionicons (via react-native-vector-icons)

## 🔐 Autenticação

O sistema de autenticação está implementado usando Context API com as seguintes funcionalidades:

- Login com e-mail/senha
- Cadastro de novos usuários
- Persistência de sessão com AsyncStorage
- Logout

**Nota**: A implementação atual usa dados mock. Para produção, é necessário integrar com uma API backend real.

## 📱 Navegação

### Fluxo de Autenticação (AuthNavigator)
- Welcome Screen
- Login Screen  
- Register Screen

### Aplicação Principal (AppNavigator - Bottom Tabs)
- **Home**: Visão geral dos grupos e ações rápidas
- **Grupos**: Gerenciamento de grupos de cuidados
- **Notificações**: Central de notificações e lembretes
- **Perfil**: Configurações e dados do usuário

## 🔄 Estado Global

Gerenciado através do `AuthContext` que provê:
- `user`: Dados do usuário autenticado
- `signed`: Status de autenticação
- `loading`: Estado de carregamento
- `signIn()`: Função de login
- `signUp()`: Função de cadastro
- `signOut()`: Função de logout
- `updateUser()`: Atualizar dados do usuário

## 📝 Próximos Passos

- [ ] Integração com backend/API REST
- [ ] Implementação completa dos casos de uso
- [ ] Sistema de pareamento entre apps
- [ ] Gerenciamento de medicações
- [ ] Agenda de consultas
- [ ] Registro de sinais vitais
- [ ] Sistema de notificações push
- [ ] Upload de fotos e documentos
- [ ] Chat entre cuidadores

## 📄 Licença

Este projeto está sob desenvolvimento.

## 👥 Contato

Para dúvidas ou sugestões sobre o projeto, entre em contato.

---

Desenvolvido com 💙 para cuidar de quem amamos

