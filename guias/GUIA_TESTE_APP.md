# 🧪 Guia de Teste do App Laços

## 🚀 Expo Iniciado!

O app está rodando e conectado ao backend em: `http://10.102.0.103/api`

## 📱 Como Testar

### 1. Abrir o App no Celular/Emulador
- Escaneie o QR Code com o app Expo Go (Android/iOS)
- OU pressione `a` para Android emulator
- OU pressione `i` para iOS simulator

### 2. Testar Fluxo de Cadastro

#### 2.1. Criar Nova Conta
1. Abra o app
2. Clique em **"Criar Conta"** ou **"Cadastrar"**
3. Preencha os dados:
   - Nome: `João`
   - Sobrenome: `Silva`
   - Email: `joao.silva@teste.com`
   - Telefone: `11987654321`
   - Senha: `senha123`
   - Data de Nascimento: `01/01/1990`
   - Gênero: `Masculino`
4. Clique em **"Cadastrar"**

**✅ Resultado Esperado:**
- Conta criada com sucesso
- Redirecionado para a tela inicial logado
- Token salvo automaticamente

#### 2.2. Fazer Logout
1. Vá para **"Configurações"** ou **"Perfil"**
2. Clique em **"Sair"**

**✅ Resultado Esperado:**
- Logout realizado
- Redirecionado para tela de login

#### 2.3. Fazer Login
1. Na tela de login, insira:
   - Email: `joao.silva@teste.com`
   - Senha: `senha123`
2. Clique em **"Entrar"**

**✅ Resultado Esperado:**
- Login bem-sucedido
- Dados do usuário carregados
- Redirecionado para home

### 3. Testar Fluxo de Grupos

#### 3.1. Criar Grupo
1. Navegue para **"Grupos"** ou tela inicial
2. Clique em **"Criar Grupo"** ou **"Adicionar Grupo"**
3. Preencha:
   - Nome do Grupo: `Família Silva`
   - Nome do Paciente: `Maria Silva`
   - Data de Nascimento: `15/01/1950`
   - Gênero: `Feminino`
4. Clique em **"Criar"**

**✅ Resultado Esperado:**
- Grupo criado no banco de dados
- Grupo aparece na lista
- ID do grupo salvo

#### 3.2. Gerar Código de Convite
1. Entre no grupo criado
2. Clique em **"Configurações"** ou **"Compartilhar"**
3. Clique em **"Gerar Código de Convite"**

**✅ Resultado Esperado:**
- Código gerado (ex: `ABC123`)
- Possível copiar/compartilhar

### 4. Testar Fluxo de Medicamentos

#### 4.1. Adicionar Medicamento
1. Entre em um grupo
2. Vá para **"Medicamentos"**
3. Clique em **"Adicionar Medicamento"** ou **"+"**
4. Preencha:
   - Nome: `Losartana 50mg`
   - Forma: `Comprimido`
   - Dosagem: `50`
   - Unidade: `mg`
   - Via: `Oral`
   - Frequência: `A cada 12 horas`
   - Primeira Dose: `Hoje às 08:00`
   - Duração: `Uso Contínuo`
5. Clique em **"Salvar"**

**✅ Resultado Esperado:**
- Medicamento criado no banco
- Aparece na lista de medicamentos
- Horários de doses calculados

#### 4.2. Marcar Dose como Tomada
1. Na tela de medicamentos ou home
2. Encontre uma dose pendente
3. Clique em **"Marcar como Tomada"** ou botão de check
4. Confirme o horário

**✅ Resultado Esperado:**
- Dose registrada no histórico
- Status atualizado no banco
- Próxima dose calculada

#### 4.3. Ver Histórico de Doses
1. Entre no medicamento
2. Clique em **"Histórico"** ou aba de histórico
3. Veja o calendário/lista de doses

**✅ Resultado Esperado:**
- Lista de doses tomadas/puladas
- Datas e horários corretos
- Dados vindo do banco remoto

### 5. Testar Fluxo de Médicos

#### 5.1. Adicionar Médico
1. Vá para **"Médicos"**
2. Clique em **"Adicionar Médico"**
3. Preencha:
   - Nome: `Dr. João Santos`
   - Especialidade: `Cardiologista`
   - Telefone: `11987654321`
   - Email: `drjoao@clinica.com`
4. Clique em **"Salvar"**

**✅ Resultado Esperado:**
- Médico criado no banco
- Aparece na lista

### 6. Testar Fluxo de Consultas

#### 6.1. Agendar Consulta
1. Vá para **"Consultas"** ou **"Agenda"**
2. Clique em **"Nova Consulta"**
3. Preencha:
   - Título: `Consulta Cardiologia`
   - Médico: Selecione o médico criado
   - Data/Hora: Escolha data futura
   - Local: `Clínica ABC`
   - Notas: `Levar exames`
4. Clique em **"Salvar"**

**✅ Resultado Esperado:**
- Consulta criada no banco
- Aparece no calendário
- Notificação agendada (se implementado)

## 🐛 Problemas Comuns

### Erro: "Network request failed"
**Causa:** Celular não consegue acessar o servidor
**Solução:** 
- Verifique se está na mesma rede
- Teste acessar `http://10.102.0.103/api/user` no navegador do celular
- Se não funcionar, o firewall pode estar bloqueando

### Erro: "401 Unauthorized" ao criar grupo
**Causa:** Token não está sendo enviado
**Solução:**
- Faça logout e login novamente
- Verifique console do Expo para ver se token está presente

### Erro: "500 Server Error"
**Causa:** Problema no backend
**Solução:**
```bash
ssh darley@10.102.0.103 "tail -50 /var/www/lacos-backend/storage/logs/laravel.log"
```

### App trava ao fazer login
**Causa:** Resposta da API diferente do esperado
**Solução:**
- Abra o console do Expo (pressione `j`)
- Veja o erro completo
- Verifique formato da resposta da API

## 📊 Checklist de Testes

- [ ] Cadastro de usuário funciona
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Criar grupo funciona
- [ ] Listar grupos funciona
- [ ] Adicionar medicamento funciona
- [ ] Listar medicamentos funciona
- [ ] Marcar dose como tomada funciona
- [ ] Ver histórico de doses funciona
- [ ] Adicionar médico funciona
- [ ] Criar consulta funciona
- [ ] Dados persistem após fechar o app
- [ ] Dados sincronizam entre dispositivos (teste com 2 celulares)

## 🔍 Monitorar Requisições

Para ver todas as requisições HTTP em tempo real:

1. No console do Expo, pressione `j` para abrir DevTools
2. Vá para a aba **Network**
3. Realize ações no app
4. Veja as requisições sendo feitas

OU adicione logs temporários:

```javascript
// No início de qualquer screen que use API
useEffect(() => {
  console.log('🔵 Iniciando tela...');
  // suas chamadas de API
}, []);
```

## 📞 Suporte

Se encontrar algum erro:

1. **Copie o erro completo** do console Expo
2. **Tire screenshot** da tela com erro
3. **Verifique logs do backend**:
   ```bash
   ssh darley@10.102.0.103 "tail -100 /var/www/lacos-backend/storage/logs/laravel.log"
   ```

---

**Backend:** `http://10.102.0.103/api`  
**Status:** ✅ Funcionando  
**Última atualização:** 23/11/2025

