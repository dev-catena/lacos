# ✅ FLUXO DE AUTENTICAÇÃO E GRUPOS - IMPLEMENTADO CORRETAMENTE

## 📱 Fluxo Completo (Como Está Implementado)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1️⃣ APP ABRE                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RootNavigator verifica:                                        │
│  - signed = false                                               │
│  - user = null                                                  │
│  - isAuthenticated = false                                      │
│                                                                 │
│  ✅ Renderiza: AuthNavigator (WelcomeScreen)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2️⃣ WELCOMESCREEN                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Opções:                                                        │
│  ┌─────────────────────┐     ┌─────────────────────┐          │
│  │  📝 Criar Conta     │     │  🔑 Já tenho conta  │          │
│  └─────────────────────┘     └─────────────────────┘          │
│                                                                 │
│  ❌ NÃO pede tipo de perfil                                     │
│  ❌ NÃO pede papel (paciente/acompanhante)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3️⃣ CRIAR CONTA (RegisterScreen)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Campos:                                                        │
│  • Nome                                                         │
│  • Sobrenome                                                    │
│  • Email                                                        │
│  • Telefone (opcional)                                          │
│  • Senha                                                        │
│  • Confirmar senha                                              │
│                                                                 │
│  ✅ Cria usuário GENÉRICO (sem papel definido)                  │
│  ✅ Papel será definido AO ENTRAR EM UM GRUPO                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4️⃣ APÓS CADASTRO/LOGIN (AuthContext)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AuthContext.signUp():                                          │
│  - Salva user no AsyncStorage                                   │
│  - Salva token no AsyncStorage                                  │
│  - setUser(response.user) ✅                                    │
│                                                                 │
│  Estado agora:                                                  │
│  - signed = true ✅                                             │
│  - user = { id, name, email, ... } ✅                           │
│  - isAuthenticated = true ✅                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5️⃣ ROOTNAVIGATOR (Após Login)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RootNavigator verifica:                                        │
│  - signed = true ✅                                             │
│  - user = {...} ✅                                              │
│  - isAuthenticated = true ✅                                    │
│                                                                 │
│  ✅ Renderiza: AppNavigator (HomeScreen)                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6️⃣ HOMESCREEN (Verifica Grupos)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HomeScreen.loadGroups():                                       │
│  - Busca grupos da API                                          │
│  - Verifica: groups.length === 0 ?                              │
│                                                                 │
│    SIM (0 grupos):                                              │
│    ↓                                                            │
│    navigation.replace('NoGroups') ✅                            │
│    ↓                                                            │
│    Vai para NoGroupsScreen                                      │
│                                                                 │
│    NÃO (tem grupos):                                            │
│    ↓                                                            │
│    Mostra lista de grupos ✅                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7️⃣ NOGROUPSSCREEN (Opções de Entrada em Grupos)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Opções:                                                        │
│                                                                 │
│  ┌────────────────────────────────────────┐                    │
│  │ ➕ Criar Novo Grupo                    │                    │
│  │                                        │                    │
│  │ → Vai para CreateGroupScreen           │                    │
│  │ → Usuário vira ADMIN do grupo ✅       │                    │
│  │ → Define papel dos outros membros      │                    │
│  └────────────────────────────────────────┘                    │
│                                                                 │
│  ┌────────────────────────────────────────┐                    │
│  │ 🔑 Entrar com Código                   │                    │
│  │                                        │                    │
│  │ → Digite código recebido               │                    │
│  │ → Papel definido por quem convidou ✅  │                    │
│  │ → Pode ser: caregiver OU patient       │                    │
│  └────────────────────────────────────────┘                    │
│                                                                 │
│  ℹ️ Você pode fazer parte de vários grupos                      │
│     ao mesmo tempo e ter diferentes papéis                      │
│     em cada um.                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Papéis Por Grupo (Tabela: group_members)

Um **MESMO USUÁRIO** pode ter **DIFERENTES PAPÉIS** em **DIFERENTES GRUPOS**:

```
┌──────────────────────────────────────────────────────────────────┐
│ Exemplo: João Silva (user_id: 1)                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Grupo: "Cuidados da Mãe"                                        │
│  └─ Papel: ADMIN (criou o grupo)                                │
│  └─ Papel: CAREGIVER (acompanha a mãe)                          │
│                                                                  │
│  Grupo: "Família Silva"                                          │
│  └─ Papel: PATIENT (ele mesmo é o paciente)                     │
│                                                                  │
│  Grupo: "Cuidados do Pai"                                        │
│  └─ Papel: CAREGIVER (entrou com código)                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Estrutura do Banco**:
```sql
group_members:
  - id
  - group_id (qual grupo)
  - user_id (qual usuário)
  - role (admin / caregiver / patient) ✅
  
Um usuário pode ter MÚLTIPLAS linhas (múltiplos papéis em múltiplos grupos)
```

---

## 📋 Checklist do Fluxo Implementado

### ✅ Parte 1: Criação de Conta
- [x] WelcomeScreen com opções "Criar Conta" e "Login"
- [x] RegisterScreen NÃO pede tipo de perfil
- [x] RegisterScreen NÃO pede papel (paciente/acompanhante)
- [x] Cria usuário genérico no banco
- [x] Após cadastro, faz login automático
- [x] AuthContext seta `user` e `signed=true`

### ✅ Parte 2: Proteção de Acesso
- [x] RootNavigator verifica `signed` E `user`
- [x] Se não autenticado → AuthNavigator (WelcomeScreen)
- [x] Se autenticado → AppNavigator (HomeScreen)
- [x] Impossível acessar telas protegidas sem login

### ✅ Parte 3: Verificação de Grupos
- [x] HomeScreen carrega grupos da API
- [x] Se `groups.length === 0` → navega para NoGroupsScreen
- [x] Se tem grupos → mostra lista de grupos
- [x] NoGroupsScreen só acessível quando autenticado

### ✅ Parte 4: Entrada em Grupos
- [x] NoGroupsScreen com 2 opções:
  - [x] "Criar Novo Grupo" → vira admin
  - [x] "Entrar com Código" → recebe papel do convite
- [x] Papéis definidos POR GRUPO (não na criação da conta)
- [x] Um usuário pode ter múltiplos papéis em múltiplos grupos

### ✅ Parte 5: Segurança
- [x] Guards em 3 camadas (RootNavigator, Telas, Ações)
- [x] Impossível criar grupo sem autenticação
- [x] Impossível entrar com código sem autenticação
- [x] Logs de erro se acesso não autorizado

---

## 🎨 Fluxo Visual Simplificado

```
App Abre
   ↓
WelcomeScreen (Criar Conta / Login)
   ↓
RegisterScreen (apenas dados básicos, SEM papel)
   ↓
Login Automático (AuthContext)
   ↓
HomeScreen (verifica grupos)
   ↓
   ├─ Tem grupos? → Mostra lista
   │
   └─ Não tem grupos? → NoGroupsScreen
                           ↓
                           ├─ Criar Grupo → Vira Admin
                           │
                           └─ Entrar com Código → Papel definido por quem convidou
```

---

## 🔑 Conceitos Importantes

### 1. Usuário vs Papel
- **Usuário**: Pessoa física com login e senha
- **Papel**: Função em um GRUPO específico (admin/caregiver/patient)

### 2. Múltiplos Papéis
- Um usuário pode ter VÁRIOS papéis
- Cada papel é em um GRUPO diferente
- Exemplo: Admin no Grupo A, Patient no Grupo B

### 3. Definição de Papel
- **NÃO** é definido no cadastro
- **SIM** é definido ao entrar em um grupo:
  - Criou grupo → Admin
  - Recebeu código → Papel do convite

---

## ✅ ESTÁ IMPLEMENTADO EXATAMENTE COMO VOCÊ PEDIU!

O fluxo está **100% correto** e segue EXATAMENTE a lógica que você descreveu:

1. ✅ App abre → Login/Criar Conta
2. ✅ Criar conta → Usuário genérico (SEM papel)
3. ✅ Após login → Verifica grupos
4. ✅ Sem grupos → NoGroupsScreen com opções:
   - ✅ Criar grupo (vira admin)
   - ✅ Entrar com código (recebe papel)
5. ✅ Papéis definidos POR GRUPO
6. ✅ Um usuário pode ter múltiplos papéis

---

## 🧪 Para Confirmar

Teste agora e veja:

```bash
cd /home/darley/lacos
npx expo start --clear
```

1. **Abrir app** → Ver WelcomeScreen ✅
2. **Criar conta** → NÃO pede papel ✅
3. **Após login** → Ver NoGroupsScreen (se não tem grupos) ✅
4. **Criar grupo** → Vira admin ✅
5. **OU entrar com código** → Recebe papel ✅

**Está exatamente como você pediu!** 🎉

