# 📱 Como Adicionar Nova Instância no Evolution API (Mesmo Container)

## ✅ Resposta Rápida

**Você pode usar o mesmo container!** O Evolution API suporta múltiplas instâncias no mesmo container. Cada instância é como um "WhatsApp conectado" separado.

---

## 🎯 Opção 1: Usar Mesmo Container (Recomendado)

### Vantagens:
- ✅ Mais eficiente (um único container)
- ✅ Compartilha recursos (banco de dados, Redis, etc.)
- ✅ Mais fácil de gerenciar
- ✅ Menos consumo de recursos

### Como Fazer:

#### 1. Criar Nova Instância via API

```bash
# No servidor onde está o Evolution API
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: SUA_API_KEY_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "nome-do-seu-projeto",
    "token": "TOKEN_OPCIONAL_SE_QUISER",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

**Resposta:**
```json
{
  "instance": {
    "instanceName": "nome-do-seu-projeto",
    "status": "created"
  },
  "qrcode": {
    "code": "data:image/png;base64,...",
    "base64": "..."
  }
}
```

#### 2. Escanear QR Code

- Abra a resposta JSON e copie o `qrcode.base64`
- Converta para imagem ou use diretamente no frontend
- Escaneie com o WhatsApp que você quer usar para esse projeto

#### 3. Configurar no Seu Novo Projeto

No `.env` do seu novo projeto Laravel:

```env
WHATSAPP_API_URL=http://IP_DO_SERVIDOR:8080
WHATSAPP_API_KEY=SUA_API_KEY_AQUI
WHATSAPP_INSTANCE_NAME=nome-do-seu-projeto
```

**Importante:** Se o novo projeto estiver em outro servidor, use o IP público do servidor onde está o Evolution API, não `localhost`.

---

## 🎯 Opção 2: Criar Container Separado

### Quando Usar:
- Se quiser isolamento completo
- Se quiser diferentes versões do Evolution API
- Se quiser diferentes configurações de banco de dados

### Como Fazer:

#### 1. Criar Novo Container

```bash
# No servidor onde quer instalar
docker run -d \
  --name evolution-api-projeto2 \
  --restart unless-stopped \
  -p 8081:8080 \
  -e AUTHENTICATION_API_KEY=OUTRA_API_KEY_AQUI \
  -e DATABASE_ENABLED=true \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_CONNECTION_URI=postgresql://user:password@postgres:5432/evolution \
  atendai/evolution-api:latest
```

#### 2. Configurar no Projeto

```env
WHATSAPP_API_URL=http://IP_DO_SERVIDOR:8081
WHATSAPP_API_KEY=OUTRA_API_KEY_AQUI
WHATSAPP_INSTANCE_NAME=nome-da-instancia
```

---

## 📊 Comparação

| Aspecto | Mesmo Container | Container Separado |
|---------|----------------|-------------------|
| **Recursos** | Compartilhados | Isolados |
| **Gerenciamento** | Mais simples | Mais complexo |
| **Isolamento** | Parcial | Total |
| **Performance** | Melhor | Pode ser pior |
| **Custo** | Menor | Maior |

---

## 🔍 Verificar Instâncias Existentes

```bash
curl -H "apikey: SUA_API_KEY" \
  http://localhost:8080/instance/fetchInstances
```

**Resposta:**
```json
[
  {
    "instance": {
      "instanceName": "Lacos",
      "status": "open"
    }
  },
  {
    "instance": {
      "instanceName": "nome-do-seu-projeto",
      "status": "open"
    }
  }
]
```

---

## ⚠️ Importante

### 1. API Key
- A mesma API Key funciona para todas as instâncias no mesmo container
- Se criar container separado, pode usar API Key diferente

### 2. Acesso Remoto
Se o novo projeto estiver em outro servidor:

```env
# ❌ ERRADO (se estiver em outro servidor)
WHATSAPP_API_URL=http://localhost:8080

# ✅ CORRETO
WHATSAPP_API_URL=http://192.168.0.20:8080
```

### 3. Firewall
Certifique-se de que a porta 8080 (ou 8081) está aberta no firewall do servidor onde está o Evolution API.

---

## 🚀 Exemplo Prático

### Cenário: Projeto de Aniversários

1. **Criar instância no mesmo container:**
```bash
curl -X POST http://192.168.0.20:8080/instance/create \
  -H "apikey: 34385147c5995b4098452a02ad86cd771b5d1dc5761198a48df5a9baecbc30f7" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "aniversarios",
    "qrcode": true
  }'
```

2. **Configurar no projeto de aniversários:**
```env
WHATSAPP_API_URL=http://192.168.0.20:8080
WHATSAPP_API_KEY=34385147c5995b4098452a02ad86cd771b5d1dc5761198a48df5a9baecbc30f7
WHATSAPP_INSTANCE_NAME=aniversarios
```

3. **Pronto!** Agora você tem:
   - Instância "Lacos" para o projeto Laços
   - Instância "aniversarios" para o projeto de aniversários
   - Ambas no mesmo container Evolution API

---

## 📝 Resumo

✅ **Recomendação:** Use o mesmo container e crie uma nova instância  
✅ **Vantagem:** Mais eficiente e fácil de gerenciar  
✅ **Cada instância:** É um WhatsApp separado, pode usar números diferentes  
✅ **API Key:** A mesma funciona para todas as instâncias no container  

---

## 🔗 Referências

- [Evolution API Docs](https://doc.evolution-api.com/)
- [Evolution API GitHub](https://github.com/EvolutionAPI/evolution-api)

