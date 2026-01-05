# 📱 Como Conectar iOS ao Expo

## ❌ Problema Atual

No iOS, quando você escaneia o QR code, abre um navegador com `localhost:8001` que não funciona.

## ✅ Solução Rápida

### Opção 1: Tunnel Mode (Funciona em qualquer rede)

```bash
cd /home/darley/lacos
npm run start:tunnel
```

Depois escaneie o QR code no iPhone. Funcionará mesmo se estiverem em redes diferentes!

### Opção 2: LAN Mode (Mesma rede Wi-Fi)

Se você e o iPhone estão na mesma rede Wi-Fi:

```bash
cd /home/darley/lacos
npm run start:lan
```

Depois escaneie o QR code no iPhone.

### Opção 3: Manual (Se as opções acima não funcionarem)

1. **Descobrir seu IP:**
```bash
hostname -I
```

2. **Iniciar Expo normalmente:**
```bash
npm start
```

3. **No iPhone:**
   - Abra o Expo Go
   - Toque em "Enter URL manually"
   - Digite: `exp://SEU_IP:8081`
   - Exemplo: `exp://192.168.1.100:8081`

## 🎯 Recomendação

Use **Opção 1 (Tunnel Mode)** - é a mais fácil e funciona sempre!

```bash
npm run start:tunnel
```

