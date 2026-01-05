# 🏗️ Arquitetura do App Laços

## Visão Geral

O aplicativo Laços foi desenvolvido seguindo uma arquitetura modular e escalável, utilizando as melhores práticas do React Native e Expo.

## 📐 Padrões Arquiteturais

### 1. Organização por Funcionalidade

```
src/
├── config/           # Configurações centralizadas
├── constants/        # Constantes (cores, tamanhos, etc)
├── contexts/         # Gerenciamento de estado global
├── navigation/       # Sistema de navegação
└── screens/          # Telas organizadas por feature
```

### 2. Separação de Responsabilidades

Cada camada tem uma responsabilidade clara:

- **Config**: URLs de API, configurações do ambiente
- **Constants**: Valores reutilizáveis (cores, estilos, etc)
- **Contexts**: Estado global e lógica de negócio compartilhada
- **Navigation**: Fluxo de navegação e estrutura de rotas
- **Screens**: Interface do usuário e interações

## 🧭 Sistema de Navegação

### Estrutura Hierárquica

```
NavigationContainer
└── AuthProvider (Context)
    └── RootNavigator
        ├── AuthNavigator (Stack) - Não autenticado
        │   ├── WelcomeScreen
        │   ├── LoginScreen
        │   └── RegisterScreen
        │
        └── AppNavigator (Tabs) - Autenticado
            ├── HomeStack (Stack)
            │   └── HomeScreen
            ├── GroupsStack (Stack)
            │   └── GroupsScreen
            ├── NotificationsStack (Stack)
            │   └── NotificationsScreen
            └── ProfileStack (Stack)
                └── ProfileScreen
```

### Tipos de Navegadores

1. **RootNavigator**
   - Decisor principal de navegação
   - Verifica estado de autenticação
   - Renderiza AuthNavigator ou AppNavigator

2. **AuthNavigator (Stack Navigator)**
   - Para usuários não autenticados
   - Fluxo linear: Welcome → Login/Register
   - Sem header visível

3. **AppNavigator (Bottom Tabs Navigator)**
   - Para usuários autenticados
   - 4 abas principais com ícones
   - Cada aba contém seu próprio Stack Navigator

4. **Stack Navigators Internos**
   - Permitem navegação hierárquica dentro de cada aba
   - Facilitam adicionar telas aninhadas no futuro
   - Ex: GroupsScreen → GroupDetailScreen → MemberDetailScreen

## 🔐 Gerenciamento de Estado

### Context API - AuthContext

```javascript
AuthContext {
  // Estado
  user: Object | null
  signed: boolean
  loading: boolean
  
  // Métodos
  signIn(email, password): Promise
  signUp(userData): Promise
  signOut(): Promise
  updateUser(data): Promise
}
```

### Fluxo de Autenticação

1. **App Inicia**
   - AuthProvider carrega dados do AsyncStorage
   - Define `loading = true`

2. **Verifica Sessão**
   - Se há usuário salvo → Define `signed = true`
   - Se não há usuário → Define `signed = false`
   - Define `loading = false`

3. **RootNavigator Decide**
   - `loading = true` → Mostra tela de loading
   - `signed = false` → Mostra AuthNavigator
   - `signed = true` → Mostra AppNavigator

4. **Login/Logout**
   - Login → Salva no AsyncStorage → Atualiza Context
   - Logout → Remove do AsyncStorage → Atualiza Context
   - Context muda → RootNavigator re-renderiza automaticamente

### Persistência de Dados

- **AsyncStorage**: Armazenamento local key-value
- **Chaves utilizadas**:
  - `@lacos:user` - Dados do usuário
  - `@lacos:token` - Token de autenticação

## 🎨 Sistema de Design

### Paleta de Cores (colors.js)

```javascript
- Primary: #6366f1 (Roxo/Índigo)
- Secondary: #ec4899 (Rosa)
- Background: #f8fafc (Cinza claro)
- Text: #1e293b (Cinza escuro)
- Success/Warning/Error/Info
- Escala de cinzas (50-900)
```

### Convenções de Estilo

1. **StyleSheet API**: Todos os estilos usando `StyleSheet.create()`
2. **Cores Centralizadas**: Importadas de `constants/colors.js`
3. **Responsividade**: Usar flex e porcentagens
4. **Tipografia**: Fontes do sistema (sem dependências extras)

## 📡 Integração com API

### Configuração (config/api.js)

```javascript
API_CONFIG {
  BASE_URL: string
  TIMEOUT: number
  DEFAULT_HEADERS: object
  ENDPOINTS: {
    AUTH: {...}
    USERS: {...}
    GROUPS: {...}
    ACCOMPANIED: {...}
  }
}
```

### Endpoints Definidos

- **Autenticação**: Login, registro, verificação, logout
- **Usuários**: Perfil, atualização, deleção
- **Grupos**: CRUD completo, membros, códigos
- **Acompanhados**: CRUD para pessoas acompanhadas

### Status Atual

⚠️ **Implementação Mock**: Atualmente o AuthContext usa dados simulados. Para produção:

1. Criar serviço de API (ex: `src/services/api.js`)
2. Usar `fetch` ou `axios` para chamadas HTTP
3. Implementar interceptors para tokens
4. Tratar erros e respostas
5. Substituir código mock nas funções do Context

## 🧩 Componentes e Telas

### Telas de Autenticação

**WelcomeScreen**
- Primeira tela do app
- Apresenta o aplicativo
- Botões: "Criar Conta" e "Já tenho conta"

**LoginScreen**
- Formulário de login
- Validação de campos
- Opção "Esqueci minha senha"
- Link para RegisterScreen

**RegisterScreen**
- Formulário de cadastro completo
- Campos: Nome, sobrenome, e-mail, celular, senha
- Validação de senha (mínimo 6 caracteres)
- Confirmação de senha
- Termos de uso

### Telas Principais (Autenticado)

**HomeScreen**
- Dashboard principal
- Cartão do grupo pessoal
- Lista de grupos que acompanha
- Ações rápidas (medicação, sinais vitais, consultas)
- Notificações em badge

**GroupsScreen**
- Lista de todos os grupos
- Barra de pesquisa
- Separação: Meus Grupos / Grupos que Participo
- Convites pendentes
- Botão "Criar Novo Grupo"

**NotificationsScreen**
- Central de notificações
- Filtros: Todas / Não lidas / Lidas
- Badge visual para não lidas
- Tipos: medicação, consulta, grupo
- Opção "Marcar todas como lidas"

**ProfileScreen**
- Dados do usuário
- Avatar com inicial do nome
- Botão "Editar Perfil"
- Menu de configurações:
  - Conta (dados, segurança, notificações)
  - App (sobre, ajuda, termos)
- Botão "Sair da Conta" com confirmação

## 🔄 Fluxos de Dados

### Fluxo de Login

```
1. Usuário digita credenciais
2. Tela chama signIn() do AuthContext
3. AuthContext valida e faz requisição (mock)
4. Se sucesso:
   - Salva user e token no AsyncStorage
   - Atualiza state (user, signed)
5. RootNavigator detecta mudança
6. Renderiza AppNavigator
7. Usuário vê HomeScreen
```

### Fluxo de Navegação entre Abas

```
1. Usuário toca em ícone da aba
2. Bottom Tab Navigator muda rota ativa
3. Stack Navigator da aba renderiza tela inicial
4. Estado e dados são mantidos (não re-renderiza)
```

### Fluxo de Logout

```
1. Usuário clica "Sair da Conta"
2. Alert de confirmação
3. Se confirma:
   - signOut() remove dados do AsyncStorage
   - Context atualiza (user: null, signed: false)
4. RootNavigator detecta mudança
5. Renderiza AuthNavigator
6. Usuário vê WelcomeScreen
```

## 📦 Dependências Principais

### Produção

```json
{
  "expo": "~50.0.0",
  "react": "18.2.0",
  "react-native": "0.73.0",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20",
  "@react-navigation/bottom-tabs": "^6.5.11",
  "@react-native-async-storage/async-storage": "^1.21.0",
  "react-native-vector-icons": "^10.0.3",
  "react-native-screens": "~3.29.0",
  "react-native-safe-area-context": "4.8.2",
  "react-native-gesture-handler": "~2.14.0"
}
```

### Por que cada dependência?

- **expo**: Framework e ferramentas
- **react-navigation**: Sistema de navegação completo
- **async-storage**: Persistência local
- **vector-icons**: Biblioteca de ícones
- **gesture-handler**: Gestos e interações
- **safe-area-context**: Suporte a notch/área segura
- **screens**: Otimização de performance de telas

## 🚀 Escalabilidade

### Como Adicionar Nova Tela

1. Criar arquivo em `src/screens/[Feature]/[Nome]Screen.js`
2. Importar no navegador apropriado
3. Adicionar rota no Stack Navigator
4. Configurar opções de navegação

### Como Adicionar Novo Context

1. Criar arquivo em `src/contexts/[Nome]Context.js`
2. Exportar Provider e hook customizado
3. Envolver App ou parte específica no Provider
4. Usar hook nas telas necessárias

### Como Adicionar Nova Feature

1. Criar pasta em `src/screens/[NovaFeature]/`
2. Criar telas necessárias
3. Criar Stack Navigator se necessário
4. Adicionar no AppNavigator (Tab ou Stack)
5. Adicionar Context se precisar de estado global
6. Definir endpoints em `config/api.js`

## 🎯 Casos de Uso Mapeados

### Caso 1: Criação de Conta e Grupo Pessoal

**Telas**: RegisterScreen → HomeScreen

**Fluxo**:
1. WelcomeScreen → "Criar Conta"
2. RegisterScreen → Preencher dados → "Criar Conta"
3. AuthContext.signUp() → Cria usuário (mock)
4. Backend criaria: user + grupo pessoal
5. Auto-login → HomeScreen

**Status**: ✅ Estrutura pronta, API mock

### Caso 2: Criação de Grupo para Outra Pessoa

**Telas**: GroupsScreen → CreateGroupScreen (a criar)

**Fluxo**:
1. GroupsScreen → "Criar Novo Grupo"
2. CreateGroupScreen → Dados do acompanhado
3. API cria grupo e pessoa acompanhada
4. Gera código de pareamento
5. Mostra código para usuário

**Status**: 🟡 Estrutura base pronta, necessita CreateGroupScreen

### Caso 3: Adicionar Cuidador ao Grupo

**Telas**: GroupDetailScreen (a criar) → Invite flow

**Fluxo**:
1. GroupsScreen → Selecionar grupo
2. GroupDetailScreen → "Adicionar Membro"
3. Gerar/Mostrar código
4. Novo usuário recebe código
5. Insere código → API valida → Adiciona ao grupo

**Status**: 🟡 Estrutura base pronta, necessita telas específicas

## 📝 Próximos Passos de Desenvolvimento

### Fase 1: Backend Integration
- [ ] Implementar service layer (`src/services/api.js`)
- [ ] Conectar AuthContext com API real
- [ ] Implementar refresh token
- [ ] Tratar erros de rede

### Fase 2: Grupos de Cuidados
- [ ] Criar GroupDetailScreen
- [ ] Criar CreateGroupScreen
- [ ] Implementar geração de código
- [ ] Sistema de convites

### Fase 3: Funcionalidades Core
- [ ] Registro de medicações
- [ ] Sinais vitais
- [ ] Agenda de consultas
- [ ] Upload de documentos

### Fase 4: Notificações
- [ ] Notificações push (Expo Notifications)
- [ ] Lembretes de medicação
- [ ] Alertas de consulta

### Fase 5: Chat e Colaboração
- [ ] Sistema de mensagens entre cuidadores
- [ ] Timeline de eventos
- [ ] Compartilhamento de informações

## 🔒 Considerações de Segurança

- Tokens armazenados de forma segura
- Validação de inputs em todas as telas
- HTTPS obrigatório para API
- Criptografia de dados sensíveis
- Controle de permissões por grupo
- Logs de auditoria

## 📊 Performance

- Lazy loading de telas
- Otimização de re-renders com React.memo
- Virtual lists para grandes listas
- Imagens otimizadas e cache
- Bundle size monitoring

---

**Esta arquitetura foi projetada para ser escalável, manutenível e seguir as melhores práticas do ecossistema React Native.**

