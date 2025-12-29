# 🚀 Como Acessar a Aplicação

## Passo a Passo

### 1. Instalar Dependências (apenas na primeira vez)

```bash
cd web
npm install
```

### 2. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

### 3. Acessar no Navegador

A aplicação estará disponível em:

**http://localhost:3000**

O Vite abrirá automaticamente no navegador, ou você pode acessar manualmente.

## 📝 Comandos Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção na pasta `dist/`
- `npm run preview` - Visualiza o build de produção

## 🔧 Solução de Problemas

### Porta 3000 já está em uso?

Edite o arquivo `vite.config.js` e altere a porta:

```javascript
server: {
  port: 3001, // ou outra porta disponível
}
```

### Erro ao instalar dependências?

```bash
rm -rf node_modules package-lock.json
npm install
```

## 🌐 Acesso Remoto

Se você quiser acessar de outro dispositivo na mesma rede:

1. Descubra seu IP local:
   ```bash
   # Linux/Mac
   hostname -I
   # ou
   ip addr show
   ```

2. Acesse: `http://SEU_IP:3000`

Ou configure o Vite para aceitar conexões externas editando `vite.config.js`:

```javascript
server: {
  host: '0.0.0.0', // aceita conexões de qualquer IP
  port: 3000,
}
```

