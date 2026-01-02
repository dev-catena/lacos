# 📱 Expo Go - Funcionamento Normal

## ✅ Fluxo Correto (Restaurado)

### 1. QR Code do Expo Go
- Escaneia QR code no terminal: `exp://192.168.1.105:8081`
- Expo Go abre normalmente
- **NÃO interfere com deep links de convite**

### 2. Tela de Boas-Vindas
- App abre na tela de boas-vindas (Welcome)
- Usuário escolhe fazer login ou cadastro

### 3. Login
- Usuário faz login normalmente
- Após login, vê seus grupos ou pode criar novo

### 4. Deep Links de Convite (Separado)
- Deep links HTTP/HTTPS (`http://192.168.1.105/grupo/ABC123`) são processados **apenas se vierem de fora do Expo Go**
- URLs do Expo (`exp://`) são **completamente ignoradas** pelo sistema de deep links

## 🔧 O Que Foi Corrigido

1. ✅ URLs `exp://` são ignoradas pelo sistema de deep links
2. ✅ URLs `exp+://` são ignoradas pelo sistema de deep links
3. ✅ Expo Go funciona normalmente sem interferência
4. ✅ Deep links de convite funcionam apenas para URLs HTTP/HTTPS específicas

## 🧪 Como Testar

### Teste 1: Expo Go Normal
```bash
npx expo start --tunnel
# Escaneie QR code
# Deve abrir tela de boas-vindas normalmente
```

### Teste 2: Deep Link de Convite (Separado)
- Use Dev Menu do Expo
- Digite: `http://192.168.1.105/grupo/TESTE123`
- Deve processar código de convite (se logado)

## ⚠️ Importante

- **URLs do Expo (`exp://`) NUNCA são processadas como deep links de convite**
- **Expo Go funciona exatamente como antes**
- **Deep links de convite são apenas para URLs HTTP/HTTPS específicas**


