# 🚀 Como Usar Expo Go com IP Fixo

## ⚠️ IMPORTANTE

Este script **GARANTE** que o QR code sempre mostra:
```
exp://192.168.0.20:8081
```

**NUNCA, NUNCA, NUNCA usa localhost!**

---

## 📱 Como Iniciar

### Opção 1: Usando npm (Recomendado)

```bash
cd /home/darley/lacos
npm start
```

### Opção 2: Usando o script shell

```bash
cd /home/darley/lacos
./scripts/INICIAR_EXPO_GO_IP_FIXO.sh
```

### Opção 3: Diretamente com Node.js

```bash
cd /home/darley/lacos
node start-expo-ip-forcado.js
```

---

## ✅ O Que o Script Faz

1. **Para processos antigos** - Garante que não há conflitos
2. **Libera a porta 8081** - Remove processos que possam estar usando
3. **Limpa cache** - Remove `.expo`, `node_modules/.cache`, `.metro`
4. **Configura IP fixo** - Força `192.168.0.20:8081`
5. **Bloqueia localhost** - Define variáveis para nunca usar localhost
6. **Inicia Expo Go** - Com todas as configurações corretas

---

## 🔍 Verificar se Está Funcionando

Quando o Expo iniciar, você deve ver no terminal:

```
📱 O QR CODE DEVE MOSTRAR:
   exp://192.168.0.20:8081
```

**Se aparecer `localhost` ou `127.0.0.1` em qualquer lugar, PARE e avise!**

---

## 📱 No Dispositivo

1. Abra o **Expo Go** no seu celular
2. Escaneie o QR code que aparece no terminal
3. O app deve carregar de `exp://192.168.0.20:8081`

---

## 🛠️ Troubleshooting

### Problema: QR code ainda mostra localhost

**Solução:**
1. Pare o Expo (Ctrl+C)
2. Execute: `rm -rf .expo`
3. Execute: `pkill -f "expo start"`
4. Execute: `pkill -f "metro"`
5. Inicie novamente com `npm start`

### Problema: Porta 8081 já está em uso

**Solução:**
```bash
lsof -ti :8081 | xargs kill -9
```

### Problema: App não carrega no dispositivo

**Verifique:**
1. Celular e computador estão na mesma rede Wi-Fi?
2. IP do computador é realmente `192.168.0.20`?
3. Firewall não está bloqueando a porta 8081?

---

## 🔧 Variáveis de Ambiente Configuradas

O script configura automaticamente:

- `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.20`
- `EXPO_PACKAGER_HOSTNAME=192.168.0.20`
- `EXPO_NO_LOCALHOST=1`
- `EXPO_USE_LOCALHOST=0`
- `RCT_METRO_PORT=8081`
- `PORT=8081`

---

## 📝 Notas

- Este script é **específico para Expo Go** (não dev-client)
- O IP `192.168.0.20` está **hardcoded** no script
- Se precisar mudar o IP, edite `start-expo-ip-forcado.js`
- O script sempre limpa cache antes de iniciar

---

**Última atualização:** 2025-01-24















