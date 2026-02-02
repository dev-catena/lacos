# 🎯 NAVEGAÇÃO POR PERFIL - LAÇOS

## 📋 **VISÃO GERAL**

O App Laços agora possui **dois fluxos de navegação** baseados no perfil do usuário:

```
Login/Registro
      │
      ├─── CUIDADOR ──→ HomeScreen (gestão completa de grupos)
      │                 ├─ Início (abas: Meus Grupos, Participo)
      │                 ├─ Grupos
      │                 ├─ Notificações
      │                 └─ Perfil
      │
      └─── PACIENTE ──→ PatientHomeScreen (interface simples)
                        └─ 4 Cards principais:
                           1. Botão de Pânico
                           2. Contatos de Emergência
                           3. Meus Medicamentos
                           4. Minhas Consultas
```

---

## 🔑 **DETECÇÃO DE PERFIL**

### No `AppNavigator.js`:

```javascript
const { user } = useAuth();

// Detecta se o usuário é PACIENTE
const isPatient = user?.profile === 'accompanied' || user?.role === 'accompanied';

// Redireciona para navegação apropriada
return isPatient ? <PatientNavigator /> : <CaregiverNavigator />;
```

### Campos Verificados:
- `user.profile` (ex: `'accompanied'`, `'caregiver'`)
- `user.role` (ex: `'accompanied'`, `'caregiver'`)

---

## 👤 **PERFIL: CUIDADOR**

### Navegação Completa (Bottom Tabs):
```
┌─────────────────────────────────────────┐
│  🏠 Início                              │
│  ├─ Abas: Meus Grupos | Participo      │
│  ├─ Últimas Atualizações               │
│  └─ Lista de Grupos                    │
│                                         │
│  👥 Grupos                              │
│  ├─ Gestão de Grupos                   │
│  ├─ Criar Novo Grupo                   │
│  └─ Entrar com Código                  │
│                                         │
│  🔔 Notificações                        │
│  └─ Alertas e Eventos                  │
│                                         │
│  👤 Perfil                              │
│  └─ Configurações                      │
└─────────────────────────────────────────┘
```

### Dentro de um Grupo (Cuidador):
```
┌─────────────────────────────────────────┐
│  📝 Histórico                           │
│  📂 Arquivos                            │
│  💊 Remédios                            │
│  📅 Agenda                              │
│  ⚕️  Médicos                            │
│  ❤️  Sinais Vitais                      │
│  ⚙️  Configurações                      │
└─────────────────────────────────────────┘
```

---

## 🧑‍🦽 **PERFIL: PACIENTE (Acompanhado)**

### Interface Simplificada (sem Bottom Tabs):
```
┌─────────────────────────────────────────┐
│  Olá, [Nome do Paciente]!              │
│  Como você está hoje?                   │
│                                         │
│  ⏰ ALERTAS PENDENTES                   │
│  ├─ Hora do remédio - Losartana 14:00 │
│  └─ Consulta agendada - Amanhã 10:00  │
│                                         │
│  📱 MENU PRINCIPAL                      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🚨 BOTÃO DE PÂNICO               │ │
│  │    Acionar em emergência         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 📞 CONTATOS DE EMERGÊNCIA        │ │
│  │    Ver meus contatos             │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 💊 MEUS MEDICAMENTOS             │ │
│  │    Ver lista de remédios         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 📅 MINHAS CONSULTAS              │ │
│  │    Próximas consultas            │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Características:
- ✅ **Interface simples e direta**
- ✅ **Cards grandes e fáceis de tocar**
- ✅ **Foco em alertas e emergências**
- ✅ **Sem gestão de grupos (apenas visualização)**
- ✅ **Pull-to-refresh para atualizar**

---

## 🔧 **ARQUIVOS CRIADOS/MODIFICADOS**

### Novos Arquivos:
1. `src/screens/Patient/PatientHomeScreen.js` ✅
2. `NAVEGACAO_POR_PERFIL.md` (este arquivo) ✅

### Arquivos Modificados:
1. `src/navigation/AppNavigator.js` ✅
   - Importa `useAuth`
   - Importa `PatientHomeScreen`
   - Cria `PatientStack`
   - Cria `PatientNavigator`
   - Renomeia `AppNavigator` para `CaregiverNavigator`
   - Novo `AppNavigator` detecta perfil e redireciona

---

## ⚙️ **BACKEND: CAMPO DE PERFIL**

### O Backend Precisa Retornar:

No endpoint `/api/user` ou `/api/login`, o objeto `user` deve conter:

```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@example.com",
  "profile": "accompanied",  // ← IMPORTANTE!
  "role": "accompanied",      // ou este campo
  // ... outros campos
}
```

### Valores Possíveis:
- `"caregiver"` → Navegação completa (cuidador)
- `"accompanied"` → Navegação simples (paciente)
- `"patient"` → Navegação simples (paciente)

### ⚠️ **ATENÇÃO:**
Se o backend **NÃO** retornar este campo, o app assumirá que o usuário é **CUIDADOR** por padrão.

---

## 🧪 **COMO TESTAR**

### 1. Criar Conta de CUIDADOR:
```bash
# Registrar com perfil de cuidador
# O app deve mostrar a HomeScreen completa com abas
```

### 2. Criar Conta de PACIENTE:
```bash
# Registrar com perfil de paciente/acompanhado
# O app deve mostrar a PatientHomeScreen simples
```

### 3. Verificar Logs:
```javascript
// No console, aparecerá:
👤 AppNavigator - User: João | Profile: accompanied | Role: accompanied | Is Patient: true
👤 AppNavigator - User: Maria | Profile: caregiver | Role: caregiver | Is Patient: false
```

---

## 🚀 **PRÓXIMOS PASSOS**

### Backend (PENDENTE):
1. ✅ Adicionar campo `profile` ou `role` na tabela `users`
2. ✅ Retornar este campo nos endpoints `/login` e `/user`
3. ✅ Permitir definir o perfil no registro

### Frontend (PENDENTE):
1. ⚠️ Implementar telas específicas do paciente:
   - `PanicButton` (botão de pânico)
   - `EmergencyContacts` (contatos)
   - `MyMedications` (medicamentos do paciente)
   - `MyAppointments` (consultas do paciente)
2. ⚠️ Conectar alertas reais (medicamentos, consultas)
3. ⚠️ Testar fluxo completo CUIDADOR vs PACIENTE

---

## 📝 **NOTAS TÉCNICAS**

### Por que não usar Bottom Tabs para Paciente?
- Interface mais simples e direta
- Menos confusão para idosos/pacientes
- Foco em funcionalidades essenciais
- Navegação via Stack (telas empilhadas)

### Como Alternar entre Perfis?
- Atualmente, o perfil é definido no **registro**
- TODO: Permitir que cuidadores **alternem** entre perfis se tiverem múltiplos papéis no mesmo grupo

---

## 🎨 **DESIGN SYSTEM**

### Cores dos Cards (PatientHomeScreen):
```javascript
Botão de Pânico:        colors.danger   (#EF4444)
Contatos:              colors.primary  (#2563EB)
Medicamentos:          colors.secondary (#10B981)
Consultas:             colors.info     (#8B5CF6)
```

### Tamanhos:
- Cards: `padding: 16px, borderRadius: 12px`
- Ícones: `56x56px`
- Fonte Título: `16px, weight: 600`
- Fonte Subtítulo: `14px, weight: 400`

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO**

### Frontend:
- [x] Criar `PatientHomeScreen.js`
- [x] Modificar `AppNavigator.js`
- [x] Adicionar detecção de perfil
- [x] Criar `PatientStack`
- [x] Criar `PatientNavigator`
- [ ] Implementar telas secundárias do paciente
- [ ] Conectar alertas reais
- [ ] Testar em dispositivo real

### Backend:
- [ ] Adicionar campo `profile` na tabela `users`
- [ ] Atualizar `AuthController::register()`
- [ ] Atualizar `AuthController::login()`
- [ ] Retornar `profile` no endpoint `/user`
- [ ] Testar com Postman/cURL

---

## 🐛 **TROUBLESHOOTING**

### Problema: App sempre mostra navegação de CUIDADOR
**Solução:** Verificar se o backend está retornando o campo `profile` ou `role`.

```bash
# No servidor:
curl http://localhost/api/user -H "Authorization: Bearer SEU_TOKEN"
# Deve retornar: {"id": 1, "name": "...", "profile": "accompanied", ...}
```

### Problema: Erro "useAuth must be used within AuthProvider"
**Solução:** Verificar se o `AuthProvider` está envolvendo o `AppNavigator` no `App.js`.

### Problema: Tela branca após login
**Solução:** Verificar logs do console para ver qual navegação está sendo renderizada.

```javascript
console.log('👤 Is Patient:', isPatient);
```

---

## 📚 **REFERÊNCIAS**

- [React Navigation - Auth Flow](https://reactnavigation.org/docs/auth-flow/)
- [React Navigation - Stack Navigator](https://reactnavigation.org/docs/stack-navigator/)
- [React Navigation - Tab Navigator](https://reactnavigation.org/docs/bottom-tab-navigator/)

---

**Data de Criação:** 25/11/2025  
**Versão:** 1.0  
**Status:** ✅ Implementado (Frontend) | ⚠️ Pendente (Backend)

