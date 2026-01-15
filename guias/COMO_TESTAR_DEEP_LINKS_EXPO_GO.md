# 📱 Como Testar Deep Links com Expo Go

## ✅ Boa Notícia

O código de deep links que implementamos **já funciona no Expo Go**! O Expo Go suporta a API `Linking` do React Native.

## 🎯 Como Funciona no Expo Go

### O que funciona:
- ✅ `Linking.getInitialURL()` - quando o app é aberto via URL
- ✅ `Linking.addEventListener('url')` - quando o app recebe uma URL enquanto está aberto
- ✅ Processamento de URLs HTTP/HTTPS
- ✅ Extração de código de convite da URL

### Limitações:
- ⚠️ Deep links customizados (`lacos://`) podem não funcionar no Expo Go
- ⚠️ URLs HTTP/HTTPS podem não abrir automaticamente o Expo Go (abrem no navegador)

## 🧪 Como Testar

### Método 1: Usar Expo Dev Menu (Mais Fácil)

1. **Inicie o Expo Go:**
   ```bash
   cd /home/darley/lacos
   npx expo start --tunnel
   ```

2. **Escaneie o QR code** com o Expo Go no seu dispositivo

3. **No dispositivo, agite o celular** ou pressione o botão de menu para abrir o Dev Menu

4. **Toque em "Open URL"** ou digite manualmente:
   ```
   http://192.168.1.105/grupo/TESTE123
   ```

5. **O app deve processar a URL** e abrir o modal com o código preenchido

### Método 2: Usar Navegador + Expo Go

1. **Inicie o Expo Go** normalmente

2. **No navegador do dispositivo**, acesse:
   ```
   http://192.168.1.105/grupo/TESTE123
   ```

3. **Se o Android perguntar qual app abrir**, selecione o Expo Go

4. **O app deve processar a URL** automaticamente

### Método 3: Teste Manual no App (Recomendado para Desenvolvimento)

Vou adicionar um botão de teste na tela de grupos que simula um deep link. Isso permite testar a funcionalidade sem precisar de URLs externas.

## 🔧 Adicionando Botão de Teste

Vou criar um botão temporário na tela de grupos para testar deep links manualmente.

## 📝 Verificar se Está Funcionando

1. **Abra o console do Expo** (pressione `j` no terminal ou veja os logs)

2. **Procure por mensagens como:**
   ```
   🔗 Deep Link - URL inicial detectada: ...
   🔗 Deep Link - Código extraído: ...
   ```

3. **Se você ver essas mensagens**, o deep link está funcionando!

## ⚠️ Importante

- **Para produção**, você precisará fazer build nativo para deep links funcionarem automaticamente
- **No Expo Go**, deep links funcionam, mas podem precisar de intervenção manual (Dev Menu ou navegador)
- **O código já está pronto** - quando você fizer build nativo, tudo funcionará automaticamente

## 🚀 Próximos Passos

1. Teste usando o Dev Menu do Expo (Método 1)
2. Se funcionar, o código está correto!
3. Para produção, faça build nativo quando estiver pronto







