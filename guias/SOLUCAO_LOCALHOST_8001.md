# 🔧 Solução: Erro "localhost:8001 - Site não encontrado"

## ❌ Problema

Tanto no iOS quanto no Android, aparece erro "Não é possível acessar este site" para `localhost:8001`.

## 🔍 Causa

O Expo usa a porta **8081** (não 8001) para o Metro bundler. O erro de `localhost:8001` pode indicar:
1. O servidor Expo não está rodando
2. A porta está incorreta
3. Há processo antigo usando a porta errada

## ✅ Solução Passo a Passo

### Passo 1: Limpar e Preparar

```bash
cd /home/darley/lacos
bash CORRIGIR_EXPO_LOCALHOST.sh
```

Isso vai:
- Parar processos antigos
- Limpar cache
- Liberar a porta 8081
- Mostrar seu IP local

### Passo 2: Iniciar Expo Corretamente

**Opção A: Tunnel Mode (Recomendado - Funciona sempre)**

```bash
npm run start:tunnel
```

**Opção B: LAN Mode (Mesma rede Wi-Fi)**

```bash
npm run start:lan
```

**Opção C: Normal com IP Manual**

```bash
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 npx expo start
```

Depois, no app:
- Expo Go → "Enter URL manually"
- Digite: `exp://SEU_IP:8081`
- Exemplo: `exp://192.168.1.100:8081`

### Passo 3: Verificar se Funcionou

No terminal, você deve ver:
```
Metro waiting on exp://...
```

E um QR code grande. **NÃO deve aparecer localhost:8001!**

## 🎯 Comandos Rápidos

```bash
# Limpar tudo e iniciar com tunnel
bash CORRIGIR_EXPO_LOCALHOST.sh && npm run start:tunnel

# Ou apenas iniciar com tunnel
npm run start:tunnel
```

## ⚠️ Se Ainda Não Funcionar

1. **Verificar se há processo na porta 8081:**
```bash
lsof -i :8081
```

2. **Matar processo se necessário:**
```bash
lsof -ti :8081 | xargs kill -9
```

3. **Verificar se o Expo está instalado:**
```bash
npx expo --version
```

4. **Reinstalar dependências (último recurso):**
```bash
rm -rf node_modules
npm install
```

## 📝 Nota Importante

- O Expo usa porta **8081** (não 8001)
- O erro de `localhost:8001` geralmente significa que o servidor não está rodando
- Use **tunnel mode** para garantir que funcione em qualquer rede
