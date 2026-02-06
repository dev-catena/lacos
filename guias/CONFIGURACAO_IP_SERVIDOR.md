# 🌐 Configuração do IP do Servidor Backend

## 📋 Visão Geral

Todas as referências ao IP do servidor backend foram centralizadas em arquivos de configuração. Para alterar o IP, edite apenas os arquivos de configuração abaixo.

## 🔧 Configuração por Projeto

### 1. **Backend Laravel** (`backend-laravel/`)

**Arquivo de configuração**: `backend-laravel/config/backend.php`

**Variáveis no `.env`**:
```env
APP_HOST=10.102.0.103
APP_PORT=8000
APP_URL=http://${APP_HOST}:${APP_PORT}
```

**Como usar no código PHP**:
```php
$baseUrl = config('backend.base_url');
// ou
$host = config('backend.host');
$port = config('backend.port');
```

**Para alterar o IP**: Edite `APP_HOST` no arquivo `backend-laravel/.env`

---

### 2. **App Mobile React Native** (`src/`)

**Arquivo de configuração**: `src/config/env.js`

**Valores padrão**:
```javascript
const BACKEND_HOST = '10.102.0.103';
const BACKEND_PORT = '8000';
```

**Como usar no código**:
```javascript
import { BACKEND_BASE_URL } from '../config/env';

const API_CONFIG = {
  BASE_URL: BACKEND_BASE_URL,
  // ...
};
```

**Para alterar o IP**: Edite `BACKEND_HOST` no arquivo `src/config/env.js`

---

### 3. **Website** (`website/`)

**Arquivo de configuração**: `website/src/config/env.js`

**Valores padrão**:
```javascript
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || '10.102.0.103';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8000';
```

**Como usar no código**:
```javascript
import { BACKEND_BASE_URL } from './config/env';

const API_BASE_URL = BACKEND_BASE_URL;
```

**Para alterar o IP**:
- **Opção 1**: Edite `BACKEND_HOST` no arquivo `website/src/config/env.js`
- **Opção 2**: Crie arquivo `.env` na raiz do projeto `website/`:
  ```env
  VITE_BACKEND_HOST=10.102.0.103
  VITE_BACKEND_PORT=8000
  ```

---

### 4. **Web Admin** (`web-admin/`)

**Arquivo de configuração**: `web-admin/src/config/env.js`

**Valores padrão**:
```javascript
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || '10.102.0.103';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8000';
```

**Como usar no código**:
```javascript
import { BACKEND_BASE_URL } from './config/env';

const API_BASE_URL = BACKEND_BASE_URL;
```

**Para alterar o IP**:
- **Opção 1**: Edite `BACKEND_HOST` no arquivo `web-admin/src/config/env.js`
- **Opção 2**: Crie arquivo `.env` na raiz do projeto `web-admin/`:
  ```env
  VITE_BACKEND_HOST=10.102.0.103
  VITE_BACKEND_PORT=8000
  ```

---

## 🚀 Alterar IP em Todos os Projetos

Para alterar o IP em todos os projetos de uma vez, execute:

```bash
# 1. Backend
sed -i 's/APP_HOST=.*/APP_HOST=NOVO_IP/' backend-laravel/.env

# 2. App Mobile
sed -i "s/const BACKEND_HOST = '.*'/const BACKEND_HOST = 'NOVO_IP'/" src/config/env.js

# 3. Website
sed -i "s/import.meta.env.VITE_BACKEND_HOST || '.*'/import.meta.env.VITE_BACKEND_HOST || 'NOVO_IP'/" website/src/config/env.js

# 4. Web Admin
sed -i "s/import.meta.env.VITE_BACKEND_HOST || '.*'/import.meta.env.VITE_BACKEND_HOST || 'NOVO_IP'/" web-admin/src/config/env.js
```

---

## 📝 Arquivos de Configuração Criados

1. ✅ `src/config/env.js` - App Mobile
2. ✅ `website/src/config/env.js` - Website
3. ✅ `web-admin/src/config/env.js` - Web Admin
4. ✅ `backend-laravel/config/backend.php` - Backend Laravel

---

## ✅ Arquivos Atualizados

1. ✅ `src/config/api.js` - Agora usa `env.js`
2. ✅ `website/src/config/api.js` - Agora usa `env.js`
3. ✅ `web-admin/src/config/api.js` - Agora usa `env.js`
4. ✅ `backend-laravel/app/Http/Controllers/Api/AdminDoctorController.php` - Agora usa `config('backend.base_url')`
5. ✅ `backend-laravel/AdminDoctorController.php` - Agora usa `config('backend.base_url')`

---

## 🔍 Verificar Configuração Atual

```bash
# Backend
grep "APP_HOST\|APP_PORT" backend-laravel/.env

# App Mobile
grep "BACKEND_HOST" src/config/env.js

# Website
grep "BACKEND_HOST" website/src/config/env.js

# Web Admin
grep "BACKEND_HOST" web-admin/src/config/env.js
```







