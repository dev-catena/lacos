# 📱 Como Testar Deep Links com Expo Go

## ✅ Boa Notícia

Você **NÃO precisa fazer build nativo** para testar deep links com Expo Go! O Expo Go já suporta deep links HTTP/HTTPS.

## 🎯 Como Funciona

### 1. Deep Links Customizados (lacos://)
- ❌ **NÃO funcionam no Expo Go** - apenas em builds nativos
- O Expo Go não reconhece schemes customizados como `lacos://`

### 2. Deep Links HTTP/HTTPS
- ✅ **FUNCIONAM no Expo Go** através do navegador
- Quando você acessa uma URL HTTP/HTTPS no navegador do dispositivo, o Android pode perguntar qual app abrir

## 🧪 Como Testar

### Método 1: Usar Navegador do Dispositivo (Recomendado)

1. **Inicie o Expo Go normalmente:**
   ```bash
   cd /home/darley/lacos
   npx expo start --tunnel
   ```

2. **Escaneie o QR code com o Expo Go** para abrir o app

3. **No dispositivo Android, abra o navegador** (Chrome, Firefox, etc.)

4. **Digite ou acesse uma URL de teste:**
   ```
   http://192.168.1.105/grupo/TESTE123
   ```
   ou
   ```
   http://192.168.1.105/join?code=TESTE123
   ```

5. **O Android deve perguntar qual app abrir:**
   - Se o Expo Go estiver rodando, pode aparecer como opção
   - Mas geralmente vai abrir no navegador mesmo

### Método 2: Usar Link Direto no Expo Go

O Expo Go tem suporte limitado a deep links. Você pode tentar:

1. **No terminal do Expo, pressione `d`** para abrir o Dev Menu

2. **Ou use o comando:**
   ```bash
   npx expo start --tunnel
   # Depois, no terminal, digite a URL quando solicitado
   ```

### Método 3: Testar com Link no App (Melhor para Expo Go)

Como o Expo Go não abre automaticamente via deep link HTTP, você pode:

1. **Adicionar um botão de teste no app** que processa URLs manualmente
2. **Ou usar o Dev Menu do Expo** para testar

## 🔧 Solução: Adicionar Botão de Teste Temporário

Vou criar um botão de teste que você pode usar no Expo Go para simular deep links:

```javascript
// Adicionar em uma tela de teste
const testDeepLink = () => {
  const testUrl = 'http://192.168.1.105/grupo/TESTE123';
  Linking.openURL(testUrl);
};
```

## ⚠️ Limitações do Expo Go

1. **Schemes customizados não funcionam** (`lacos://`)
2. **Deep links HTTP podem não abrir automaticamente** - geralmente abrem no navegador
3. **Para produção, você precisará fazer build nativo** para deep links funcionarem corretamente

## ✅ Para Produção

Quando estiver pronto para produção:

1. **Fazer build nativo:**
   ```bash
   npx expo run:android
   ```

2. **Instalar o app no dispositivo**

3. **Testar deep links** - eles funcionarão automaticamente

## 🎯 Recomendação

Para desenvolvimento com Expo Go:
- ✅ Use o app normalmente
- ✅ Teste a funcionalidade de entrar com código manualmente
- ✅ Para testar deep links reais, faça um build de desenvolvimento:
  ```bash
  npx expo run:android --device
  ```

Isso criará um build de desenvolvimento que você pode instalar no dispositivo e testar deep links reais.


