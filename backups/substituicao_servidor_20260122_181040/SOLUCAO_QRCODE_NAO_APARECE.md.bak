# 📱 Solução: QR Code Não Aparece no Terminal

## ❌ Problema

O Expo está rodando mas o QR code não aparece no terminal.

## ✅ Soluções

### Solução 1: Pressionar 's' no Terminal (Mais Rápido)

No terminal onde o Expo está rodando, simplesmente pressione:

```
s
```

Isso vai forçar o Expo a mostrar o QR code.

### Solução 2: Verificar se Expo Está Rodando

```bash
./MOSTRAR_QRCODE.sh
```

Este script vai:
- Verificar se o Expo está rodando
- Tentar obter a URL do tunnel
- Mostrar instruções

### Solução 3: Reiniciar com QR Code Forçado

Se o QR code não aparecer mesmo pressionando 's':

```bash
# Parar Expo atual
pkill -f "expo start"

# Limpar e reiniciar
rm -rf .expo node_modules/.cache
./INICIAR_EXPO_SEM_LOCALHOST.sh
```

Escolha a opção 2 (Tunnel Mode) - o QR code deve aparecer automaticamente.

### Solução 4: Usar URL Manualmente

Se o QR code não aparecer, você pode usar a URL manualmente:

1. **Se estiver em Tunnel Mode:**
   - A URL será algo como: `exp://XXXXX-XXXXX.exp.direct:80`
   - Procure no terminal por "exp://" seguido de ".exp.direct"

2. **Se estiver em LAN Mode:**
   - Use: `exp://10.102.0.103:8081`

3. **No Expo Go:**
   - Toque em "Enter URL manually"
   - Cole a URL
   - Conecte

## 🔍 Por Que o QR Code Não Aparece?

Possíveis causas:
1. **Terminal muito pequeno** - O QR code precisa de espaço
2. **Terminal não suporta ASCII art** - Alguns terminais não mostram QR code
3. **Expo não detectou terminal interativo** - Pode acontecer em alguns casos

## ✅ Solução Definitiva

O QR code **não é obrigatório**! Você pode sempre usar a URL manualmente:

```bash
# Ver URL atual
./MOSTRAR_QRCODE.sh

# Ou simplesmente use:
exp://10.102.0.103:8081  # LAN mode
# ou
exp://XXXXX-XXXXX.exp.direct:80  # Tunnel mode (veja no terminal)
```

## 📋 Comandos Úteis

```bash
# Ver se Expo está rodando
lsof -i :8081

# Ver processos Expo
ps aux | grep expo

# Mostrar QR code (no terminal do Expo, pressione 's')
# (não há comando para isso, é interativo)

# Obter URL do tunnel
curl -s http://localhost:8081 | grep -o 'exp://[^"]*'
```

## 🎯 Resumo

1. **Pressione 's'** no terminal do Expo ← Mais fácil!
2. Se não funcionar, **use a URL manualmente** no Expo Go
3. A URL está sempre visível no terminal (procure por "exp://")

