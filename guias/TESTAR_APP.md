# 📱 Guia para Testar o App Laços

## 🚀 Status Atual

✅ **Backend Laravel** rodando em: `http://localhost:8000/api`  
✅ **Frontend React Native** rodando via Expo  
✅ **Banco MySQL** configurado com todas as tabelas  
✅ **22 rotas API** funcionando  

---

## 📲 Opção 1: Testar em Dispositivo Físico (Recomendado)

### Passo 1: Baixar o Expo Go

- **Android**: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

### Passo 2: Conectar no Mesmo Wi-Fi

Certifique-se que seu celular e computador estão na **mesma rede Wi-Fi**.

### Passo 3: Escanear QR Code

1. Abra o terminal onde rodou `npm start`
2. Você verá um **QR code grande**
3. Escaneie com:
   - **Android**: App Expo Go → "Scan QR Code"
   - **iOS**: App Câmera nativa → Abrirá no Expo Go

### Passo 4: Aguardar Carregar

- Primeira vez: 20-40 segundos
- Próximas vezes: 5-10 segundos

---

## 🖥️ Opção 2: Testar no Navegador Web

```bash
cd /home/darley/lacos
npm start
# Pressione 'w' no terminal
```

Abrirá em `http://localhost:19006`

---

## 📱 Opção 3: Testar no Emulador Android

```bash
# Pré-requisito: Android Studio instalado

cd /home/darley/lacos
npm start
# Pressione 'a' no terminal
```

---

## 🔧 Comandos Úteis

### Ver QR Code Grande no Navegador

```bash
# Abra no navegador:
http://localhost:8081
```

### Reiniciar App

```bash
cd /home/darley/lacos

# Parar tudo
killall node

# Iniciar novamente
npm start
```

### Ver Logs do Metro Bundler

```bash
# Em outro terminal
cd /home/darley/lacos
npx expo start --clear
```

### Recarregar App no Dispositivo

- **Android**: Agite o celular → "Reload"
- **iOS**: Agite o celular → "Reload"
- **Ou pressione 'r' no terminal**

---

## 🧪 Testar Funcionalidades

### 1. Tela de Boas-Vindas

Ao abrir o app, você verá:
- ✅ Logo "Laços" no topo
- ✅ Botões "Entrar" e "Criar Conta"

### 2. Criar Conta (Caso de Uso 1)

```
Clique em "Criar Conta"
Preencha:
  - Nome: João
  - Sobrenome: Silva
  - Email: joao@example.com
  - Telefone: (11) 98765-4321
  - Senha: senha123
  - Confirmar Senha: senha123
  
Clique "Cadastrar"
```

**Resultado esperado:**
- ✅ Conta criada automaticamente
- ✅ Grupo pessoal criado automaticamente
- ✅ Redirecionado para tela Home

### 3. Login

```
Na tela de Login:
  - Email: joao@example.com
  - Senha: senha123
  
Clique "Entrar"
```

**Resultado esperado:**
- ✅ Login bem-sucedido
- ✅ Token salvo no dispositivo
- ✅ Redirecionado para Home

### 4. Navegar pelo App

- ✅ **Aba Home**: Dashboard com logo
- ✅ **Aba Grupos**: Listar grupos
- ✅ **Aba Notificações**: Placeholder
- ✅ **Aba Perfil**: Dados do usuário + Logout

---

## 🐛 Problemas Comuns

### QR Code não aparece

```bash
# Parar tudo
killall node

# Limpar cache
cd /home/darley/lacos
npx expo start --clear
```

### "Não consegue conectar ao Metro"

**Solução**: Certifique-se que celular e PC estão no mesmo Wi-Fi.

```bash
# Ver IP da máquina
hostname -I

# Deve mostrar: 192.168.0.20
# Esse IP deve estar configurado em src/config/api.js
```

### Erro ao fazer login

**Verificar backend:**
```bash
# Backend rodando?
curl http://localhost:8000/api/health

# Deve retornar:
# {"success":true,"message":"Laços API está funcionando!"}
```

**Verificar configuração:**
```bash
# Abrir src/config/api.js
# BASE_URL deve ser: 'http://192.168.0.20:8000/api'
```

### App trava ao carregar

```bash
# Reiniciar Expo com cache limpo
cd /home/darley/lacos
killall node
npx expo start --clear
```

---

## 📊 Testar Backend Diretamente

### Health Check

```bash
curl http://localhost:8000/api/health
```

### Criar Usuário (via API direta)

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria",
    "last_name": "Santos",
    "email": "maria@example.com",
    "password": "senha123",
    "password_confirmation": "senha123",
    "phone": "(11) 91234-5678"
  }'
```

### Login (via API direta)

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@example.com",
    "password": "senha123"
  }'
```

---

## 🎯 Fluxo de Teste Completo

1. ✅ Abrir app → Ver tela de boas-vindas
2. ✅ Criar conta → Ver grupo pessoal criado
3. ✅ Logout → Voltar para login
4. ✅ Login → Entrar novamente
5. ✅ Navegar entre abas → Testar navegação
6. ✅ Ver perfil → Dados do usuário
7. ✅ Logout → Finalizar sessão

---

## 📝 Próximos Passos

### Implementar na Sequência:

1. **Caso de Uso 2**: Criar grupo para outra pessoa
   - Tela `CreateGroupScreen`
   - Formulário de acompanhado
   - Gerar código de convite

2. **Caso de Uso 3**: Adicionar cuidador ao grupo
   - Tela de detalhes do grupo
   - Listar membros
   - Gerenciar permissões
   - Convidar novos cuidadores

3. **Funcionalidades Extras**:
   - Upload de foto de perfil
   - Notificações push
   - Calendário de consultas
   - Registro de medicações
   - Sinais vitais

---

## 🆘 Ajuda

### Parar Tudo

```bash
# Parar Expo
killall node

# Parar Laravel
killall php
```

### Iniciar Tudo Novamente

```bash
# Terminal 1: Backend
cd /home/darley/lacos-backend
php artisan serve

# Terminal 2: Frontend
cd /home/darley/lacos
npm start
```

### Ver Processos Rodando

```bash
ps aux | grep node  # Expo
ps aux | grep php   # Laravel
```

---

## ✅ Checklist Final

- [ ] Backend rodando (`curl http://localhost:8000/api/health`)
- [ ] Frontend rodando (QR code visível no terminal)
- [ ] Expo Go instalado no celular
- [ ] Mesmo Wi-Fi (celular e PC)
- [ ] IP correto em `src/config/api.js` (`192.168.0.20`)
- [ ] QR code escaneado
- [ ] App carregou no celular
- [ ] Login funciona
- [ ] Navegação funciona

---

## 🎉 Pronto!

Seu app Laços está rodando! Qualquer problema, consulte este guia ou os logs no terminal.

**Logs importantes:**
- Frontend: Terminal onde rodou `npm start`
- Backend: `/tmp/laravel-server.log` ou terminal do `php artisan serve`
- Banco de dados: `mysql -u lacos -p'Lacos12#' lacos`

