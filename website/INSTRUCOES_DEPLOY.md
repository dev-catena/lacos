# 🚀 Instruções de Deploy - Site LaçosApp

## Configuração Atual

O site está configurado para rodar em **produção** no servidor remoto:
- **Domínio**: `https://lacosapp.com`
- **Servidor**: `192.168.0.20:63022`
- **Usuário**: `darley`
- **Diretório no servidor**: `/var/www/lacos-website`

## ⚙️ Pré-requisitos

### No seu computador local:

1. **Instalar sshpass** (para autenticação SSH automática):
```bash
sudo apt install sshpass
```

2. **Verificar se está no diretório correto**:
```bash
cd /home/darley/lacos/website
```

## 🚀 Como Fazer Deploy

### Opção 1: Deploy Automático (Recomendado)

Execute o script de deploy que faz tudo automaticamente:

```bash
cd /home/darley/lacos/website
./DEPLOY_NGINX.sh
```

Este script irá:
1. ✅ Fazer build local da aplicação
2. ✅ Enviar arquivos para o servidor remoto via SSH
3. ✅ Configurar Nginx para servir o site
4. ✅ Configurar HTTPS (redireciona HTTP → HTTPS)
5. ✅ Recarregar Nginx

### Opção 2: Deploy Manual

Se preferir fazer manualmente:

```bash
# 1. Build local
npm run build

# 2. Enviar arquivos para o servidor (ajuste conforme necessário)
scp -P 63022 -r dist/* darley@192.168.0.20:/var/www/lacos-website/

# 3. Configurar Nginx no servidor (veja configuração abaixo)
```

## 🔍 Verificar Deploy

Para verificar o status do deploy:

```bash
./VERIFICAR_DEPLOY.sh
```

Este script verifica:
- ✅ Conexão com o servidor
- ✅ Arquivos no servidor
- ✅ Configuração do Nginx
- ✅ Status do serviço Nginx

## 📋 Configuração do Nginx

O script `DEPLOY_NGINX.sh` cria automaticamente a configuração do Nginx. Se precisar fazer manualmente:

**Arquivo**: `/etc/nginx/sites-available/lacosapp.com`

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

## 🔒 Certificados SSL

Se os certificados SSL não estiverem configurados, você pode usar Let's Encrypt:

```bash
# No servidor remoto
sudo certbot --nginx -d lacosapp.com -d www.lacosapp.com
```

## 🐛 Troubleshooting

### Erro: "sshpass: command not found"
```bash
sudo apt install sshpass
```

### Erro: "Permission denied"
Verifique se você tem permissão para acessar o servidor via SSH.

### Erro: "Nginx configuration test failed"
Verifique os logs:
```bash
ssh -p 63022 darley@192.168.0.20 'sudo nginx -t'
```

### Site não carrega
1. Verifique se o Nginx está rodando:
```bash
ssh -p 63022 darley@192.168.0.20 'sudo systemctl status nginx'
```

2. Verifique os logs:
```bash
ssh -p 63022 darley@192.168.0.20 'sudo tail -f /var/log/nginx/lacosapp-error.log'
```

3. Verifique se os arquivos estão no lugar certo:
```bash
ssh -p 63022 darley@192.168.0.20 'sudo ls -la /var/www/lacos-website'
```

## 📝 Notas Importantes

1. **API Backend**: O site está configurado para se conectar automaticamente ao backend:
   - Em produção (lacosapp.com): `https://gateway.lacosapp.com/api`
   - Em desenvolvimento: `http://192.168.0.20/api`

2. **Build de Produção**: O build otimiza os arquivos para produção (minificação, tree-shaking, etc.)

3. **Cache**: Arquivos estáticos (JS, CSS, imagens) são cacheados por 1 ano para melhor performance.

4. **SPA Routing**: Todas as rotas são redirecionadas para `index.html` para funcionar como SPA (Single Page Application).

## ✅ Checklist de Deploy

- [ ] `sshpass` instalado localmente
- [ ] Acesso SSH ao servidor funcionando
- [ ] Build local executado com sucesso
- [ ] Arquivos enviados para o servidor
- [ ] Nginx configurado e testado
- [ ] Certificados SSL configurados (se HTTPS)
- [ ] Site acessível em https://lacosapp.com
- [ ] API backend acessível e funcionando


