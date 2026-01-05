# 📋 Resumo das Mudanças - Novo Fluxo de Autenticação

## ✅ O Que Foi Feito (Frontend)

### 1. **Nova Tela Inicial** 
- `src/screens/Auth/WelcomeScreen.js`
- Tela simples com 2 botões: "Criar Conta" e "Já tenho conta"
- **Não força** escolha de perfil antes de criar conta

### 2. **Tela Sem Grupos**
- `src/screens/Groups/NoGroupsScreen.js`
- Aparece quando usuário não tem nenhum grupo
- Opções:
  - 🆕 **Criar Novo Grupo** → Vira administrador
  - 🔑 **Entrar com Código** → Modal para inserir código de convite

### 3. **Troca de Perfil**
- `src/components/ProfileSwitcher.js`
- Botão no header para alternar entre:
  - 👥 **Acompanhante**: Gerenciar grupos e cuidados
  - 👤 **Paciente**: Interface simplificada

### 4. **Sistema de Convites**
- `groupService.joinWithCode(code)` adicionado
- Permite entrar em grupos usando código

### 5. **Documentação**
- `NOVO_FLUXO_AUTH.md`: Explicação completa do novo sistema

---

## ⏳ O Que Falta Fazer

### Backend (Urgente)

1. **Executar script no servidor**:
```bash
cd /var/www/lacos-backend
chmod +x SCRIPT_MULTIPLOS_PAPEIS.sh
./SCRIPT_MULTIPLOS_PAPEIS.sh
```

Este script:
- ✅ Ajusta tabela `group_members` para permitir múltiplos papéis
- ✅ Adiciona coluna `role` (admin, caregiver, patient)
- ✅ Cria novos endpoints
- ✅ Atualiza `GroupController`

### Frontend (Próximos passos)

2. **Atualizar Navegação**:
   - Ajustar `src/navigation/AppNavigator.js`
   - Usar `WelcomeScreen` como inicial
   - Detectar quando usuário não tem grupos

3. **Integrar ProfileSwitcher**:
   - Adicionar no header de `HomeScreen`
   - Salvar escolha do usuário (AsyncStorage)

4. **Ajustar HomeScreen**:
   - Detectar `groups.length === 0`
   - Mostrar `NoGroupsScreen` automaticamente

5. **AuthContext**:
   - Remover lógica de "forçar perfil"
   - Permitir login sem escolher perfil

---

## 🎯 Novo Fluxo Completo

### Antes (Errado)
```
ProfileSelectionScreen → Escolher perfil → Login → HomeScreen
```

### Depois (Correto)
```
WelcomeScreen → Login/Register → HomeScreen
                                    ↓
                        Tem grupos? Não → NoGroupsScreen
                                    ↓
                                  Sim → HomeScreen com grupos
```

---

## 🔑 Conceitos Principais

### 1. **Perfis São Por Grupo**

Cada usuário tem um papel em cada grupo:

| Grupo | Papel |
|-------|-------|
| Família Silva | Admin |
| Vó Maria | Acompanhante |
| Meu Grupo | Paciente + Acompanhante |

### 2. **Múltiplos Papéis Simultâneos**

Um usuário pode ser **Acompanhante E Paciente** ao mesmo tempo no mesmo grupo (gerenciar sua própria saúde).

### 3. **Códigos de Convite**

- Cada grupo tem um **código único**
- Admin compartilha código com outras pessoas
- Pessoas entram no app e usam "Entrar com Código"
- Recebem papel definido pelo admin

### 4. **Troca Fácil de Perfil**

- `ProfileSwitcher` no header
- Alterna entre **ver como acompanhante** ou **ver como paciente**
- Não afeta os dados, apenas a visualização

---

## 📱 Telas Criadas

### 1. WelcomeScreen

```
┌──────────────────────────────┐
│         LAÇOS 💙             │
│ Cuidado e conexão para quem  │
│        você ama              │
│                              │
│          ❤️                  │
│                              │
│  ┌────────────────────────┐  │
│  │    Criar Conta        ➜│  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │   Já tenho conta       │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### 2. NoGroupsScreen

```
┌──────────────────────────────┐
│      Bem-vindo ao Laços!     │
│                              │
│  Você ainda não faz parte    │
│  de nenhum grupo            │
│                              │
│  ┌────────────────────────┐  │
│  │ ➕ Criar Novo Grupo    │  │
│  │                        │  │
│  │ Crie um grupo para     │  │
│  │ gerenciar cuidados     │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🔑 Entrar com Código   │  │
│  │                        │  │
│  │ Use código de convite  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### 3. ProfileSwitcher (Header)

```
┌──────────────────────────────┐
│  Laços      [👥 Acompanhante]│ ← Clica aqui
│              ⇄               │
└──────────────────────────────┘

        ↓ Abre modal

┌──────────────────────────────┐
│  Trocar Perfil          ✕    │
│  Olá, João                   │
├──────────────────────────────┤
│                              │
│  ┌──────────────────────────┐│
│  │ 👥 Acompanhante      ✓  ││
│  │ Gerenciar grupos        ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ 👤 Paciente             ││
│  │ Ver meus compromissos   ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

---

## 🚀 Como Testar

### 1. **Novo Usuário (Zero Grupos)**

1. Abrir app → `WelcomeScreen`
2. Criar conta → `RegisterScreen`
3. Login automático → `NoGroupsScreen`
4. Escolher:
   - Criar grupo → Vira admin
   - Entrar com código → Recebe papel

### 2. **Códigos de Convite**

1. Admin cria grupo no app
2. Backend gera código (ex: `ABC123XYZ`)
3. Admin envia código para outras pessoas
4. Pessoas abrem app → "Entrar com Código"
5. Digitam código → Entram no grupo

### 3. **Múltiplos Papéis**

1. Criar grupo para si mesmo
2. É admin E paciente simultaneamente
3. Clicar `ProfileSwitcher` no header
4. Alternar entre visualizações

---

## 🔧 Comandos para Aplicar no Servidor

```bash
# 1. Ir para pasta do backend
cd /var/www/lacos-backend

# 2. Fazer backup do banco
mysqldump -u root -p lacos > backup_antes_multiplos_papeis_$(date +%Y%m%d).sql

# 3. Copiar script
# (Use scp ou cat > para criar o arquivo SCRIPT_MULTIPLOS_PAPEIS.sh)

# 4. Dar permissão de execução
chmod +x SCRIPT_MULTIPLOS_PAPEIS.sh

# 5. Executar
./SCRIPT_MULTIPLOS_PAPEIS.sh

# 6. Verificar se funcionou
php artisan route:list | grep roles
```

---

## 📋 Checklist Completo

### Frontend ✅

- [x] `WelcomeScreen.js` criado
- [x] `NoGroupsScreen.js` criado
- [x] `ProfileSwitcher.js` criado
- [x] `groupService.joinWithCode()` adicionado
- [x] Documentação criada
- [ ] Atualizar `AppNavigator.js`
- [ ] Integrar `ProfileSwitcher` no header
- [ ] Ajustar `HomeScreen.js`
- [ ] Ajustar `AuthContext.js`

### Backend ⏳

- [ ] Executar `SCRIPT_MULTIPLOS_PAPEIS.sh` no servidor
- [ ] Testar endpoints de papéis
- [ ] Verificar códigos de convite

---

## 💡 Vantagens do Novo Sistema

✅ **Mais Flexível**: Usuário pode ter vários papéis  
✅ **Mais Intuitivo**: Login primeiro, grupos depois  
✅ **Mais Realista**: Pessoa pode gerenciar sua própria saúde  
✅ **Mais Seguro**: Permissões por papel em cada grupo  
✅ **Mais Fácil**: Troca de visualização com 1 clique  

---

## 📞 Próximos Passos

1. ✅ **Revisar este documento**
2. ⏳ **Executar script no servidor** (backend)
3. ⏳ **Atualizar navegação** (frontend)
4. ⏳ **Testar fluxos completos**
5. ⏳ **Ajustar UI conforme necessário**

---

**Qualquer dúvida, consulte `NOVO_FLUXO_AUTH.md` para detalhes técnicos completos.** 🚀

