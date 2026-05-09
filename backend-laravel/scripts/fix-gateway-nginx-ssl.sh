#!/usr/bin/env bash
#
# Corrige HTTPS para gateway.lacosapp.com:
# - Instala nginx, certbot, php-fpm; sobe PHP-FPM
# - Cria server Nginx apontando para o Laravel (public/)
# - Let's Encrypt (Certbot plugin nginx)
#
# (Cópia alinhada a scripts/fix-gateway-nginx-ssl.sh na raiz do repo.)
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

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx php-fpm

if [[ ! -f /etc/nginx/snippets/fastcgi-php.conf ]]; then
  echo "Falta /etc/nginx/snippets/fastcgi-php.conf (pacote nginx incompleto?)." >&2
  exit 1
fi

# Subir PHP-FPM (nome do serviço varia: php8.3-fpm, php8.2-fpm…)
_start_fpm() {
  local u
  for u in php8.3-fpm php8.2-fpm php8.1-fpm php-fpm; do
    if systemctl start "${u}" 2>/dev/null && systemctl is-active --quiet "${u}"; then
      systemctl enable "${u}" 2>/dev/null || true
      return 0
    fi
  done
  return 1
}
if ! _start_fpm; then
  echo "Aviso: não arranquei php*fpm automaticamente; verifique: systemctl status php8.3-fpm" >&2
fi
sleep 1

detect_php_sock() {
  local d s
  for d in /run/php /var/run/php; do
    s="$(ls -1 "${d}"/php*-fpm.sock 2>/dev/null | head -1 || true)"
    if [[ -n "${s}" && -S "${s}" ]]; then
      echo "${s}"
      return 0
    fi
  done
  return 1
}

PHP_SOCK="$(detect_php_sock || true)"
if [[ -z "${PHP_SOCK}" ]]; then
  echo "Nenhum socket PHP-FPM encontrado em /run/php ou /var/run/php." >&2
  echo "Instale manualmente, por exemplo:" >&2
  echo "  apt-get install -y php8.3-fpm && systemctl enable --now php8.3-fpm" >&2
  echo "Depois: ls -la /run/php/" >&2
  exit 1
fi

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
