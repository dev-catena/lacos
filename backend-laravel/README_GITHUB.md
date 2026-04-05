# 🚪 Gateway Laços - Backend Laravel

Backend Laravel para o sistema Laços, servindo como gateway de API para o aplicativo mobile e web admin.

## 📋 Sobre

Este repositório contém a implementação completa do backend Laravel que serve como gateway de API para o sistema Laços. O gateway está configurado para responder em `https://gateway.lacosapp.com/api/`.

## 🏗️ Estrutura do Projeto

```
backend-laravel/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Api/
│   │           ├── GatewayController.php    # Endpoint de status do gateway
│   │           ├── AuthController.php       # Autenticação
│   │           ├── UserController.php       # Gerenciamento de usuários
│   │           └── ...
│   └── Services/
│       └── WhatsAppService.php
├── config/                                   # Configurações do Laravel
├── database/
│   └── migrations/                          # Migrations do banco de dados
├── routes/
│   ├── api.php                              # Rotas da API
│   └── channels.php                         # Rotas de broadcasting
├── resources/
│   └── views/
│       └── emails/                          # Templates de email
└── .gitignore
```

## 🚀 Endpoints Principais

### Gateway Status
```
GET /api/gateway/status
```
Retorna o status do gateway (público).

**Resposta:**
```json
{
  "status": "ativo"
}
```

### Autenticação
```
POST /api/login
POST /api/register
POST /api/logout
GET  /api/user
```

### Usuários
```
PUT  /api/users/{id}
POST /api/users/{id}/certificate
```

## 🔧 Instalação

### Pré-requisitos
- PHP >= 8.2
- Composer
- MySQL
- Nginx ou Apache

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/dev-catena/gateway-lacos-.git
cd gateway-lacos-
```

2. **Instale as dependências**
```bash
composer install
```

3. **Configure o ambiente**
```bash
cp .env.example .env
php artisan key:generate
```

4. **Configure o banco de dados**
Edite o arquivo `.env` com suas credenciais:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lacos
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
```

5. **Execute as migrations**
```bash
php artisan migrate
```

6. **Configure o storage**
```bash
php artisan storage:link
```

7. **Configure permissões**
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

## 🌐 Configuração do Gateway

O gateway está configurado para responder em `https://gateway.lacosapp.com/api/`.

### Nginx

A configuração do Nginx está disponível nos scripts de configuração:
- `CONFIGURAR_GATEWAY.sh`
- `CONFIGURAR_GATEWAY_MANUAL.sh`
- `CONFIGURAR_GATEWAY_CORRIGIDO.sh`

### SSL/HTTPS

O gateway utiliza certificados SSL do Let's Encrypt, configurados via Certbot.

## 🔐 Autenticação

O sistema utiliza Laravel Sanctum para autenticação via tokens Bearer.

**Exemplo de uso:**
```bash
curl -X GET https://gateway.lacosapp.com/api/user \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 📦 Dependências Principais

- Laravel 11
- Laravel Sanctum (Autenticação)
- MySQL (Banco de dados)

## 🧪 Testes

```bash
# Executar testes
php artisan test

# Verificar rotas
php artisan route:list
```

## 📝 Desenvolvimento

### Estrutura de Rotas

As rotas estão definidas em `routes/api.php`:

- **Rotas Públicas**: Login, registro, status do gateway
- **Rotas Autenticadas**: Requerem token Bearer válido

### Controllers

Todos os controllers da API estão em `app/Http/Controllers/Api/`.

### Models

Os models estão em `app/Models/` (se aplicável).

## 🚀 Deploy

### Script de Deploy

Use o script `DEPLOY_GITHUB.sh` para fazer deploy para o GitHub:

```bash
cd backend-laravel
./DEPLOY_GITHUB.sh
```

### Deploy Manual

```bash
git add .
git commit -m "feat: sua mensagem"
git push origin main
```

## 📚 Documentação Adicional

- [Laravel Documentation](https://laravel.com/docs)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 📞 Suporte

Para suporte, entre em contato através do repositório ou da equipe de desenvolvimento.

---

**Desenvolvido para Laços App** 🏥

