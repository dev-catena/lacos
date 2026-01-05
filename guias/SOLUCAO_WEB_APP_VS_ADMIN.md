# 🔧 Solução: App Mobile vs Interface Admin no Web

## ❌ Problema

Quando você acessa `http://10.102.0.103:8081`, está vendo a **interface admin** ao invés do **app mobile Laços**.

## 🔍 Causa

O Expo detecta automaticamente a pasta `web/` e a usa como aplicação web. Como essa pasta contém a interface admin (`web/src/App.jsx`), o Expo serve ela ao invés do app mobile (`App.js`).

## ✅ Soluções

### Solução 1: Iniciar App Mobile no Web

Use o script que renomeia temporariamente a pasta `web/`:

```bash
./INICIAR_APP_MOBILE_WEB.sh
```

**O que faz:**
- ✅ Renomeia `web/` para `web-admin/` temporariamente
- ✅ Expo usa `App.js` (app mobile) ao invés da pasta web/
- ✅ Inicia servidor em `http://10.102.0.103:8081`
- ✅ Ao sair (Ctrl+C), restaura a pasta `web/`

### Solução 2: Iniciar Interface Admin no Web

Use o script que inicia o Vite diretamente da pasta `web/`:

```bash
./INICIAR_ADMIN_WEB.sh
```

**O que faz:**
- ✅ Restaura `web-admin/` para `web/` se necessário
- ✅ Inicia Vite diretamente da pasta `web/`
- ✅ Serve a interface admin em `http://10.102.0.103:8081`

## 📋 Resumo dos Scripts

| Script | O que inicia | URL |
|--------|--------------|-----|
| `./INICIAR_APP_MOBILE_WEB.sh` | **App Mobile** (App.js) | `http://10.102.0.103:8081` |
| `./INICIAR_ADMIN_WEB.sh` | **Interface Admin** (web/) | `http://10.102.0.103:8081` |
| `./INICIAR_WEB_IP.sh` | Interface Admin (via Expo) | `http://10.102.0.103:8081` |

## 🎯 Como Usar

### Para desenvolver o App Mobile:

```bash
./INICIAR_APP_MOBILE_WEB.sh
```

Acesse: `http://10.102.0.103:8081` → Verá o **app mobile Laços**

### Para usar a Interface Admin:

```bash
./INICIAR_ADMIN_WEB.sh
```

Acesse: `http://10.102.0.103:8081` → Verá a **interface admin**

## 🔄 Alternar Entre App e Admin

1. **Parar o servidor atual** (Ctrl+C)

2. **Para usar App Mobile:**
   ```bash
   ./INICIAR_APP_MOBILE_WEB.sh
   ```

3. **Para usar Admin:**
   ```bash
   ./INICIAR_ADMIN_WEB.sh
   ```

## 💡 Explicação Técnica

### Por que isso acontece?

O Expo tem esta lógica:
- Se existe pasta `web/` → Usa ela como aplicação web
- Se não existe pasta `web/` → Compila `App.js` para web

### Solução Implementada

1. **Para App Mobile:**
   - Renomeia `web/` → `web-admin/` temporariamente
   - Expo não encontra `web/`, então usa `App.js`
   - Ao sair, restaura `web/`

2. **Para Admin:**
   - Restaura `web/` se necessário
   - Inicia Vite diretamente da pasta `web/`
   - Bypassa o Expo completamente

## ⚠️ Notas Importantes

1. **Não execute ambos ao mesmo tempo** - Eles usam a mesma porta (8081)

2. **Ao parar o script do App Mobile**, a pasta `web/` é restaurada automaticamente

3. **Se precisar acessar admin enquanto app mobile está rodando:**
   - Pare o app mobile (Ctrl+C)
   - Execute `./INICIAR_ADMIN_WEB.sh`

4. **Se precisar acessar app mobile enquanto admin está rodando:**
   - Pare o admin (Ctrl+C)
   - Execute `./INICIAR_APP_MOBILE_WEB.sh`

## 🚀 Uso Recomendado

- **Desenvolvimento do app mobile:** `./INICIAR_APP_MOBILE_WEB.sh`
- **Gerenciamento/admin:** `./INICIAR_ADMIN_WEB.sh`
- **Testes em dispositivos:** Use o app mobile no web para testar UI

