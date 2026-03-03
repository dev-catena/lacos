# 🚀 Guia de Instalação - Gestão de Planos

## Pré-requisitos

- Node.js 16+ instalado
- npm ou yarn

## Passos para Instalação

### 1. Instalar Dependências

```bash
cd web
npm install
```

### 2. Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em: `http://localhost:3000`

### 3. Build para Produção

```bash
npm run build
```

Os arquivos compilados estarão na pasta `dist/`

## 📁 Estrutura do Projeto

```
web/
├── index.html              # HTML principal
├── package.json            # Dependências
├── vite.config.js          # Configuração do Vite
├── src/
│   ├── main.jsx           # Ponto de entrada
│   ├── App.jsx            # Componente principal
│   ├── App.css            # Estilos globais
│   ├── index.css          # Reset CSS
│   ├── components/
│   │   ├── PlansManagement.jsx    # Componente principal
│   │   ├── PlansManagement.css
│   │   ├── PlanCard.jsx           # Card de cada plano
│   │   └── PlanCard.css
│   └── services/
│       └── plansService.js        # Serviço de API
```

## 🔌 Configuração da API

A URL da API está configurada em `src/services/plansService.js`:

```javascript
const API_BASE_URL = 'http://192.168.0.20/api';
```

Para alterar, edite este arquivo.

## 🔐 Autenticação

A aplicação utiliza o token armazenado em `localStorage` com a chave `@lacos:token`.

Para testar sem autenticação, a aplicação funciona com dados padrão (fallback).

## 📝 Funcionalidades Implementadas

✅ Visualização dos 4 planos padrão
✅ Edição de funcionalidades por plano
✅ Interface responsiva
✅ Integração com API (com fallback)
✅ Validação e tratamento de erros
✅ Design moderno e intuitivo

## 🎨 Funcionalidades dos Planos

Cada plano pode ter as seguintes funcionalidades ativadas/desativadas:

- Grupo de cuidados
- Histórico
- Remédios
- Agenda
- Médicos
- Arquivos
- Mídias
- Sinais vitais
- Configurações

**Sempre disponíveis** (não configuráveis):
- Smartwatch
- Sensor de Quedas
- Câmeras

## 🐛 Troubleshooting

### Erro ao instalar dependências

```bash
rm -rf node_modules package-lock.json
npm install
```

### Porta 3000 já em uso

Edite `vite.config.js` e altere a porta:

```javascript
server: {
  port: 3001, // ou outra porta disponível
}
```

### Erro de CORS na API

Configure o backend Laravel para aceitar requisições do frontend:

```php
// config/cors.php
'allowed_origins' => ['http://localhost:3000'],
```

