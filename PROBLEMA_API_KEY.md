# 🔓 Problema: API Key Bloqueada

## ❌ Erro Atual:

```
"This IP, site or mobile application is not authorized to use this API key"
Status: REQUEST_DENIED
```

---

## 🔍 Causa:

A API Key tem **restrições ativas** que estão bloqueando o uso no app.

---

## ✅ Solução Rápida (Para Desenvolvimento):

### **1. Acesse o Google Cloud Console:**
```
https://console.cloud.google.com/apis/credentials
```

### **2. Clique na sua API Key:**
```
AIzaSyBK7C7316fc5jZAcVFHe_wEdefuZ5fwGqk
```

### **3. Configure as Restrições:**

#### **📱 Restrições de Aplicativo:**
```
Antes: Apps Android / Apps iOS / Referenciadores HTTP
Depois: ✅ Nenhuma
```

#### **🔑 Restrições de API:**
```
✅ Manter: Places API
❌ Desmarcar: Outras APIs
```

### **4. Salvar:**
```
Clique no botão: SALVAR
Aguarde: 1-2 minutos para propagar
```

---

## 🧪 Testar se Funcionou:

### **Opção 1: Via Terminal**
```bash
cd /home/darley/lacos
./test-google-maps.sh
```

### **Opção 2: Via Navegador**
Abra este link no navegador:
```
https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Av%20Paulista&key=AIzaSyBK7C7316fc5jZAcVFHe_wEdefuZ5fwGqk&language=pt-BR
```

**Resultado esperado:**
```json
{
  "predictions": [
    {
      "description": "Avenida Paulista, São Paulo, SP, Brasil",
      ...
    }
  ],
  "status": "OK"
}
```

---

## 📱 Testar no App:

### **1. Reinicie o Expo:**
```bash
npx expo start --clear
```

### **2. Abra o App**

### **3. Vá para:**
```
Home → Grupo Pessoal (Teste) → Agenda → + Novo Compromisso
```

### **4. Campo "Endereço":**
- Digite: **"Av P"**
- Aguarde: **2-3 segundos**
- Veja: **Sugestões aparecendo! ✅**

---

## ⚠️ Se Ainda Não Funcionar:

### **Checklist:**

- [ ] API Key copiada corretamente em `src/config/maps.js`
- [ ] Restrições removidas no Google Cloud Console
- [ ] Aguardou 2 minutos após salvar
- [ ] App Expo reiniciado com `--clear`
- [ ] Places API está ATIVADA no Google Cloud
- [ ] Digitou pelo menos 3 caracteres no campo
- [ ] Internet funcionando no dispositivo

### **Verificar no Console do Expo:**

Procure por erros como:
```
❌ Google Places API error
❌ API key not valid
❌ This API project is not authorized
```

### **Solução de Problemas Comuns:**

| Erro | Solução |
|------|---------|
| "API key not valid" | Confira se copiou a chave completa |
| "This API project is not authorized" | Ative a Places API no Google Cloud |
| "REQUEST_DENIED" | Remova as restrições da API Key |
| "OVER_QUERY_LIMIT" | Aguarde alguns minutos (limite excedido) |
| Nenhuma sugestão aparece | Digite pelo menos 3 caracteres |

---

## 🔐 Para Produção (Depois):

Quando for publicar o app, você pode adicionar restrições:

### **Android:**
```
Restrições de aplicativo: Apps Android
Nome do pacote: com.lacos.app
SHA-1: (obter com: npx expo prebuild && cd android && ./gradlew signingReport)
```

### **iOS:**
```
Restrições de aplicativo: Apps iOS
Identificador de pacote: com.lacos.app
```

---

## 📞 Suporte:

- **Documentação Google Maps:** https://developers.google.com/maps/documentation/places/web-service/autocomplete
- **Console Google Cloud:** https://console.cloud.google.com/
- **Status da API:** https://status.cloud.google.com/

---

## ✅ Status Atual:

| Item | Status |
|------|--------|
| API Key configurada | ✅ |
| Places API ativada | ❓ (verificar) |
| Restrições removidas | ❌ (fazer agora) |
| App testado | ⏳ (aguardando) |

---

**Última atualização:** 23/11/2025

