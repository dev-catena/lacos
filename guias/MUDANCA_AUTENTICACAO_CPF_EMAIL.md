# 🔐 Mudança no Sistema de Autenticação: CPF para Médicos, Email para Outros

## 📋 Resumo das Mudanças

### Médicos
- **Chave única**: CPF (não email)
- **Login**: CPF (não email)
- **Email**: Opcional, pode ter múltiplos emails
- **Restrição**: Só pode ter uma conta de médico por CPF
- **Exclusão**: Quando excluído, pode criar nova conta com mesmo CPF (submetendo análise novamente)

### Outros Perfis (Cuidador/Amigo, Paciente)
- **Chave única**: Email
- **Login**: Email
- **Exclusão**: Email pode ser usado novamente após exclusão
- **Multi-perfil**: Mesmo email pode ter múltiplos perfis (ex: paciente + cuidador)

### Multi-perfil
- Uma pessoa pode ter conta de médico (CPF), cuidador (email) e paciente (email)
- Se criar conta como paciente com `darley@gmail.com`, pode criar como cuidador com mesmo email
- No login, se houver múltiplos perfis com mesmo email, mostrar lista para escolher

---

## 🔧 Mudanças no Backend

### 1. Modelo User
- Adicionar campo `cpf` (nullable, unique quando profile='doctor')
- Modificar validação: `cpf` obrigatório quando `profile='doctor'`
- Modificar validação: `email` obrigatório quando `profile != 'doctor'`
- Modificar unique: `cpf` unique apenas quando `profile='doctor'`

### 2. Registro (Register)
- Se `profile='doctor'`: CPF obrigatório, email opcional
- Se `profile != 'doctor'`: Email obrigatório, CPF não necessário
- Validação: Verificar se já existe médico com mesmo CPF (se profile='doctor')
- Validação: Verificar se já existe outro perfil com mesmo email (se profile != 'doctor')

### 3. Login
- Aceitar `cpf` OU `email` no campo de login
- Detectar qual tipo foi enviado
- Se CPF: buscar médico com esse CPF
- Se Email: buscar todos os perfis com esse email
- Se múltiplos perfis encontrados: retornar lista de perfis disponíveis
- Se um único perfil: fazer login normalmente

### 4. Exclusão
- Quando excluir médico: não bloquear CPF (pode ser reusado)
- Quando excluir outro perfil: não bloquear email (pode ser reusado)
- Exclusão de um perfil não afeta outros perfis

---

## 🎨 Mudanças no Frontend

### 1. Tela de Registro (RegisterScreen)
- Se `profile='doctor'`: Mostrar campo CPF (obrigatório) e Email (opcional)
- Se `profile != 'doctor'`: Mostrar campo Email (obrigatório)
- Validação de CPF no frontend
- Enviar CPF no payload quando for médico

### 2. Tela de Login (LoginScreen)
- Campo de login aceita CPF ou Email
- Placeholder: "CPF (médico) ou E-mail"
- Ao fazer login, verificar se retorna múltiplos perfis
- Se múltiplos perfis: navegar para tela de seleção de perfil

### 3. Nova Tela: Seleção de Perfil (ProfileSelectionScreen)
- Mostrar lista de perfis disponíveis para o email/CPF
- Cada perfil mostra: tipo (Médico, Cuidador, Paciente) e nome
- Ao selecionar: fazer login com o perfil escolhido

---

## 📝 Endpoints Necessários

### POST /api/register
**Mudanças:**
- Aceitar `cpf` quando `profile='doctor'`
- Aceitar `email` quando `profile != 'doctor'`
- Validação diferente baseada no perfil

### POST /api/login
**Mudanças:**
- Aceitar `cpf` OU `email` no campo `login`
- Retornar `profiles` array se múltiplos perfis encontrados
- Retornar `token` e `user` se único perfil

### POST /api/login/select-profile
**Novo endpoint:**
- Receber `login` (cpf ou email) e `profile` escolhido
- Retornar `token` e `user` do perfil selecionado

---

## 🗄️ Mudanças no Banco de Dados

### Tabela `users`
```sql
ALTER TABLE users 
  ADD COLUMN cpf VARCHAR(14) NULL,
  ADD UNIQUE INDEX unique_doctor_cpf (cpf, profile) WHERE profile = 'doctor';
```

### Migração
- Adicionar campo `cpf`
- Criar índice único condicional para CPF quando profile='doctor'
- Migrar CPFs existentes de médicos (se houver campo separado)

---

## ✅ Checklist de Implementação

- [ ] Backend: Adicionar campo CPF ao modelo User
- [ ] Backend: Modificar validação de registro
- [ ] Backend: Modificar endpoint de login
- [ ] Backend: Criar endpoint de seleção de perfil
- [ ] Backend: Modificar exclusão para permitir reuso
- [ ] Frontend: Modificar RegisterScreen para CPF de médico
- [ ] Frontend: Modificar LoginScreen para aceitar CPF/Email
- [ ] Frontend: Criar ProfileSelectionScreen
- [ ] Frontend: Integrar seleção de perfil no fluxo de login
- [ ] Testes: Testar registro de médico com CPF
- [ ] Testes: Testar registro múltiplos perfis com mesmo email
- [ ] Testes: Testar login com múltiplos perfis
- [ ] Testes: Testar exclusão e reuso de CPF/Email













