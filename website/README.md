# Site Público LaçosApp

Site institucional e marketing do LaçosApp, desenvolvido com React e Vite.

## 🚀 Funcionalidades

- **Página Inicial**: Apresentação do app com seções Hero, Como Funciona, Funcionalidades e Benefícios
- **Página de Fornecedor**: Informações sobre como se tornar fornecedor
- **Autenticação**: Login, Cadastro e Recuperação de Senha
- **Design Responsivo**: Adaptado para desktop, tablet e mobile
- **Menu Lateral**: Navegação acessível com "Quero ser Fornecedor" como primeiro item

## 📋 Pré-requisitos

- Node.js 16+ 
- npm ou yarn

## 🛠️ Instalação

```bash
cd website
npm install
```

## 🏃 Executar em Desenvolvimento

```bash
npm run dev
```

O site estará disponível em `http://localhost:3000`

## 🏗️ Build para Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`

## 📁 Estrutura do Projeto

```
website/
├── src/
│   ├── components/      # Componentes reutilizáveis (Header, Footer, Sidebar)
│   ├── pages/          # Páginas do site (HomePage, FornecedorPage, etc)
│   ├── services/       # Serviços (authService)
│   ├── config/         # Configurações (API)
│   ├── App.jsx         # Componente principal
│   ├── App.css         # Estilos globais
│   ├── main.jsx        # Ponto de entrada
│   └── index.css       # Estilos base
├── public/             # Arquivos estáticos (logo, etc)
├── index.html          # HTML principal
├── vite.config.js      # Configuração do Vite
└── package.json        # Dependências
```

## 🔗 Integração com Backend

O site está configurado para se conectar ao backend Laravel:

- **Desenvolvimento**: `http://192.168.0.20/api`
- **Produção (HTTPS)**: `https://gateway.lacosapp.com/api`
- **Produção (HTTP)**: `http://192.168.0.20/api`

A configuração é automática baseada no hostname atual.

## 🎨 Design

O site utiliza uma paleta de cores suave e acolhedora:

- **Primária**: Azul (#4A90E2)
- **Secundária**: Verde (#50C878)
- **Texto**: Cinza escuro (#2C3E50)
- **Fundo**: Branco e tons claros

## 📱 Páginas

### HomePage (`/`)
- Seção Hero com chamada principal
- Como Funciona (4 passos)
- Funcionalidades em destaque
- Benefícios
- CTA final

### FornecedorPage (`/fornecedor`)
- Informações sobre ser fornecedor
- O que pode ser oferecido
- Processo de cadastro
- Benefícios
- Formulário de cadastro

### LoginPage (`/login`)
- Formulário de login
- Link para recuperação de senha
- Link para cadastro

### SignUpPage (`/cadastro`)
- Formulário de cadastro
- Suporte para cadastro de fornecedor (`?tipo=fornecedor`)
- Validação de senha

### ForgotPasswordPage (`/esqueci-senha`)
- Solicitação de recuperação de senha
- Confirmação de envio

## 🔐 Autenticação

O sistema de autenticação integra com o backend Laravel:

- **Login**: `POST /api/login`
- **Cadastro**: `POST /api/register`
- **Recuperação de Senha**: `POST /api/forgot-password` (a ser implementado no backend)

Tokens são armazenados em `localStorage` com as chaves:
- `@lacos:token`
- `@lacos:user`

## 📝 Notas

- O endpoint de recuperação de senha (`/api/forgot-password`) precisa ser implementado no backend se ainda não existir
- Os logos (`lacos.svg` e `lacos-ico.svg`) devem estar na pasta `public/`
- O site é totalmente responsivo e otimizado para SEO

## 🚀 Deploy

### Deploy Automático para o Servidor Remoto

O site está configurado para fazer deploy automático no servidor remoto (192.168.0.20):

```bash
cd website
./DEPLOY_NGINX.sh
```

Este script irá:
1. Fazer build local da aplicação
2. Enviar os arquivos para o servidor remoto via SSH
3. Configurar o Nginx para servir o site em `https://lacosapp.com`
4. Configurar redirecionamento HTTP → HTTPS
5. Configurar SSL/TLS (requer certificados Let's Encrypt)

**Requisitos:**
- `sshpass` instalado: `sudo apt install sshpass`
- Acesso SSH ao servidor (192.168.0.20:63022)
- Certificados SSL configurados no servidor (ou o script tentará usar Let's Encrypt)

### Deploy Manual

Se preferir fazer deploy manual:

1. Execute `npm run build`
2. Os arquivos na pasta `dist/` podem ser servidos por qualquer servidor web estático
3. Configure o servidor para servir `index.html` para todas as rotas (SPA)

### Configuração Nginx (Manual)

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name lacosapp.com www.lacosapp.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name lacosapp.com www.lacosapp.com;
    
    root /var/www/lacos-website;
    index index.html;
    
    ssl_certificate /etc/letsencrypt/live/lacosapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lacosapp.com/privkey.pem;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### crescentar dispositivo Apple


```bash
   cd /home/darley/lacos
   eas device:create
```


### Fazer build

```bash

eas build --platform ios --profile preview

```

### Atualizar sem fazer build


```bash

eas update --channel preview --message "Correção do campo detalhes de formação"
```
