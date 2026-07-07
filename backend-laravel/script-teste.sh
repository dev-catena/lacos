#!/usr/bin/env bash
#
# Deploy do painel web-admin (Vite/React) em /var/www/lacos/web-admin + Nginx + Let's Encrypt.
# Destino HTTPS: https://lacosapp.com (e www.lacosapp.com).
#
# (Há cópia idêntica em scripts/deploy-web-admin-nginx-ssl.sh na raiz do repositório.)
#
# Uso no servidor (Ubuntu/Debian, como root ou com sudo):
#   export CERTBOT_EMAIL="darley@lacosapp.com"
#   # opcional — API Laravel (host sem http/https; env.js monta http://HOST:PORT)
#   export VITE_BACKEND_HOST="gateway.lacosapp.com"
#   export VITE_BACKEND_PORT="8000"
#   sudo -E bash deploy-web-admin-nginx-ssl.sh
#
# Requisitos DNS (já no painel): @, www → IP do servidor (ex.: 193.203.182.22).
#
set -euo pipefail

WEB_ROOT="${WEB_ROOT:-/var/www/lacos/web-admin}"
NGINX_SITE="${NGINX_SITE:-lacosapp-web-admin}"
PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-lacosapp.com}"
WWW_HOST="www.${PRIMARY_DOMAIN}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Execute como root: sudo bash $0" >&2
  exit 1
fi

if [[ -z "${CERTBOT_EMAIL}" ]]; then
  echo "Defina o e-mail do Let's Encrypt, ex.:" >&2
  echo "  export CERTBOT_EMAIL='admin@lacosapp.com'" >&2
  echo "  sudo -E bash $0" >&2
  exit 1
fi

if [[ ! -d "${WEB_ROOT}" ]]; then
  echo "Pasta não encontrada: ${WEB_ROOT}" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx curl ca-certificates

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  apt-get install -y nodejs npm
fi

# Node mínimo razoável para Vite 5 (ajuste se precisar de versão mais nova via NodeSource/nvm)
NODE_MAJOR="$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1 || echo 0)"
if [[ "${NODE_MAJOR}" -lt 18 ]]; then
  echo "Aviso: Node < 18. Se o build falhar, instale Node 18+ (ex.: NodeSource) e rode o script de novo." >&2
fi

echo "=== npm install / build em ${WEB_ROOT} ==="
cd "${WEB_ROOT}"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi
npm run build

DIST="${WEB_ROOT}/dist"
if [[ ! -f "${DIST}/index.html" ]]; then
  echo "Build não gerou ${DIST}/index.html" >&2
  exit 1
fi

chown -R root:root "${DIST}"
chmod -R a+rX "${DIST}"

echo "=== Nginx (HTTP inicial — Certbot acrescenta SSL) ==="
SITE_PATH="/etc/nginx/sites-available/${NGINX_SITE}"
ENABLED="/etc/nginx/sites-enabled/${NGINX_SITE}"

cat >"${SITE_PATH}" <<NGINX
# SPA Vite — ${PRIMARY_DOMAIN}
# Gerado por deploy-web-admin-nginx-ssl.sh

server {
    listen 80;
    listen [::]:80;
    server_name ${PRIMARY_DOMAIN} ${WWW_HOST};

    root ${DIST};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|webp)\$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
NGINX

ln -sf "${SITE_PATH}" "${ENABLED}"

# Evitar conflito com default do Nginx em algumas instalações
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "=== Let's Encrypt (Certbot plugin Nginx) ==="
certbot --nginx \
  -d "${PRIMARY_DOMAIN}" \
  -d "${WWW_HOST}" \
  --non-interactive \
  --agree-tos \
  -m "${CERTBOT_EMAIL}" \
  --redirect

systemctl reload nginx

echo ""
echo "Pronto."
echo "  Site:    https://${PRIMARY_DOMAIN}"
echo "  Raiz:    ${DIST}"
echo ""
echo "Renovação do certificado é feita pelo timer do Certbot (systemctl list-timers | grep certbot)."
echo "Se a API estiver em outro host, defina VITE_BACKEND_HOST/VITE_BACKEND_PORT antes do build"

echo "e, se usar HTTPS na API, ajuste web-admin/src/config/env.js para usar https quando necessário."
