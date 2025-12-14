# 🗺️ Configuração do Google Maps API

Este guia explica como obter e configurar a API Key do Google Maps para usar o autocomplete de endereços.

---

## 📋 Passo a Passo

### 1️⃣ Criar Projeto no Google Cloud Console

1. Acesse: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Faça login com sua conta Google
3. Clique em **"Selecionar projeto"** no topo
4. Clique em **"Novo Projeto"**
5. Digite um nome: **"Laços App"**
6. Clique em **"Criar"**

---

### 2️⃣ Ativar a Places API

1. Com o projeto selecionado, vá em **"APIs e Serviços"** → **"Biblioteca"**
2. Busque por **"Places API"**
3. Clique em **"Places API"**
4. Clique em **"Ativar"**
5. Aguarde a ativação (pode levar alguns segundos)

---

### 3️⃣ Criar a API Key

1. Vá em **"APIs e Serviços"** → **"Credenciais"**
2. Clique em **"+ Criar Credenciais"**
3. Selecione **"Chave de API"**
4. Sua chave será criada e exibida
5. **COPIE A CHAVE** (algo como: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

---

### 4️⃣ (Recomendado) Restringir a API Key

⚠️ **Importante para segurança e evitar cobranças indevidas**

1. Na tela da chave criada, clique em **"Editar"**
2. Em **"Restrições de aplicativo"**, selecione:
   - Para desenvolvimento: **"Nenhuma"** (temporariamente)
   - Para produção: **"Apps Android"** + adicione o Package Name do app
3. Em **"Restrições de API"**, selecione **"Restringir chave"**
4. Marque apenas: **"Places API"**
5. Clique em **"Salvar"**

---

### 5️⃣ Configurar no Projeto

1. Abra o arquivo: `src/config/maps.js`
2. Substitua `'SUA_API_KEY_AQUI'` pela sua chave:

```javascript
const GOOGLE_MAPS_CONFIG = {
  API_KEY: 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // ← Cole sua chave aqui
  language: 'pt-BR',
  region: 'BR',
};
```

3. Salve o arquivo

---

### 6️⃣ Testar

1. Reinicie o Expo:
```bash
npx expo start --clear
```

2. Abra o app no seu dispositivo
3. Vá em: **Agenda** → **+ Novo Compromisso**
4. No campo **"Endereço"**, comece a digitar
5. Você deve ver sugestões de endereços aparecendo

---

## 💰 Sobre Custos

### Gratuito:
- **28.500 requisições grátis por mês** (US$ 200 em créditos)
- Para a maioria dos apps, isso é suficiente

### Pago:
- Depois de 28.500 requisições: **US$ 0,017 por requisição**
- Exemplo: 50.000 requisições = US$ 3,50/mês

### Como evitar custos:
1. ✅ Restrinja a API Key (passo 4)
2. ✅ Configure alertas de faturamento no Google Cloud
3. ✅ Use `debounce` no autocomplete (já configurado)
4. ✅ Monitore o uso no console do Google Cloud

---

## 🔧 Configurações Avançadas

### Restringir por Package Name (Android):

1. No Google Cloud Console → **Credenciais** → Editar sua chave
2. Em **"Restrições de aplicativo"**, escolha **"Apps Android"**
3. Clique em **"+ Adicionar um nome do pacote"**
4. Digite: `com.lacos.app` (package name do app Laços)
5. Para obter o SHA-1:
```bash
# Método 1: Via Expo
npx expo prebuild
cd android && ./gradlew signingReport

# Método 2: Via keytool
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```
6. Copie o SHA-1 e cole no Google Cloud Console
7. Salve

**Veja o guia completo:** `OBTER_SHA1.md`

### Adicionar domínio web (se for publicar web):

1. Em **"Restrições de aplicativo"**, escolha **"Referenciadores HTTP"**
2. Adicione: `https://seudominio.com.br/*`

### Restringir por Bundle ID (iOS):

1. No Google Cloud Console → **Credenciais** → Editar sua chave
2. Em **"Restrições de aplicativo"**, escolha **"Apps iOS"**
3. Clique em **"+ Adicionar um identificador de pacote"**
4. Digite: `com.lacos.app` (bundle identifier do app Laços)
5. Salve

---

## 🐛 Solução de Problemas

### ❌ "This API project is not authorized to use this API"
**Solução**: Ative a Places API no passo 2

### ❌ "API key not valid"
**Solução**: 
- Verifique se copiou a chave correta
- Aguarde alguns minutos (pode levar até 5 min para ativar)
- Limpe o cache: `npx expo start --clear`

### ❌ "REQUEST_DENIED"
**Solução**:
- Verifique as restrições da chave
- Certifique-se que "Places API" está ativa
- Remova restrições temporariamente para testar

### ❌ Autocomplete não aparece
**Solução**:
1. Verifique se a API Key está correta em `src/config/maps.js`
2. Abra o console do navegador/terminal e veja os erros
3. Digite pelo menos 3 caracteres
4. Verifique sua conexão com internet

---

## 📚 Links Úteis

- [Google Cloud Console](https://console.cloud.google.com/)
- [Documentação Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Preços do Google Maps](https://cloud.google.com/maps-platform/pricing)
- [Gerenciar Faturamento](https://console.cloud.google.com/billing)

---

## ✅ Checklist

- [ ] Criar projeto no Google Cloud Console
- [ ] Ativar Places API
- [ ] Criar API Key
- [ ] Configurar restrições de segurança
- [ ] Adicionar a chave em `src/config/maps.js`
- [ ] Testar no app
- [ ] Configurar alertas de faturamento (opcional, mas recomendado)

---

**Dúvidas?** Consulte a documentação oficial do Google Maps Platform.

