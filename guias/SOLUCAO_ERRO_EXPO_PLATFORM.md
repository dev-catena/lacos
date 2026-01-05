# 🔧 Solução: "Must Specify Expo platform header" Error

## ❌ Problema

Erro ao conectar Android ao Expo:
```
CommandError: Must Specify "Expo platform" header or "platform" query parameter
```

## 🔍 Causa

O Metro bundler exige que todas as requisições do Expo Go incluam:
- Header HTTP: `Expo-Platform: android` (ou `ios`)
- OU parâmetro na URL: `?platform=android`

Quando o Expo Go faz requisições sem esse header/parâmetro, o Metro rejeita.

---

## ✅ Solução Aplicada

O `metro.config.js` foi atualizado para **adicionar automaticamente** o header `Expo-Platform` quando ele não existe:

```javascript
// CORREÇÃO: Adicionar header Expo-Platform se não existir
if (!req.headers['expo-platform'] && !req.headers['Expo-Platform']) {
  // Detectar plataforma pelo User-Agent ou assumir Android
  const userAgent = req.headers['user-agent'] || '';
  let platform = 'android'; // Padrão
  
  if (userAgent.includes('iOS') || userAgent.includes('iPhone')) {
    platform = 'ios';
  }
  
  // Adicionar header
  req.headers['Expo-Platform'] = platform;
  req.headers['expo-platform'] = platform;
}

// Adicionar parâmetro platform na URL se não existir
if (req.url && !req.url.includes('platform=')) {
  const separator = req.url.includes('?') ? '&' : '?';
  const platform = req.headers['Expo-Platform'] || 'android';
  req.url = `${req.url}${separator}platform=${platform}`;
}
```

---

## 🔄 Como Aplicar

### 1. Reiniciar Expo

Pare o Expo atual (Ctrl+C) e inicie novamente:

```bash
npm start
```

### 2. Tentar Conectar Android

1. Abra Expo Go no celular
2. Escaneie o QR code
3. O erro não deve mais aparecer

---

## 🔍 Verificação

Se ainda der erro, verifique nos logs do Metro:

```
📱 Header Expo-Platform adicionado: android
📱 Parâmetro platform adicionado na URL: android
```

Se essas mensagens aparecerem, o middleware está funcionando.

---

## ⚠️ Notas

- O middleware detecta automaticamente a plataforma pelo User-Agent
- Se não conseguir detectar, assume `android` como padrão
- O header é adicionado **antes** da requisição chegar ao Metro
- Funciona para Android e iOS

---

**Última atualização:** 2025-01-24













