# 🔍 Diagnóstico Completo: Problema com QR Code no Expo Go

## 📋 Situação Atual

- ✅ **Android**: Funciona apenas digitando URL manualmente (`exp://192.168.0.20:8081`)
- ❌ **iOS**: Não tem campo para digitar URL, então não funciona
- ❌ **QR Code**: Não funciona em nenhuma plataforma

## 🔍 Possíveis Causas

### 1. Mudanças no Expo Go App
O Expo Go pode ter mudado como lida com QR codes. Verifique:
- Versão do Expo Go no dispositivo
- Atualizações recentes do app
- Permissões de câmera

### 2. Problemas de Rede
- Firewall bloqueando conexões
- Rede Wi-Fi com isolamento de clientes (AP isolation)
- Mudanças na configuração de rede
- VPN ativa interferindo

### 3. Problemas com Detecção de IP
- Expo não está detectando o IP correto
- QR code sendo gerado com localhost ao invés do IP
- Metro bundler não está escutando no IP correto

### 4. Problemas com Metro Bundler
- Metro não está acessível na rede
- Porta 8081 bloqueada
- Configuração incorreta do Metro

## ✅ Soluções (Por Ordem de Prioridade)

### Solução 1: Usar Tunnel Mode (MAIS CONFIÁVEL)

O tunnel mode funciona mesmo com problemas de rede:

```bash
cd /home/darley/lacos

# Parar processos antigos
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null

# Limpar cache
rm -rf .expo
rm -rf node_modules/.cache

# Iniciar com tunnel
npx expo start --tunnel --clear
```

**Vantagens:**
- ✅ Funciona em qualquer rede
- ✅ Funciona no iOS e Android
- ✅ QR code funciona normalmente
- ✅ Não depende de configuração de rede local

**Desvantagens:**
- ⚠️ Pode ser um pouco mais lento
- ⚠️ Requer conexão com internet

### Solução 2: Verificar e Corrigir Configuração de Rede

```bash
cd /home/darley/lacos

# 1. Verificar IP atual
hostname -I
# Deve mostrar: 192.168.0.20

# 2. Verificar se porta 8081 está acessível
netstat -tuln | grep 8081

# 3. Verificar firewall
sudo ufw status
# Se estiver ativo, permitir porta 8081:
sudo ufw allow 8081/tcp

# 4. Verificar se Metro está escutando em 0.0.0.0
# (deve escutar em todas as interfaces, não só localhost)
```

### Solução 3: Forçar IP no QR Code

Criar script que força o IP correto:

```bash
cd /home/darley/lacos

# Parar tudo
pkill -f "expo start"
pkill -f "metro"

# Limpar cache
rm -rf .expo
rm -rf node_modules/.cache

# Configurar variáveis
export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.20
export EXPO_PACKAGER_HOSTNAME=192.168.0.20
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Criar .expo/settings.json
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true
}
EOF

# Iniciar
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.20 \
EXPO_PACKAGER_HOSTNAME=192.168.0.20 \
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
npx expo start --lan --clear
```

### Solução 4: Usar Expo Dev Client (Recomendado para Produção)

Se o Expo Go continua com problemas, migre para Expo Dev Client:

```bash
# Instalar
npx expo install expo-dev-client

# Gerar build de desenvolvimento
npx expo run:android
npx expo run:ios

# Iniciar servidor
npx expo start --dev-client
```

### Solução 5: Verificar Problemas Específicos do iOS

No iOS, o Expo Go pode ter limitações. Verifique:

1. **Permissões de Câmera**: iOS precisa de permissão para ler QR code
2. **Versão do Expo Go**: Atualize para a versão mais recente
3. **Rede Wi-Fi**: Certifique-se que iOS e computador estão na mesma rede
4. **Isolamento AP**: Alguns roteadores têm "AP Isolation" que impede comunicação entre dispositivos

## 🛠️ Script de Diagnóstico Completo

Execute este script para diagnosticar todos os problemas:

```bash
#!/bin/bash
cd /home/darley/lacos

echo "🔍 DIAGNÓSTICO COMPLETO EXPO GO"
echo "================================"
echo ""

# 1. Verificar IP
echo "1️⃣ Verificando IP da máquina..."
IP=$(hostname -I | awk '{print $1}')
echo "   IP encontrado: $IP"
echo "   IP esperado: 192.168.0.20"
if [ "$IP" != "192.168.0.20" ]; then
    echo "   ⚠️  IP diferente do esperado!"
fi
echo ""

# 2. Verificar porta 8081
echo "2️⃣ Verificando porta 8081..."
if lsof -i :8081 > /dev/null 2>&1; then
    echo "   ✅ Porta 8081 está em uso"
    lsof -i :8081
else
    echo "   ❌ Porta 8081 está livre"
fi
echo ""

# 3. Verificar firewall
echo "3️⃣ Verificando firewall..."
if command -v ufw > /dev/null; then
    UFW_STATUS=$(sudo ufw status | head -1)
    echo "   Status: $UFW_STATUS"
    if echo "$UFW_STATUS" | grep -q "active"; then
        echo "   ⚠️  Firewall ativo - pode estar bloqueando porta 8081"
    fi
fi
echo ""

# 4. Verificar rede
echo "4️⃣ Verificando conectividade de rede..."
ping -c 1 192.168.0.20 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ IP 192.168.0.20 responde"
else
    echo "   ❌ IP 192.168.0.20 não responde"
fi
echo ""

# 5. Verificar Expo
echo "5️⃣ Verificando configuração Expo..."
if [ -f ".expo/settings.json" ]; then
    echo "   ✅ .expo/settings.json existe"
    cat .expo/settings.json
else
    echo "   ⚠️  .expo/settings.json não existe"
fi
echo ""

# 6. Verificar Metro config
echo "6️⃣ Verificando metro.config.js..."
if [ -f "metro.config.js" ]; then
    echo "   ✅ metro.config.js existe"
    if grep -q "192.168.0.20" metro.config.js; then
        echo "   ✅ IP 192.168.0.20 configurado no Metro"
    else
        echo "   ⚠️  IP não encontrado no Metro config"
    fi
else
    echo "   ⚠️  metro.config.js não existe"
fi
echo ""

# 7. Verificar versão Expo
echo "7️⃣ Verificando versão Expo..."
if command -v npx > /dev/null; then
    EXPO_VERSION=$(npx expo --version 2>/dev/null)
    echo "   Versão: $EXPO_VERSION"
fi
echo ""

echo "✅ Diagnóstico concluído!"
```

## 🎯 Solução Recomendada Imediata

**Use Tunnel Mode** - É a solução mais confiável:

```bash
cd /home/darley/lacos
pkill -f "expo start"
rm -rf .expo
npx expo start --tunnel --clear
```

Isso deve fazer o QR code funcionar novamente em ambos iOS e Android.

