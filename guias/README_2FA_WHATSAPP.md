# 💬 Guia de Implementação: 2FA via WhatsApp com Evolution API

## ✅ O que foi implementado:

1. ✅ **WhatsAppService** - Serviço para enviar mensagens via Evolution API
2. ✅ **Migrations** - Campos de 2FA na tabela `users`
3. ✅ **Endpoints API** - Rotas para ativar/desativar/enviar/verificar código 2FA
4. ✅ **Frontend** - SecurityScreen atualizado (somente WhatsApp)
5. ✅ **Script de instalação** - Instalação automática da Evolution API

---

## 🚀 Passo a Passo de Instalação

### 1. Instalar Evolution API no Servidor

```bash
# No servidor
cd /var/www/lacos-backend
sudo bash INSTALAR_EVOLUTION_API_COM_POSTGRES.sh
```

O script irá:
- Verificar se Docker está instalado
- Criar PostgreSQL e Evolution API (Evolution API v2 **exige** banco de dados)
- Gerar API Key automaticamente
- Mostrar instruções para conectar WhatsApp

### 2. Conectar WhatsApp (Escanear QR Code)

Após instalar, você precisa conectar um número de WhatsApp:

```bash
# ✅ Recomendado: usar o script (evita “travamento” no terminal e já trata o campo `integration`)
export WHATSAPP_API_URL=http://localhost:8080
export WHATSAPP_API_KEY=SUA_API_KEY_AQUI
export WHATSAPP_INSTANCE_NAME=lacos-2fa
sudo -E bash /tmp/CRIAR_INSTANCIA_WHATSAPP.sh
```

Se o QR não aparecer no Manager, você pode usar **pairing code** (vincular por número), definindo:

```bash
export WHATSAPP_PAIRING_NUMBER=5531999999999   # somente números (55 + DDD + número)
sudo -E bash /tmp/CRIAR_INSTANCIA_WHATSAPP.sh
```

**Importante**: 
- Use um número de celular dedicado para WhatsApp Business
- Escaneie o QR Code com o WhatsApp que você quer usar
- O número ficará conectado permanentemente

### 3. Configurar .env do Laravel

Adicione ao `.env`:

```env
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_API_KEY=sua_api_key_gerada_pelo_script
WHATSAPP_INSTANCE_NAME=lacos-2fa
```

**Se Evolution API estiver em outro servidor**:
```env
WHATSAPP_API_URL=http://IP_DO_SERVIDOR:8080
```

### 4. Rodar Migration

```bash
cd /var/www/lacos-backend
php artisan migrate
```

Isso adicionará os campos de 2FA na tabela `users`.

### 5. Limpar Cache

```bash
php artisan config:clear
php artisan cache:clear
```

---

## 📱 Como Usar no App

1. **Acesse**: Perfil → Segurança → Autenticação de Dois Fatores
2. **Escolha**: WhatsApp (ou SMS/App Autenticador)
3. **Digite**: Número de telefone (formato: +55(00)00000-0000)
4. **Ative**: Clique em "Ativar Autenticação"
5. **Teste**: Quando fizer login, você receberá um código via WhatsApp

---

## 🔧 Estrutura de Arquivos Criados

### Backend:
- `app/Services/WhatsAppService.php` - Serviço de envio de mensagens
- `config/services.php` - Configurações do WhatsApp
- `database/migrations/2024_12_17_000001_add_two_factor_fields_to_users_table.php` - Migration
- `AuthController_CORRIGIDO.php` - Métodos de 2FA adicionados
- `routes_api_corrigido.php` - Rotas de 2FA adicionadas
- `INSTALAR_EVOLUTION_API.sh` - Script de instalação

### Frontend:
- `src/services/userService.js` - Métodos de 2FA adicionados
- `src/screens/Profile/SecurityScreen.js` - Interface atualizada

---

## 📊 Endpoints da API (WhatsApp)

### Ativar 2FA
```
POST /api/2fa/enable
Body: {
  "method": "whatsapp",
  "phone": "+5531999999999"
}
```

### Desativar 2FA
```
POST /api/2fa/disable
```

### Enviar Código
```
POST /api/2fa/send-code
```

### Verificar Código
```
POST /api/2fa/verify-code
Body: {
  "code": "123456"
}
```

### Fluxo de Login com 2FA (WhatsApp)
- **Login**: `POST /api/login` com `email` e `password`
  - Se o usuário tiver 2FA ativo, a API retorna `requires_2fa: true` (sem token) e envia o código via WhatsApp.
- **Concluir login**: `POST /api/2fa/login/verify`
  - Body:
    - `email`: email do usuário
    - `code`: código de 6 dígitos
  - Retorna `{ user, token }` para finalizar a sessão no app.

---

## 🧪 Testar

### 1. Testar Envio de Mensagem

```bash
# Via curl
curl -X POST http://localhost:8080/message/sendText/lacos-2fa \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5531999999999",
    "text": "Teste de mensagem"
  }'
```

### 2. Testar no App

1. Ative 2FA via WhatsApp no app
2. Faça logout
3. Faça login novamente
4. Você deve receber um código via WhatsApp

---

## ⚠️ Troubleshooting

### Erro: "Container não inicia"
- Verifique se a porta 8080 está livre: `netstat -tuln | grep 8080`
- Verifique logs: `docker logs evolution-api-lacos`

### Erro: "QR Code não aparece"
- Verifique se o container está rodando: `docker ps`
- Verifique logs: `docker logs -f evolution-api-lacos`

### Erro: "Mensagem não chega"
- Verifique se o WhatsApp está conectado: `curl http://localhost:8080/instance/fetchInstances -H "apikey: SUA_KEY"`
- Verifique logs do Laravel: `tail -f storage/logs/laravel.log`
- Verifique formato do número (deve ser: 5531999999999 sem +)

### Erro: "API não responde"
- Verifique se Evolution API está acessível: `curl http://localhost:8080/`
- Se estiver em outro servidor, verifique firewall
- Verifique se a URL no .env está correta

---

## 📝 Próximos Passos

1. ✅ Instalar Evolution API no servidor
2. ✅ Conectar número WhatsApp
3. ✅ Configurar .env
4. ✅ Rodar migration
5. ✅ Testar no app

---

## 🔐 Segurança

- **API Key**: Mantenha segura, não compartilhe
- **Número WhatsApp**: Use número dedicado, não pessoal
- **Firewall**: Bloqueie acesso externo à Evolution API (use apenas localhost)
- **HTTPS**: Em produção, use HTTPS para a Evolution API

---

**Última atualização**: 2025-12-17

