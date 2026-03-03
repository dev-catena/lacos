# 🔧 Solução: QR Code gerando localhost:8082

## ❌ Problema
Quando você lê o QR code, abre um navegador com `http://localhost:8082` e dá erro de conexão.

## 🔍 Causas Possíveis

1. **Expo está gerando QR code com localhost** ao invés do IP da máquina
2. **Porta errada** (8082 ao invés de 8081)
3. **Formato errado** (http:// ao invés de exp://)
4. **Metro bundler não está escutando no IP correto**

## ✅ Soluções

### Solução 1: Usar Tunnel Mode (MAIS CONFIÁVEL) ⭐

O tunnel mode **sempre** gera o QR code correto:

```bash
cd /home/darley/lacos
./INICIAR_EXPO_TUNNEL.sh
```

**Por que funciona:**
- ✅ Gera QR code com URL correta (exp://)
- ✅ Não usa localhost
- ✅ Funciona no iOS e Android
- ✅ Não depende de configuração de rede

### Solução 2: Forçar IP e Limpar Tudo

```bash
cd /home/darley/lacos
./CORRIGIR_QRCODE_LOCALHOST_8082.sh
```

Este script:
1. Para todos os processos
2. Limpa todo o cache
3. Libera portas 8081 e 8082
4. Configura IP correto
5. Força variáveis de ambiente
6. Inicia Expo com configuração correta

### Solução 3: Verificar e Corrigir Manualmente

```bash
cd /home/darley/lacos

# 1. Parar tudo
pkill -f "expo start"
pkill -f "metro"

# 2. Limpar cache
rm -rf .expo
rm -rf node_modules/.cache

# 3. Configurar variáveis
export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.20
export EXPO_PACKAGER_HOSTNAME=192.168.0.20
export EXPO_NO_LOCALHOST=1
export EXPO_USE_LOCALHOST=0

# 4. Criar .expo/settings.json
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true
}
EOF

# 5. Iniciar com IP forçado
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.20 \
EXPO_PACKAGER_HOSTNAME=192.168.0.20 \
EXPO_NO_LOCALHOST=1 \
npx expo start --lan --host 192.168.0.20 --port 8081 --clear
```

### Solução 4: Verificar Metro Config

O `metro.config.js` pode estar causando o problema:

```bash
./CORRIGIR_METRO_CONFIG.sh
```

## 🎯 Por que está gerando localhost:8082?

1. **Expo está detectando porta errada** (8082 ao invés de 8081)
2. **Expo está usando localhost** ao invés do IP da máquina
3. **Cache antigo** pode estar causando o problema

## ✅ Solução Recomendada

**Use Tunnel Mode** - É a solução mais confiável:

```bash
cd /home/darley/lacos
./INICIAR_EXPO_TUNNEL.sh
```

Isso vai:
- ✅ Gerar QR code correto (exp://)
- ✅ Usar porta correta (8081)
- ✅ Funcionar no iOS e Android
- ✅ Não depender de configuração de rede

## 🔍 Verificar se Funcionou

Após iniciar o Expo, verifique:

1. **No terminal**, você deve ver:
   ```
   Metro waiting on exp://192.168.0.20:8081
   ```
   **NÃO deve mostrar:** `localhost:8082`

2. **No QR code**, deve mostrar:
   ```
   exp://192.168.0.20:8081
   ```
   **NÃO deve mostrar:** `http://localhost:8082`

3. **Ao escanear**, deve abrir no Expo Go (não no navegador)

## ⚠️ Se Ainda Mostrar localhost:8082

1. **Use Tunnel Mode** (solução mais confiável)
2. **Verifique se há outro processo usando porta 8082:**
   ```bash
   lsof -i :8082
   ```
3. **Reinstale Expo CLI:**
   ```bash
   npm uninstall -g expo-cli
   npm install -g expo-cli@latest
   ```

