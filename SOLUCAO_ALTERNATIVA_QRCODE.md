# 🔄 Solução Alternativa: QR Code com localhost

## 🔴 Problema Persistente

Mesmo após todas as tentativas, o QR code continua mostrando `localhost:8081`.

## 💡 Solução Alternativa: Usar URL Manual

Se o QR code não pode ser corrigido, você pode usar a URL manualmente:

### No Expo Go:

1. Abra o Expo Go
2. Toque em **"Enter URL manually"** (ou similar)
3. Digite: `exp://10.102.0.103:8081`
4. Toque em **"Connect"**

### No App Customizado (expo-dev-client):

1. Abra o app customizado
2. Procure por **"Enter URL"** ou **"Connect to Dev Server"**
3. Digite: `exp://10.102.0.103:8081`
4. Toque em **"Connect"**

## 🔧 Tentar Corrigir Novamente

### Passo 1: Executar Script Completo

```bash
cd /home/darley/lacos
./FORCAR_IP_METRO.sh
```

Este script:
- ✅ Modifica metro.config.js para forçar IP
- ✅ Limpa todo cache
- ✅ Passa todas as variáveis de ambiente possíveis
- ✅ Usa `--lan --host 10.102.0.103`

### Passo 2: Verificar o Que Está Acontecendo

```bash
cd /home/darley/lacos
./VERIFICAR_QRCODE.sh
```

Este script mostra:
- Se o Expo está rodando
- Quais variáveis de ambiente estão configuradas
- Se o metro.config.js está correto

### Passo 3: Verificar no Terminal

Após executar `./FORCAR_IP_METRO.sh`, verifique no terminal:

1. **Procure por esta linha:**
   ```
   📱 Metro configurado para usar IP: 10.102.0.103:8081
   ```
   Se aparecer, o metro.config.js está sendo carregado.

2. **Procure pela URL do Metro:**
   ```
   › Metro waiting on exp://10.102.0.103:8081
   ```
   Se aparecer `localhost`, o problema persiste.

3. **Verifique o QR code:**
   - Abra `http://localhost:8081` no navegador
   - Veja qual URL está no QR code
   - Se ainda mostrar `localhost`, o problema é no Expo CLI

## 🎯 Solução Definitiva: Modificar Expo CLI

Se nada funcionar, pode ser necessário modificar como o Expo CLI gera o QR code. Isso pode ser um bug conhecido do Expo.

### Verificar Versão do Expo

```bash
npx expo --version
```

### Atualizar Expo

```bash
npm install -g expo-cli@latest
npm install expo@latest
```

### Usar Tunnel Mode (Último Recurso)

Se o LAN não funcionar, use tunnel:

```bash
cd /home/darley/lacos
pkill -f "expo start"
rm -rf .expo node_modules/.cache
npx expo start --tunnel --clear
```

O tunnel cria uma URL `exp.direct` que funciona de qualquer lugar, mas pode ser mais lento.

## 📝 Resumo

1. **Solução Imediata**: Use URL manual `exp://10.102.0.103:8081` no Expo Go
2. **Tentar Corrigir**: Execute `./FORCAR_IP_METRO.sh` e verifique logs
3. **Verificar**: Execute `./VERIFICAR_QRCODE.sh` para diagnóstico
4. **Último Recurso**: Use `--tunnel` mode

## 🔍 Debug

Se quiser investigar mais, execute:

```bash
cd /home/darley/lacos

# Ver processos Expo
ps aux | grep expo

# Ver porta 8081
lsof -i :8081

# Ver variáveis de ambiente
env | grep -E "HOST|EXPO|PACKAGER"

# Ver logs do Metro
tail -f ~/.expo/metro-*.log 2>/dev/null || echo "Logs não encontrados"
```

