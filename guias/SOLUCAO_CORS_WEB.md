# 🔧 Solução: Problemas de Conexão com Backend no Web

## ❌ Problema

Dificuldade de conexão com backend ao desenvolver no web.

## 🔍 Diagnóstico

Execute primeiro:

```bash
./VERIFICAR_BACKEND.sh
```

Isso vai verificar:
- ✅ Se backend está acessível
- ✅ Se CORS está configurado
- ✅ Se há problemas de rede

## ✅ Soluções

### Solução 1: Verificar Backend

```bash
./VERIFICAR_BACKEND.sh
```

### Solução 2: Configurar CORS no Backend

O backend precisa permitir requisições do Expo Web. O Expo Web geralmente roda em:
- `http://localhost:8081`
- `http://localhost:19006`
- `http://127.0.0.1:8081`

**No servidor backend, adicione ao `config/cors.php`:**

```php
'allowed_origins' => [
    'http://localhost:8081',
    'http://localhost:19006',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:19006',
    'http://10.102.0.103:8081',  // Seu IP local
    // ... outros
],
```

### Solução 3: Usar Proxy no Desenvolvimento

Se CORS continuar sendo problema, use proxy:

**Criar `web/vite.config.js` ou ajustar configuração do Expo:**

```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://193.203.182.22',
        changeOrigin: true,
      }
    }
  }
}
```

### Solução 4: Verificar Console do Navegador

1. Abra DevTools (F12)
2. Vá em Network
3. Tente fazer uma requisição
4. Veja o erro específico:
   - CORS error?
   - Timeout?
   - 404?
   - 500?

## 🎯 Solução Rápida

### Se Backend Está Offline

Use variável de ambiente para desenvolvimento local:

```javascript
// web/src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://193.203.182.22/api';
```

E criar `.env`:

```
REACT_APP_API_URL=http://localhost:8000/api
```

### Se CORS Está Bloqueando

**Opção A:** Configurar CORS no backend (recomendado)

**Opção B:** Usar extensão do navegador para desenvolvimento (temporário):
- CORS Unblock (Chrome)
- CORS Everywhere (Firefox)

## 📋 Checklist

- [ ] Backend está acessível? (`./VERIFICAR_BACKEND.sh`)
- [ ] CORS está configurado? (verificar `config/cors.php`)
- [ ] URL da API está correta? (verificar console do navegador)
- [ ] Firewall não está bloqueando? (verificar servidor)
- [ ] Backend está rodando? (verificar servidor)

## 🚀 Próximos Passos

1. Execute: `./VERIFICAR_BACKEND.sh`
2. Veja o resultado
3. Siga as recomendações específicas

