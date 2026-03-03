# 🌐 Solução: Acesso de Outros Dispositivos

## ❌ Problema
A aplicação funciona localmente em `http://192.168.0.20:8081`, mas não é acessível de outros dispositivos na rede.

## ✅ Soluções

### 1. Verificar se está na mesma rede
- Certifique-se que todos os dispositivos estão na **mesma rede Wi-Fi**
- Verifique o IP do dispositivo que está tentando acessar:
  - Android: Configurações > Sobre o telefone > Status > Endereço IP
  - iOS: Configurações > Wi-Fi > (i) ao lado da rede > Endereço IP
  - Deve estar no mesmo range (ex: 10.102.0.x)

### 2. Testar conectividade
Execute no dispositivo que está tentando acessar:
```bash
# Android (via ADB ou terminal)
ping 192.168.0.20

# Ou teste no navegador do dispositivo
# Abra: http://192.168.0.20:8081
```

### 3. Verificar firewall do roteador
Alguns roteadores bloqueiam comunicação entre dispositivos na mesma rede. Verifique:
- Configurações do roteador
- "Isolamento de AP" ou "Client Isolation" deve estar **DESATIVADO**

### 4. Usar solução alternativa: ngrok (túnel público)
Se nada funcionar, use ngrok para criar um túnel público:

```bash
# Instalar ngrok
npm install -g ngrok

# Criar túnel
ngrok http 8081

# Usar a URL fornecida (ex: https://abc123.ngrok.io)
```

### 5. Usar servidor web direto (sem Expo CLI)
Se o Expo CLI não permitir acesso externo, inicie o servidor web diretamente:

```bash
cd web
npm run dev -- --host 0.0.0.0 --port 8081
```

## 🔍 Diagnóstico

Execute o script de teste:
```bash
./TESTAR_ACESSO_REDE.sh
```

Este script verifica:
- ✅ Se a porta está escutando
- ✅ Se está escutando em 0.0.0.0
- ✅ Se é acessível localmente
- ✅ Se é acessível por IP
- ✅ Status do firewall

## 📱 Teste Manual

1. **No computador (servidor)**:
   ```bash
   curl http://192.168.0.20:8081
   ```

2. **No dispositivo móvel**:
   - Abra navegador
   - Acesse: `http://192.168.0.20:8081`
   - Se não carregar, veja o erro no console do navegador

3. **Verificar logs do servidor**:
   - Veja se há requisições chegando
   - Verifique erros de CORS ou conexão

## 🚀 Solução Rápida

Se nada funcionar, use o script que força tudo:
```bash
./INICIAR_WEB_IP.sh
```

Este script:
- ✅ Força `HOST=0.0.0.0`
- ✅ Configura todas as variáveis de ambiente
- ✅ Usa `--lan` para detectar IP automaticamente
- ✅ Configura Webpack/Vite para escutar em 0.0.0.0

