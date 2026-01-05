# 🔧 Solução: iOS não consegue acessar localhost:8001

## ❌ Problema

No iOS, quando você escaneia o QR code, abre um navegador com `localhost:8001` que não funciona porque o iOS não consegue acessar o localhost do seu computador.

## ✅ Soluções

### Solução 1: Usar Tunnel Mode (Recomendado)

O tunnel mode permite conectar mesmo em redes diferentes:

```bash
cd /home/darley/lacos
npx expo start --tunnel
```

**Vantagens:**
- ✅ Funciona em qualquer rede (não precisa estar na mesma Wi-Fi)
- ✅ Funciona no iOS
- ✅ Funciona no Android
- ✅ Mais fácil de usar

**Desvantagens:**
- ⚠️ Pode ser um pouco mais lento (dados passam pelo servidor do Expo)

### Solução 2: Usar IP da Máquina (Mais Rápido)

Se você e o iPhone estão na mesma rede Wi-Fi:

1. **Descobrir seu IP local:**
```bash
hostname -I
# ou
ip addr show | grep "inet " | grep -v 127.0.0.1
```

2. **Iniciar Expo com IP específico:**
```bash
cd /home/darley/lacos
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 npx expo start
```

3. **No terminal, você verá algo como:**
```
Metro waiting on exp://192.168.1.100:8081
```

4. **No iPhone:**
   - Abra o Expo Go
   - Toque em "Enter URL manually"
   - Digite: `exp://SEU_IP:8081`
   - Exemplo: `exp://192.168.1.100:8081`

### Solução 3: Usar LAN Mode (Padrão)

Se você e o iPhone estão na mesma rede Wi-Fi:

```bash
cd /home/darley/lacos
npx expo start --lan
```

Isso deve funcionar automaticamente no iOS se estiverem na mesma rede.

### Solução 4: Usar Dev Client (Melhor para Produção)

Se você já tem `expo-dev-client` instalado:

1. **Gerar build de desenvolvimento:**
```bash
npx expo run:ios
# ou
eas build --profile development --platform ios
```

2. **Instalar no iPhone**

3. **Iniciar servidor:**
```bash
npx expo start --dev-client
```

4. **Abrir o app customizado** (não Expo Go) e escanear o QR code

## 🎯 Recomendação

Para desenvolvimento rápido, use **Solução 1 (Tunnel Mode)**:

```bash
cd /home/darley/lacos
npx expo start --tunnel
```

Depois escaneie o QR code no iPhone com o Expo Go. Funcionará mesmo em redes diferentes!

## 📝 Nota

O erro "Não é possível acessar este site" no iOS acontece porque:
- O QR code contém `localhost:8001`
- O iOS tenta acessar `localhost` no próprio dispositivo (não no seu computador)
- Por isso não funciona

O tunnel mode resolve isso criando um túnel público que ambos podem acessar.

