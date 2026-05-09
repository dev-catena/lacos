#!/usr/bin/env bash
#
# Corrige HTTPS para gateway.lacosapp.com:
# - Cria server Nginx apontando para o Laravel (public/)
# - Instala certificado Let's Encrypt (Certbot plugin nginx)
#
# Requisitos no servidor: nginx, certbot python3-certbot-nginx, php-fpm, Laravel em disco.
#
# Uso:
#   export CERTBOT_EMAIL='admin@lacosapp.com'
#   sudo -E bash fix-gateway-nginx-ssl.sh
#
# Opcional:
#   export GATEWAY_HOST='gateway.lacosapp.com'
#   export LARAVEL_ROOT='/var/www/lacos/backend-laravel'
#
set -euo pipefail

GATEWAY_HOST="${GATEWAY_HOST:-gateway.lacosapp.com}"
LARAVEL_ROOT="${LARAVEL_ROOT:-/var/www/lacos/backend-laravel}"
NGINX_SITE="${NGINX_SITE:-lacos-gateway}"
PUBLIC_DIR="${LARAVEL_ROOT}/public"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Execute como root: sudo -E bash $0" >&2
  exit 1
fi

if [[ -z "${CERTBOT_EMAIL}" ]]; then
  echo "Defina: export CERTBOT_EMAIL='seu-email@dominio.com'" >&2
  exit 1
fi

if [[ ! -f "${PUBLIC_DIR}/index.php" ]]; then
  echo "Laravel public não encontrado: ${PUBLIC_DIR}" >&2
  echo "Ajuste LARAVEL_ROOT ou clone/monte o projeto." >&2
  exit 1
fi

PHP_SOCK="$(ls -1 /run/php/php*-fpm.sock 2>/dev/null | head -1 || true)"
if [[ -z "${PHP_SOCK}" ]]; then
  echo "Nenhum socket PHP-FPM em /run/php/php*-fpm.sock" >&2
  echo "Instale: apt-get install -y php-fpm (ou php8.3-fpm)" >&2
  exit 1
fi

if [[ ! -f /etc/nginx/snippets/fastcgi-php.conf ]]; then
  echo "Falta /etc/nginx/snippets/fastcgi-php.conf (instale nginx completo no Ubuntu)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx

# Permissões básicas para o PHP ler o projeto
if getent group www-data >/dev/null 2>&1; then
  chown -R root:www-data "${LARAVEL_ROOT}/storage" "${LARAVEL_ROOT}/bootstrap/cache" 2>/dev/null || true
  chmod -R ug+rX "${LARAVEL_ROOT}/storage" "${LARAVEL_ROOT}/bootstrap/cache" 2>/dev/null || true
fi

SITE_PATH="/etc/nginx/sites-available/${NGINX_SITE}"
ENABLED="/etc/nginx/sites-enabled/${NGINX_SITE}"

echo "=== Nginx: ${GATEWAY_HOST} → ${PUBLIC_DIR} ==="
echo "=== PHP-FPM socket: ${PHP_SOCK} ==="

cat >"${SITE_PATH}" <<NGINX
# API Laravel — ${GATEWAY_HOST}
# Gerado por fix-gateway-nginx-ssl.sh

server {
    listen 80;
    listen [::]:80;
    server_name ${GATEWAY_HOST};

    root ${PUBLIC_DIR};
    index index.php;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:${PHP_SOCK};
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
NGINX

ln -sf "${SITE_PATH}" "${ENABLED}"

nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "=== Let's Encrypt (nginx) — ${GATEWAY_HOST} ==="
certbot --nginx \
  -d "${GATEWAY_HOST}" \
  --non-interactive \
  --agree-tos \
  -m "${CERTBOT_EMAIL}" \
  --redirect

systemctl reload nginx

echo ""
echo "Teste:"
echo "  curl -sI https://${GATEWAY_HOST}/api/gateway/status | head -5"
echo ""
echo "Se já existir certificado multi-domínio (lacosapp.com) e quiser unificar, pode rodar depois:"
echo "  certbot certificates"
echo "  certbot install --cert-name lacosapp.com"
