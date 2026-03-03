# 🌐 Como Iniciar o Expo Web Corretamente

## ✅ Solução para o Erro "Cannot find module"

O erro ocorria porque o script estava tentando executar o arquivo no diretório errado.

### Opção 1: Usar o Script Corrigido (Recomendado)

```bash
cd /home/darley/lacos
./scripts/INICIAR_WEB_IP.sh
```

### Opção 2: Iniciar Diretamente com Expo

```bash
cd /home/darley/lacos
npm run web
```

Ou:

```bash
cd /home/darley/lacos
npx expo start --web
```

### Opção 3: Iniciar com IP Específico

```bash
cd /home/darley/lacos
node scripts/start-web-forcado-ip.js
```

## 📋 Comandos Disponíveis

### Web Simples (localhost)
```bash
npm run web
```

### Web com IP (acessível de outros dispositivos)
```bash
./scripts/INICIAR_WEB_IP.sh
```

### Web com IP Corrigido
```bash
npm run web:ip
```

## 🔍 Verificar se Está Funcionando

Após iniciar, você verá algo como:
```
Metro waiting on exp://192.168.0.20:8081
```

Acesse no navegador:
- **Local**: http://localhost:8081
- **Rede**: http://192.168.0.20:8081

## ⚠️ Problemas Comuns

### Erro: "Cannot find module"
- **Solução**: Certifique-se de estar no diretório `/home/darley/lacos`
- Execute: `cd /home/darley/lacos` antes de rodar os comandos

### Porta já em uso
- **Solução**: Pare processos antigos:
  ```bash
  pkill -f "expo start"
  ```

### Não acessa de outros dispositivos
- **Solução**: Use o script `INICIAR_WEB_IP.sh` que força o IP 0.0.0.0















