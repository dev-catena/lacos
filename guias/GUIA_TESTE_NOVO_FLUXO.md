# 🧪 Guia de Teste - Novo Fluxo de Autenticação

## ✅ O Que Foi Implementado

### Backend ✅
- Tabela `group_members` com coluna `role` (`admin`, `caregiver`, `patient`)
- Índice `unique_member_role` permite múltiplos papéis
- Endpoints para gerenciar papéis:
  - `GET /api/groups/{groupId}/user/roles`
  - `POST /api/groups/{groupId}/members/{userId}/roles`

### Frontend ✅
- `WelcomeScreen` - Tela inicial (Criar Conta / Já tenho conta)
- `NoGroupsScreen` - Aparece quando não tem grupos
- `ProfileSwitcher` - Troca entre Acompanhante/Paciente
- `HomeScreen` - Detecta zero grupos e integra ProfileSwitcher
- Navegação atualizada

---

## 🧪 Cenários de Teste

### 📱 Teste 1: Novo Usuário (Zero Grupos)

**Objetivo**: Verificar fluxo para usuário sem grupos

**Passos**:
1. Abrir app → Ver `WelcomeScreen`
2. Clicar em "Criar Conta"
3. Preencher formulário de registro
4. Fazer login automático
5. **Esperar**: Deve aparecer `NoGroupsScreen`
6. Ver 2 opções:
   - "Criar Novo Grupo"
   - "Entrar com Código"

**Resultado Esperado**:
✅ Navegação fluida sem erros
✅ NoGroupsScreen aparece automaticamente
✅ Cards clicáveis e responsivos

---

### 📱 Teste 2: Criar Primeiro Grupo

**Objetivo**: Criar grupo e virar admin

**Passos**:
1. Em `NoGroupsScreen`, clicar "Criar Novo Grupo"
2. Preencher formulário:
   - Nome do grupo
   - Nome do acompanhado
   - Outros campos
3. Salvar
4. **Esperar**: Deve voltar para `HomeScreen`
5. Ver o grupo criado na aba "Meus Grupos"
6. Clicar no grupo → Ver `GroupDetailScreen`

**Resultado Esperado**:
✅ Grupo aparece na lista
✅ Badge "Admin" visível
✅ Pode acessar todas as funcionalidades

---

### 📱 Teste 3: Entrar com Código de Convite

**Pré-requisito**: Ter um código de convite de outro usuário

**Passos**:
1. Em `NoGroupsScreen`, clicar "Entrar com Código"
2. Modal abre
3. Digitar código (ex: `ABC123`)
4. Clicar "Entrar no Grupo"
5. **Esperar**: Toast de sucesso
6. Navega para `HomeScreen`
7. Ver grupo na aba "Participo"

**Resultado Esperado**:
✅ Entrada no grupo bem-sucedida
✅ Grupo aparece em "Participo"
✅ Sem badge de admin

---

### 📱 Teste 4: ProfileSwitcher no Header

**Objetivo**: Trocar entre perfis

**Passos**:
1. Em `HomeScreen`, ver botão no header: `[👥 Acompanhante]`
2. Clicar no botão
3. Modal abre com 2 opções:
   - 👥 Acompanhante
   - 👤 Paciente
4. Selecionar "Paciente"
5. **Esperar**: Alert "Modo Paciente" (em desenvolvimento)
6. Botão muda para `[👤 Paciente]`

**Resultado Esperado**:
✅ Modal abre corretamente
✅ Seleção é salva
✅ Botão atualiza visualmente

---

### 📱 Teste 5: Usuário com Grupos Existentes

**Objetivo**: Verificar carregamento da API

**Passos**:
1. Fazer logout
2. Fazer login com conta que tem grupos
3. **Esperar**: Loading spinner "Carregando grupos..."
4. Grupos carregados da API
5. Ver tabs "Meus Grupos" e "Participo"
6. Alternar entre tabs
7. Ver grupos corretos em cada tab

**Resultado Esperado**:
✅ Loading aparece brevemente
✅ Grupos carregados da API
✅ Filtros corretos (admin vs não-admin)
✅ Tabs funcionando

---

### 📱 Teste 6: Gerenciar Própria Saúde

**Objetivo**: Ser acompanhante E paciente simultaneamente

**Passos**:
1. Criar grupo para si mesmo
2. É automaticamente admin
3. Usar ProfileSwitcher:
   - Ver como Acompanhante: Gerenciar tudo
   - Ver como Paciente: Interface simplificada (futuro)
4. Alternar entre perfis várias vezes

**Resultado Esperado**:
✅ Mesmo grupo, diferentes visualizações
✅ Dados persistem entre trocas
✅ Sem erros de navegação

---

## 🐛 Problemas Conhecidos / Em Desenvolvimento

### ⏳ **Navegação para Paciente**
- ProfileSwitcher → "Paciente" mostra Alert
- TODO: Implementar navegação para `PatientNavigator`

### ⏳ **Múltiplos Papéis no Frontend**
- Backend suporta múltiplos papéis
- Frontend ainda não mostra todos os papéis do usuário
- TODO: Endpoint para `getUserRoles()` no frontend

### ⏳ **Promover/Gerenciar Papéis**
- Backend tem endpoints prontos
- Frontend não tem UI para promover outros usuários
- TODO: Tela de gerenciamento de membros

---

## 🔧 Debug e Logs

### Ver Grupos Carregados
```javascript
// Em HomeScreen.js, adicionar console.log:
console.log('Grupos carregados:', result.data);
console.log('Meus grupos:', myCreatedGroups);
console.log('Participo:', joinedGroups);
```

### Ver Perfil Atual
```javascript
// Em HomeScreen.js:
console.log('Perfil atual:', currentProfile);
```

### Ver Papel no Grupo (Backend)
```bash
# No servidor
mysql lacos -e "SELECT * FROM group_members WHERE user_id = 1;"
```

---

## 📊 Endpoints para Testar (Postman/Insomnia)

### 1. Obter Papéis do Usuário
```
GET /api/groups/1/user/roles
Headers: Authorization: Bearer {token}

Resposta:
{
  "roles": ["admin", "caregiver"],
  "is_admin": true,
  "is_caregiver": true,
  "is_patient": false
}
```

### 2. Adicionar Papel
```
POST /api/groups/1/members/2/roles
Headers: Authorization: Bearer {token}
Body:
{
  "role": "patient",
  "action": "add"
}

Resposta:
{
  "message": "Papel adicionado com sucesso",
  "role": "patient"
}
```

### 3. Remover Papel
```
POST /api/groups/1/members/2/roles
Headers: Authorization: Bearer {token}
Body:
{
  "role": "patient",
  "action": "remove"
}

Resposta:
{
  "message": "Papel removido com sucesso",
  "role": "patient"
}
```

---

## 🎯 Checklist de Teste

### Backend
- [x] Tabela `group_members` com `role`
- [x] Índice `unique_member_role`
- [x] Endpoint `getUserRoles` funciona
- [x] Endpoint `manageUserRole` funciona
- [ ] Testar múltiplos papéis no Postman

### Frontend
- [x] WelcomeScreen aparece como inicial
- [x] NoGroupsScreen detecta zero grupos
- [x] ProfileSwitcher no header
- [x] HomeScreen carrega da API
- [ ] Testar em dispositivo real
- [ ] Testar com múltiplos grupos
- [ ] Testar entrada via código

### Fluxos Completos
- [ ] Novo usuário → Criar grupo → Ver grupo
- [ ] Novo usuário → Entrar com código → Ver grupo
- [ ] Trocar perfil → Dados persistem
- [ ] Logout → Login → Grupos carregam

---

## 🚀 Como Testar Agora

### 1. **Iniciar App**
```bash
cd /home/darley/lacos
npx expo start --clear
```

### 2. **Criar Conta de Teste**
- Usar email novo
- Criar conta
- Esperar NoGroupsScreen

### 3. **Criar Grupo de Teste**
- "Criar Novo Grupo"
- Preencher dados
- Salvar

### 4. **Testar ProfileSwitcher**
- Clicar no botão no header
- Alternar entre perfis

---

## 📝 Relatório de Bugs

Se encontrar algum problema, anote:

**Bug**: [Descrição curta]
**Passos para reproduzir**:
1. [Passo 1]
2. [Passo 2]

**Resultado esperado**: [O que deveria acontecer]
**Resultado atual**: [O que aconteceu]
**Logs**: [Console logs, se houver]

---

## 🎉 Próximas Implementações

1. **Interface do Paciente**
   - Tela simplificada
   - Apenas compromissos e medicamentos
   - Sem gerenciamento

2. **Gerenciamento de Membros**
   - Lista de membros do grupo
   - Promover/rebaixar papéis
   - Remover membros

3. **Múltiplos Papéis na UI**
   - Mostrar todos os papéis do usuário
   - Badges múltiplos
   - Seletor de papel ativo

4. **Permissões por Papel**
   - Admin: Tudo
   - Caregiver: Ver e gerenciar cuidados
   - Patient: Apenas visualização

---

**Bom teste!** 🚀

Se encontrar problemas, documente e vamos corrigir juntos! 😊

