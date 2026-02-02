# 🔄 Novo Fluxo de Autenticação e Perfis

## 📋 Problema Anterior

O fluxo antigo forçava a escolha de perfil **ANTES** do login/registro, o que não fazia sentido:

```
ProfileSelectionScreen → Escolher "Acompanhante" ou "Paciente" → Login/Registro
```

**Problemas**:
- ❌ Usuário escolhia perfil antes de ter conta
- ❌ Não permitia múltiplos perfis simultaneamente
- ❌ Não considerava que usuário pode não ter grupos
- ❌ Perfil era "global" ao invés de "por grupo"

---

## ✅ Novo Fluxo Correto

### 1. **Autenticação Primeiro**

```
WelcomeScreen → Login ou Criar Conta → Autenticado
```

**Telas**:
- `WelcomeScreen.js`: Tela inicial com opções "Criar Conta" ou "Já tenho conta"
- `RegisterScreen.js`: Cria conta (sem escolher perfil)
- `LoginScreen.js`: Faz login (sem escolher perfil)

### 2. **Verificar Grupos**

Após login, o sistema verifica:

```javascript
const { groups } = await groupService.getMyGroups();

if (groups.length === 0) {
  // Mostrar NoGroupsScreen
} else {
  // Mostrar HomeScreen com grupos
}
```

### 3. **Sem Grupos → NoGroupsScreen**

**Opções**:
1. **Criar Novo Grupo** → Torna-se administrador
2. **Entrar com Código** → Recebe papel definido pelo admin

### 4. **Com Grupos → HomeScreen**

**Tabs**:
- **Meus Grupos**: Grupos que criei (sou admin)
- **Participo**: Grupos que entrei via convite

### 5. **Perfis Dentro dos Grupos**

Cada usuário tem um papel em cada grupo:

| Papel | Permissões |
|-------|-----------|
| **Admin** | Criar/editar/deletar grupo, promover outros admins, convidar membros |
| **Acompanhante** | Ver e gerenciar cuidados (medicamentos, consultas, agenda) |
| **Paciente** | Ver seus próprios compromissos e medicamentos (interface simplificada) |

**Importante**: Um usuário pode ser **Acompanhante E Paciente** ao mesmo tempo (gerenciar sua própria saúde).

---

## 🔧 Componentes Criados

### 1. `WelcomeScreen.js`
Tela inicial do app.

**Ações**:
- Criar Conta → `RegisterScreen`
- Já tenho conta → `LoginScreen`

### 2. `NoGroupsScreen.js`
Aparece quando usuário não tem grupos.

**Ações**:
- Criar Novo Grupo → `CreateGroupScreen`
- Entrar com Código → Modal para inserir código

### 3. `ProfileSwitcher.js`
Componente para trocar entre visualizações.

**Perfis**:
- 👥 **Acompanhante**: Ver e gerenciar todos os grupos
- 👤 **Paciente**: Ver minha interface simplificada

**Uso**:
```jsx
<ProfileSwitcher
  currentProfile={currentProfile} // 'caregiver' ou 'patient'
  onProfileChange={(newProfile) => setCurrentProfile(newProfile)}
/>
```

---

## 🔐 Sistema de Códigos de Convite

### Backend

**Tabela `groups`**:
- `code` (string, unique): Código de convite gerado automaticamente

**Endpoint**:
```
POST /api/groups/join
Body: { "code": "ABC123XYZ" }
```

**Fluxo**:
1. Admin cria grupo → Backend gera código único
2. Admin compartilha código com outras pessoas
3. Pessoas entram no app → "Entrar com Código"
4. Backend adiciona usuário ao grupo com papel definido

### Frontend

**Método no `groupService.js`**:
```javascript
async joinWithCode(code) {
  const response = await apiService.post('/groups/join', { code });
  return { success: true, data: response };
}
```

---

## 👥 Múltiplos Papéis Simultaneamente

Um usuário pode ser:
- ✅ Admin em um grupo
- ✅ Acompanhante em outro grupo
- ✅ Paciente em outro grupo
- ✅ **Acompanhante E Paciente no mesmo grupo** (gerenciar sua própria saúde)

### Tabela `group_members`

```sql
CREATE TABLE group_members (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('admin', 'caregiver', 'patient') NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member (group_id, user_id, role) -- Permite múltiplos papéis
);
```

**Exemplo**:
```javascript
// Usuário ID 1 no Grupo ID 5
group_members:
- { group_id: 5, user_id: 1, role: 'admin', is_admin: true }
- { group_id: 5, user_id: 1, role: 'caregiver', is_admin: false }
- { group_id: 5, user_id: 1, role: 'patient', is_admin: false }
```

---

## 🚀 Implementação no Backend

### 1. **Migration: Ajustar `group_members`**

```bash
php artisan make:migration update_group_members_for_multiple_roles
```

```php
public function up()
{
    Schema::table('group_members', function (Blueprint $table) {
        // Remove unique constraint antigo
        $table->dropUnique('group_members_group_id_user_id_unique');
        
        // Adiciona nova constraint permitindo múltiplos papéis
        $table->unique(['group_id', 'user_id', 'role'], 'unique_member_role');
    });
}
```

### 2. **Controller: Verificar múltiplos papéis**

```php
// Em GroupMemberController ou GroupController

public function getUserRoles(Request $request, $groupId)
{
    $userId = $request->user()->id;
    
    $roles = GroupMember::where('group_id', $groupId)
        ->where('user_id', $userId)
        ->pluck('role')
        ->toArray();
    
    return response()->json([
        'roles' => $roles,
        'is_admin' => in_array('admin', $roles),
        'is_caregiver' => in_array('caregiver', $roles),
        'is_patient' => in_array('patient', $roles),
    ]);
}
```

### 3. **Endpoint para promover/adicionar papel**

```php
POST /api/groups/{groupId}/members/{userId}/roles
Body: {
  "role": "admin" | "caregiver" | "patient",
  "action": "add" | "remove"
}
```

---

## 📱 Navegação Atualizada

### AuthNavigator (Antes do Login)

```
Stack.Navigator:
  - WelcomeScreen (initial)
  - LoginScreen
  - RegisterScreen
  - PatientLogin (mantido para compatibilidade)
```

### AppNavigator (Após Login)

```
Tab.Navigator:
  - HomeStack:
      - HomeScreen (verifica se tem grupos)
      - NoGroupsScreen (se não tiver grupos)
      - GroupDetailScreen
      - CreateGroupScreen
      - ...
  - GroupsStack
  - NotificationsStack
  - ProfileStack
```

### PatientNavigator (Interface Simplificada)

Mantido para quando usuário escolhe "Ver como Paciente" no `ProfileSwitcher`.

---

## 🎯 Fluxo Completo de Uso

### Cenário 1: Novo Usuário (Zero Grupos)

```
1. Abre app → WelcomeScreen
2. "Criar Conta" → RegisterScreen → Cria conta
3. Login automático → NoGroupsScreen
4. Opções:
   a) "Criar Novo Grupo" → Vira admin
   b) "Entrar com Código" → Recebe papel do admin
```

### Cenário 2: Usuário com Grupos

```
1. Abre app → WelcomeScreen
2. "Já tenho conta" → LoginScreen → Faz login
3. HomeScreen com tabs:
   - Meus Grupos (criei)
   - Participo (entrei via código)
4. Clica em grupo → GroupDetailScreen
5. ProfileSwitcher no header para trocar visualização
```

### Cenário 3: Gerenciar Própria Saúde

```
1. Usuário cria grupo para si mesmo
2. É admin E paciente simultaneamente
3. Alterna entre perfis:
   - Acompanhante: Gerencia tudo
   - Paciente: Interface simplificada
```

---

## 🔧 Checklist de Implementação

### Frontend ✅

- [x] `WelcomeScreen.js` criado
- [x] `NoGroupsScreen.js` criado
- [x] `ProfileSwitcher.js` criado
- [x] `groupService.joinWithCode()` adicionado
- [ ] Atualizar `AppNavigator.js` com novo fluxo
- [ ] Integrar `ProfileSwitcher` no header
- [ ] Ajustar `HomeScreen.js` para detectar zero grupos
- [ ] Ajustar `AuthContext.js` para não forçar perfil

### Backend ⏳

- [ ] Migration: Ajustar `group_members` para múltiplos papéis
- [ ] Endpoint: `POST /api/groups/join` (verificar se existe)
- [ ] Endpoint: `GET /api/groups/{id}/members/{userId}/roles`
- [ ] Endpoint: `POST /api/groups/{id}/members/{userId}/roles` (add/remove)
- [ ] Lógica: Validar que admin pode promover outros
- [ ] Lógica: Verificar permissões por papel

---

## 📝 Próximos Passos

1. ✅ **Documentar novo fluxo** (este arquivo)
2. ⏳ **Implementar backend** (migrations + endpoints)
3. ⏳ **Atualizar navegação** (AppNavigator + AuthContext)
4. ⏳ **Testar fluxos** (zero grupos, com grupos, múltiplos papéis)
5. ⏳ **Atualizar UI** (adicionar ProfileSwitcher no header)

---

## 🎨 UI/UX Melhorias

### HomeScreen com Zero Grupos

```
┌──────────────────────────────┐
│  Laços      👤 [Acompanhante]│
├──────────────────────────────┤
│                              │
│        👥                    │
│   Bem-vindo ao Laços!        │
│                              │
│ Você ainda não faz parte de  │
│ nenhum grupo de cuidados.    │
│                              │
│  ┌────────────────────────┐  │
│  │  ➕ Criar Novo Grupo   │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  🔑 Entrar com Código  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### HomeScreen com Grupos

```
┌──────────────────────────────┐
│  Laços      👤 [Acompanhante]│ ← ProfileSwitcher
├──────────────────────────────┤
│  [Meus Grupos] [Participo]   │ ← Tabs
├──────────────────────────────┤
│  📷 Grupo Família Silva      │
│      Admin • 5 membros       │
├──────────────────────────────┤
│  📷 Cuidados Vó Maria        │
│      Acompanhante • 3 membros│
└──────────────────────────────┘
```

---

**Este documento será atualizado conforme a implementação avança.** 🚀

