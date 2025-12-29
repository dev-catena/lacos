# ✅ Solução: QR Code com IP Correto

## 🎯 Problema Resolvido

O QR code estava gerando `localhost:8081` (que não funciona no celular), mas o IP correto é `10.102.0.103`.

## ✅ Solução Aplicada

### 1. Script Atualizado

O arquivo `INICIAR_EXPO_FIX.sh` foi atualizado para:
- ✅ Usar modo `--lan` (ao invés de `--tunnel`)
- ✅ Forçar IP `10.102.0.103` com `--host`
- ✅ Forçar porta `8081` com `--port`
- ✅ Detectar automaticamente se usa `expo-dev-client` ou Expo Go

### 2. Package.json Atualizado

Os scripts `start` e `start:lan` agora usam o IP correto por padrão:

```json
"start": "expo start --lan --host 10.102.0.103 --port 8081",
"start:lan": "expo start --lan --host 10.102.0.103 --port 8081"
```

## 🚀 Como Usar

### Opção 1: Script (Recomendado)

```bash
cd /home/darley/lacos
./INICIAR_EXPO_FIX.sh
```

### Opção 2: NPM Script

```bash
cd /home/darley/lacos
npm start
```

ou

```bash
npm run start:lan
```

### Opção 3: Comando Direto

```bash
cd /home/darley/lacos
npx expo start --lan --host 10.102.0.103 --port 8081 --clear
```

## 📱 O Que Deve Aparecer

Após iniciar, o terminal deve mostrar:

```
› Metro waiting on exp://10.102.0.103:8081
```

E o QR code deve conter: `exp://10.102.0.103:8081`

## ✅ Verificação

1. Execute o script ou comando acima
2. Verifique no terminal que aparece `exp://10.102.0.103:8081`
3. Escaneie o QR code com Expo Go
4. O app deve conectar automaticamente!

## 🔍 Se Ainda Não Funcionar

### Verificar IP da Máquina

```bash
hostname -I
```

Deve mostrar `10.102.0.103` (ou outro IP da sua rede local).

### Se o IP Mudar

Se o IP da sua máquina mudar, atualize:

1. **No script** `INICIAR_EXPO_FIX.sh`: linha com `EXPO_IP="10.102.0.103"`
2. **No package.json**: scripts `start` e `start:lan`

### Testar Conexão Manual

No Expo Go, você pode digitar manualmente:
```
exp://10.102.0.103:8081
```

Se funcionar manualmente, o problema é só o QR code (que agora está corrigido).

## 📝 Notas Importantes

- ✅ Certifique-se que celular e computador estão na **mesma rede Wi-Fi**
- ✅ O IP `10.102.0.103` é o IP local da sua máquina na rede
- ✅ Não use `localhost` ou `127.0.0.1` no celular (não funciona)
- ✅ Use sempre o IP da rede local (`10.102.0.103`)

