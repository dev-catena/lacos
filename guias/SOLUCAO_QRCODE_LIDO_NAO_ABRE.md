# 🔧 Solução: QR Code é Lido mas App Não Abre

## ❌ Problema
- QR code é escaneado com sucesso
- Mas o app não abre no Expo Go

## 🔍 Causa Mais Comum
O `expo-dev-client` está instalado e faz o Expo gerar QR codes para dev-client ao invés do Expo Go.

## ✅ Solução Aplicada

Executei o script que força o uso do Expo Go:
```bash
./scripts/USAR_EXPO_GO_APENAS.sh
```

## 🧪 Como Verificar se Funcionou

### 1. Verifique o Terminal
O terminal deve mostrar:
```
Metro waiting on exp://192.168.1.105:8081
```

**NÃO deve mostrar:**
- `http://localhost:8081`
- `http://192.168.1.105:8081`
- Qualquer coisa com `dev-client`

### 2. Verifique o QR Code
O QR code deve mostrar:
```
exp://192.168.1.105:8081
```

**NÃO deve mostrar:**
- `http://` (apenas `exp://`)
- `localhost`
- URL de tunnel muito longa (se estiver em tunnel mode, pode ser normal)

### 3. Teste no Dispositivo

**No Android:**
1. Abra o app **Expo Go** (não outro app)
2. Toque em "Scan QR Code"
3. Escaneie o QR code
4. O app deve abrir automaticamente

**Se ainda não abrir:**
- Verifique se Expo Go está instalado
- Tente abrir Expo Go manualmente primeiro
- Verifique permissões de câmera
- Tente digitar a URL manualmente no Expo Go

## 🔄 Solução Alternativa (Se Não Funcionar)

### Opção 1: Limpar Tudo e Reiniciar
```bash
cd /home/darley/lacos

# Parar tudo
pkill -f expo
pkill -f metro

# Limpar cache
rm -rf .expo
rm -rf node_modules/.cache

# Forçar Expo Go
export EXPO_USE_DEV_CLIENT=0
export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.105
export EXPO_PACKAGER_HOSTNAME=192.168.1.105

# Iniciar
npx expo start --tunnel --clear
```

### Opção 2: Usar URL Manualmente
Se o QR code não funcionar, você pode:

1. Abrir Expo Go manualmente
2. Toque em "Enter URL manually"
3. Digite: `exp://192.168.1.105:8081`
4. Toque em "Connect"

### Opção 3: Verificar Rede
```bash
# Verificar se porta está acessível
netstat -tuln | grep 8081

# Verificar firewall
sudo ufw status
```

## 📱 Checklist no Dispositivo

- [ ] Expo Go está instalado?
- [ ] Permissão de câmera concedida?
- [ ] Dispositivo e computador na mesma Wi-Fi?
- [ ] VPN desativada?
- [ ] Firewall não está bloqueando?

## 🎯 Próximos Passos

1. Aguarde o script terminar de iniciar
2. Verifique o terminal para ver a URL correta
3. Escaneie o QR code novamente
4. Se funcionar, você verá a tela de boas-vindas


