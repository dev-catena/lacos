# 🔐 Fluxo de Deep Link com Autenticação

## ✅ Fluxo Correto Implementado

### 1. Usuário Escaneia QR Code no Metrô

O QR code contém uma URL como:
- `https://lacos.com/grupo/ABC123` (produção)
- `http://192.168.100.10/grupo/ABC123` (desenvolvimento)

### 2. App é Aberto (ou Navegador Redireciona)

- Se o app já está instalado, o Android abre o app automaticamente
- Se não está instalado, abre no navegador (usuário pode instalar depois)

### 3. Verificação de Autenticação

O app verifica se o usuário está logado:

**Se NÃO está logado:**
- ✅ Código de convite é salvo temporariamente (`global.pendingInviteCode`)
- ✅ Toast informa: "Código de convite recebido - Faça login para entrar no grupo"
- ✅ Usuário é redirecionado para tela de login

**Se JÁ está logado:**
- ✅ Código é processado imediatamente
- ✅ App navega para tela de grupos
- ✅ Modal de "Entrar com Código" abre automaticamente com o código preenchido

### 4. Após Login Bem-Sucedido

- ✅ App detecta que há código pendente
- ✅ Processa automaticamente o código
- ✅ Navega para tela de grupos
- ✅ Abre modal com código preenchido
- ✅ Usuário só precisa confirmar para entrar no grupo

## 🔒 Segurança

- ✅ **Nenhum código de convite é processado sem autenticação**
- ✅ URLs públicas não permitem entrar em grupos sem login
- ✅ Código é salvo temporariamente apenas na memória (não persiste)
- ✅ Após processar, código é limpo automaticamente

## 📱 Formatos de URL Suportados

### Produção:
- `https://lacos.com/grupo/ABC123`
- `https://lacos.com/join?code=ABC123`
- `https://lacos.com/ABC123`

### Desenvolvimento:
- `http://192.168.100.10/grupo/ABC123`
- `http://192.168.100.10/join?code=ABC123`
- `http://192.168.100.10/ABC123`

### Deep Link Customizado (apenas em build nativo):
- `lacos://grupo/ABC123`
- `lacos://join?code=ABC123`

## 🧪 Como Testar

### No Expo Go:

1. **Inicie o Expo:**
   ```bash
   npx expo start --tunnel
   ```

2. **Use o Dev Menu:**
   - Agite o celular ou pressione menu
   - Toque em "Open URL"
   - Digite: `http://192.168.100.10/grupo/TESTE123`

3. **Cenário 1 - Não está logado:**
   - App mostra toast: "Código de convite recebido - Faça login..."
   - Tela de login aparece
   - Após login, código é processado automaticamente

4. **Cenário 2 - Já está logado:**
   - App navega para grupos
   - Modal abre com código preenchido

## 🎯 Vantagens Deste Fluxo

1. ✅ **Seguro**: Requer autenticação
2. ✅ **Automático**: Processa código após login
3. ✅ **Transparente**: Usuário não precisa copiar/colar código
4. ✅ **Flexível**: Funciona mesmo se usuário não estiver logado

## ⚠️ Importante

- URLs públicas (`http://192.168.100.10/grupo/ABC123`) **não permitem entrar em grupos sem login**
- O código é apenas **salvo temporariamente** e processado após autenticação
- Se o usuário fechar o app sem fazer login, o código é perdido (comportamento esperado)







