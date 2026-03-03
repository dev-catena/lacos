# 🧪 Guia de Teste: Gerenciamento de Membros

## 📋 Funcionalidades Implementadas

### ✅ Frontend (já no ar)
- Tela de Gerenciamento de Membros
- Restrição de acesso (só admin)
- Promover/Rebaixar membros
- Trocar paciente
- Remover membros
- Logs de atividade na Home

### ✅ Backend (acabou de subir)
- `PUT /groups/{groupId}/members/{memberId}/role`
- `DELETE /groups/{groupId}/members/{memberId}`
- Logs automáticos no `group_activities`

---

## 🎯 CENÁRIO 1: Acesso Restrito às Configurações

### Objetivo
Verificar que apenas admins podem acessar as Configurações do grupo.

### Passos

#### Como CUIDADOR (não-admin):
1. **Login** com um usuário cuidador (não-admin)
2. Entre em um **Grupo** (Home → Meus Grupos → Selecione o grupo)
3. Tente clicar no card **"Configurações"**
4. **Resultado Esperado:**
   - ❌ Alert: "Acesso Negado"
   - Mensagem: "Apenas administradores podem acessar as configurações do grupo."
   - Botão "OK" volta para tela anterior automaticamente

#### Como ADMIN:
1. **Login** com o usuário que criou o grupo (admin)
2. Entre no **mesmo Grupo**
3. Clique no card **"Configurações"**
4. **Resultado Esperado:**
   - ✅ Tela de Configurações abre normalmente
   - Vê todas as seções (Informações Básicas, Membros do Grupo, etc.)

---

## 🎯 CENÁRIO 2: Ver Lista de Membros

### Objetivo
Verificar que a lista de membros está correta e atualizada.

### Passos
1. **Como ADMIN**, entre em **Configurações** do grupo
2. Na seção **"Membros do Grupo"**, veja a lista de membros
3. Clique no botão **"Gerenciar Membros"**
4. **Resultado Esperado:**
   - ✅ Abre tela "Membros do Grupo"
   - Header mostra nome do grupo
   - Badge com quantidade de membros no canto direito
   - **Card do Admin** com:
     - Badge azul "Administrador" 🛡️
     - Nome do usuário
     - Email
     - Data de entrada
   - **Card do Paciente** com:
     - Destaque visual (borda rosa)
     - Badge rosa "Paciente" 💊
     - Nome, email, data de entrada
   - **Cards de Cuidadores** com:
     - Badge azul claro "Cuidador" 💙
     - Nome, email, data de entrada
   - **Seu próprio card** deve ter borda azul e texto "(Você)"

---

## 🎯 CENÁRIO 3: Promover Cuidador para Admin

### Objetivo
Promover um cuidador para administrador do grupo.

### Passos
1. **Na tela de Gerenciar Membros**, localize um **cuidador**
2. Clique no botão **"⬆️ Promover"** (verde)
3. **Confirme** no Alert:
   - Título: "Promover para Administrador"
   - Mensagem: "Deseja promover [Nome] para administrador?"
   - Texto: "Ele terá acesso total às configurações do grupo."
4. Clique em **"Promover"**
5. **Resultado Esperado:**
   - ✅ Toast verde: "[Nome] agora é administrador"
   - Lista de membros recarrega
   - Card do membro agora tem badge **"Administrador"** 🛡️
   - Botão "Promover" some, aparece botão **"⬇️ Rebaixar"** (amarelo)
6. **Volte para Home** e veja **"Últimas Atualizações"**
   - ✅ Nova atividade: "[Nome] foi promovido a administrador"
   - Ícone: escudo
   - Cor: azul primário

---

## 🎯 CENÁRIO 4: Rebaixar Admin para Cuidador

### Objetivo
Rebaixar um administrador de volta para cuidador.

### Passos
1. **Na tela de Gerenciar Membros**, localize um **admin** (que não seja você)
2. Clique no botão **"⬇️ Rebaixar"** (amarelo)
3. **Confirme** no Alert:
   - Título: "Remover Administrador"
   - Mensagem: "Deseja rebaixar [Nome] para cuidador?"
   - Texto: "Ele perderá acesso às configurações do grupo."
4. Clique em **"Rebaixar"**
5. **Resultado Esperado:**
   - ✅ Toast verde: "[Nome] agora é cuidador"
   - Card do membro agora tem badge **"Cuidador"** 💙
   - Botão "Rebaixar" some, aparece botão **"⬆️ Promover"** (verde)

---

## 🎯 CENÁRIO 5: Trocar Paciente do Grupo

### Objetivo
Alterar quem é o paciente oficial do grupo.

### Passos
1. **Na tela de Gerenciar Membros**, localize um **cuidador**
2. Clique no botão **"🔄 Tornar Paciente"** (azul claro)
3. **Confirme** no Alert:
   - Título: "Trocar Paciente"
   - Mensagem: "Deseja tornar [Nome] o paciente do grupo?"
   - Texto: "[Nome do paciente atual] voltará a ser cuidador."
4. Clique em **"Confirmar"**
5. **Resultado Esperado:**
   - ✅ Toast verde: "[Nome] agora é o paciente"
   - Lista recarrega
   - **Card do novo paciente:**
     - Badge rosa "Paciente" 💊
     - Borda rosa destacada
     - **SEM** botão "Tornar Paciente"
   - **Card do ex-paciente:**
     - Badge azul "Cuidador" 💙
     - Borda normal
     - Aparece botão "Tornar Paciente"
6. **Volte para Home** → **"Últimas Atualizações"**
   - ✅ Nova atividade: "[Nome] agora é o paciente do grupo"
   - Ícone: coração
   - Cor: rosa secundário

---

## 🎯 CENÁRIO 6: Remover Membro do Grupo

### Objetivo
Expulsar um membro do grupo.

### Passos
1. **Na tela de Gerenciar Membros**, localize um **cuidador ou admin** (não você)
2. Clique no botão **"🗑️ Remover"** (vermelho)
3. **Confirme** no Alert:
   - Título: "Remover Membro"
   - Mensagem: "Deseja remover [Nome] do grupo?"
   - Texto: "Esta ação não pode ser desfeita."
   - Botão vermelho "Remover"
4. Clique em **"Remover"**
5. **Resultado Esperado:**
   - ✅ Toast verde: "[Nome] foi removido do grupo"
   - Lista recarrega
   - Membro **desaparece** da lista
   - Contador de membros **diminui** no header
6. **Volte para Home** → **"Últimas Atualizações"**
   - ✅ Nova atividade: "[Nome] foi removido do grupo"
   - Ícone: person-remove
   - Cor: vermelho

---

## 🎯 CENÁRIO 7: Validações e Restrições

### Teste 1: Não pode remover a si mesmo
1. **Na tela de Gerenciar Membros**, tente clicar em **"Remover"** no seu próprio card
2. **Resultado Esperado:**
   - ❌ **Botão não aparece** no seu card
   - Somente aparece se for outro membro

### Teste 2: Clicar em "Tornar Paciente" no paciente atual
1. Localize o card do **paciente atual**
2. Tente clicar em **"Tornar Paciente"**
3. **Resultado Esperado:**
   - ❌ **Botão não aparece** no card do paciente
   - Ou, se aparecer, Toast info: "Este membro já é o paciente"

### Teste 3: Pull to Refresh
1. **Na tela de Gerenciar Membros**, arraste para baixo
2. **Resultado Esperado:**
   - ✅ Ícone de loading aparece
   - Lista de membros recarrega
   - Dados atualizados aparecem

---

## 🎯 CENÁRIO 8: Logs de Atividade na Home

### Objetivo
Verificar que todas as ações aparecem na Home em "Últimas Atualizações".

### Passos
1. **Volte para a Home** (aba principal)
2. Na seção **"Últimas Atualizações"**, verifique:

#### Membro Promovido:
- Ícone: escudo (shield)
- Cor: azul
- Título: "Membro Promovido"
- Descrição: "[Nome] foi promovido a administrador"
- Tempo: "há X minutos"

#### Paciente Alterado:
- Ícone: coração (heart)
- Cor: rosa
- Título: "Paciente Alterado"
- Descrição: "[Nome] agora é o paciente do grupo"
- Tempo: "há X minutos"

#### Membro Removido:
- Ícone: person-remove
- Cor: vermelho
- Título: "Membro Removido"
- Descrição: "[Nome] foi removido do grupo"
- Tempo: "há X minutos"

#### Novo Membro:
- Ícone: person-add
- Cor: verde
- Título: "Novo Membro"
- Descrição: "[Nome] entrou no grupo como [papel]"
- Tempo: "há X minutos"

---

## 🎯 CENÁRIO 9: Teste de Sincronização Multi-Usuário

### Objetivo
Verificar que mudanças feitas por um admin são refletidas para outros usuários.

### Passos
1. **Usuário A (Admin):** Promove o Usuário B para admin
2. **Usuário B:** Faça logout e login novamente
3. **Usuário B:** Entre no grupo e tente acessar **Configurações**
4. **Resultado Esperado:**
   - ✅ Usuário B agora consegue entrar em Configurações
   - ✅ Vê botão "Gerenciar Membros"
   - ✅ Pode realizar todas as ações de admin

### Passos (Remover)
1. **Usuário A (Admin):** Remove o Usuário C do grupo
2. **Usuário C:** Faça logout e login novamente
3. **Usuário C:** Vá para **Grupos**
4. **Resultado Esperado:**
   - ✅ O grupo **não aparece** mais na lista de grupos do Usuário C
   - ✅ Não consegue acessar nada relacionado ao grupo

---

## ✅ Checklist Completo

Use esta lista para marcar o que já testou:

### Acesso e Visualização
- [ ] Cuidador não-admin é bloqueado em Configurações
- [ ] Admin consegue entrar em Configurações
- [ ] Lista de membros aparece corretamente
- [ ] Badges corretos (Admin, Paciente, Cuidador)
- [ ] Seu próprio card tem "(Você)"
- [ ] Card do paciente tem destaque visual

### Ações de Admin
- [ ] Promover cuidador → admin funciona
- [ ] Rebaixar admin → cuidador funciona
- [ ] Trocar paciente funciona
- [ ] Remover membro funciona
- [ ] Pull to refresh funciona

### Validações
- [ ] Não consigo remover a mim mesmo
- [ ] Botão "Tornar Paciente" não aparece no paciente atual
- [ ] Confirmações (Alerts) aparecem antes de ações críticas
- [ ] Toasts de sucesso aparecem após cada ação

### Logs de Atividade
- [ ] Promoção aparece na Home
- [ ] Troca de paciente aparece na Home
- [ ] Remoção aparece na Home
- [ ] Ícones e cores corretos
- [ ] Tempo relativo ("há X minutos") funciona

### Multi-Usuário
- [ ] Admin promovido consegue acessar Configurações
- [ ] Membro removido não vê mais o grupo

---

## 🐛 Problemas Encontrados?

### Se algo não funcionar:

1. **Verifique os logs do app:**
   ```bash
   # No terminal onde o Expo está rodando
   # Procure por erros em vermelho (ERROR)
   ```

2. **Verifique logs do backend:**
   ```bash
   ssh root@192.168.0.20
   tail -f /var/log/nginx/error.log
   tail -f /var/www/lacos-backend/storage/logs/laravel.log
   ```

3. **Teste as rotas manualmente:**
   ```bash
   # Obter token
   TOKEN="seu_token_aqui"
   
   # Listar membros
   curl -H "Authorization: Bearer $TOKEN" \
     https://lacos.catena.tec.br/api/groups/1/members
   
   # Promover membro
   curl -X PUT \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"role":"admin"}' \
     https://lacos.catena.tec.br/api/groups/1/members/2/role
   ```

---

## 📝 Reportar Bugs

Se encontrar algo que não funciona, me informe com:

1. **Cenário:** Qual teste estava fazendo?
2. **Esperado:** O que deveria acontecer?
3. **Aconteceu:** O que realmente aconteceu?
4. **Logs:** Copie os erros do console (se houver)
5. **Usuário:** Era admin ou cuidador?

---

**Boa sorte nos testes! 🚀**

