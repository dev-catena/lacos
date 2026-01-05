# 📱 Como Usar o IP Correto no Expo

## ⚠️ Situação Atual

O Expo CLI está mostrando `localhost:8081` na mensagem e no QR code, mas o Metro bundler está funcionando corretamente no IP `10.102.0.103:8081`.

**O QR code gerado pelo Expo não funciona** porque contém `localhost`, mas o servidor Metro está acessível pelo IP correto.

## ✅ Solução: Usar URL Manualmente

### Opção 1: Script Automático (Recomendado)

```bash
npm run start:lan
```

O script vai:
- ✅ Iniciar o Expo com todas as configurações corretas
- ✅ Mostrar a URL correta de forma destacada
- ✅ Você pode copiar e colar no Expo Go

### Opção 2: Gerar QR Code com URL Correta

Em outro terminal, enquanto o Expo está rodando:

```bash
./gerar-qrcode-ip.sh
```

Isso vai gerar um QR code com a URL correta: `exp://10.102.0.103:8081`

### Opção 3: Usar Manualmente no Expo Go

1. Abra o **Expo Go** no seu celular
2. Toque em **"Enter URL manually"** (ou "Inserir URL manualmente")
3. Cole ou digite: `exp://10.102.0.103:8081`
4. Toque em **"Connect"** (ou "Conectar")

## 🔍 Verificar se Está Funcionando

Após iniciar o Expo, verifique se o Metro está acessível:

```bash
curl http://10.102.0.103:8081/status
```

Se retornar algo, o Metro está funcionando corretamente no IP!

## 📝 Nota Técnica

O problema é que o Expo CLI determina o hostname antes de gerar o QR code, e está usando `localhost` mesmo com todas as variáveis de ambiente configuradas. O Metro bundler em si está funcionando corretamente e é acessível pelo IP `10.102.0.103:8081`.

## 🎯 Comandos Rápidos

```bash
# Iniciar Expo (mostra URL correta)
npm run start:lan

# Gerar QR code com URL correta (em outro terminal)
./gerar-qrcode-ip.sh

# Verificar se Metro está acessível
curl http://10.102.0.103:8081/status
```

