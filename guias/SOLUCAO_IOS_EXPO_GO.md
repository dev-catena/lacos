# 🍎 Solução Específica para iOS - Expo Go

## ❌ Problema
No iOS, o Expo Go não tem campo para digitar URL manualmente, então se o QR code não funcionar, não há como conectar.

## ✅ Soluções (Por Ordem de Eficácia)

### Solução 1: Tunnel Mode (MAIS CONFIÁVEL) ⭐

O tunnel mode funciona **sempre**, mesmo em redes diferentes:

```bash
cd /home/darley/lacos
./INICIAR_EXPO_TUNNEL.sh
```

**Por que funciona:**
- ✅ Não depende de rede local
- ✅ QR code funciona normalmente
- ✅ Funciona no iOS e Android
- ✅ Não precisa configurar nada

**Desvantagem:**
- ⚠️ Pode ser um pouco mais lento (dados passam pelo servidor Expo)

### Solução 2: Verificar Rede Wi-Fi

O iOS precisa estar na **mesma rede Wi-Fi** que o computador:

1. **No computador:**
   ```bash
   hostname -I
   # Anote o IP (ex: 10.102.0.103)
   ```

2. **No iPhone:**
   - Vá em Configurações > Wi-Fi
   - Verifique se está conectado na mesma rede
   - Toque no "i" ao lado da rede
   - Verifique o IP do iPhone (deve estar na mesma faixa, ex: 10.102.0.x)

3. **Verificar AP Isolation:**
   - Alguns roteadores têm "AP Isolation" ou "Client Isolation"
   - Isso impede dispositivos na mesma Wi-Fi de se comunicarem
   - Desative essa opção no roteador se estiver ativa

### Solução 3: Usar Expo Dev Client (Recomendado para Produção)

O Expo Dev Client permite mais controle:

```bash
# 1. Instalar
npx expo install expo-dev-client

# 2. Gerar build para iOS
npx expo run:ios

# 3. Iniciar servidor
npx expo start --dev-client
```

**Vantagens:**
- ✅ Mais controle sobre a conexão
- ✅ Funciona melhor que Expo Go
- ✅ Permite usar bibliotecas nativas customizadas

### Solução 4: Compartilhar URL via AirDrop/Email

Se o QR code não funcionar, você pode compartilhar a URL:

1. **Iniciar Expo:**
   ```bash
   npx expo start --lan
   ```

2. **Copiar a URL** que aparece no terminal (ex: `exp://10.102.0.103:8081`)

3. **Enviar para o iPhone:**
   - Via AirDrop
   - Via Email
   - Via Mensagem

4. **No iPhone:**
   - Abrir a mensagem/email
   - Toque na URL
   - O Expo Go deve abrir automaticamente

### Solução 5: Usar ngrok (Tunnel Manual)

Se o tunnel do Expo não funcionar, use ngrok:

```bash
# 1. Instalar ngrok
# Baixe de: https://ngrok.com/download

# 2. Iniciar Expo normalmente
npx expo start --lan

# 3. Em outro terminal, criar tunnel
ngrok http 8081

# 4. Copiar a URL do ngrok (ex: https://abc123.ngrok.io)
# 5. Converter para formato Expo: exp://abc123.ngrok.io:80
# 6. Compartilhar essa URL com o iPhone
```

## 🎯 Solução Recomendada Imediata

**Use Tunnel Mode** - É a solução mais confiável:

```bash
cd /home/darley/lacos
./INICIAR_EXPO_TUNNEL.sh
```

Isso deve fazer o QR code funcionar no iOS imediatamente.

## 🔧 Se Tunnel Mode Não Funcionar

1. **Verificar versão do Expo Go:**
   - Atualize o Expo Go no App Store
   - Versões antigas podem ter bugs

2. **Verificar permissões:**
   - iOS precisa de permissão de câmera para ler QR code
   - Vá em Configurações > Expo Go > Câmera

3. **Reinstalar Expo Go:**
   - Desinstale e reinstale o Expo Go
   - Às vezes resolve problemas de cache

4. **Usar outro dispositivo iOS:**
   - Teste em outro iPhone/iPad
   - Pode ser problema específico do dispositivo

## 📱 Alternativa: Usar Android para Desenvolvimento

Se o iOS continuar com problemas:
- Use Android para desenvolvimento (funciona digitando URL)
- Teste no iOS apenas quando necessário
- Considere migrar para Expo Dev Client para ter mais controle

