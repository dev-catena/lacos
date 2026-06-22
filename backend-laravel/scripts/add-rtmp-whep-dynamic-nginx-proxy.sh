#!/usr/bin/env bash
#
# Proxy HTTPS /rtmp-whep-proxy/{host}/{port}/ → WHEP HTTP do agente (porta 8890).
# Complementa o /rtmp-whep/ estático (upstream fixo legado).
#
# Uso no gateway:
#   sudo bash /var/www/lacos/backend-laravel/scripts/add-rtmp-whep-dynamic-nginx-proxy.sh
#
set -euo pipefail

NGINX_SITE="${NGINX_SITE:-lacos-gateway}"
SITE_PATH="/etc/nginx/sites-available/${NGINX_SITE}"
MARKER="# RTMP WHEP dynamic proxy (camera iOS HTTPS)"

if [[ ! -f "${SITE_PATH}" ]]; then
  echo "❌ Site nginx não encontrado: ${SITE_PATH}" >&2
  exit 1
fi

if grep -q "${MARKER}" "${SITE_PATH}"; then
  echo "✅ Proxy WHEP dinâmico já configurado em ${SITE_PATH}"
  exit 0
fi

TMP=$(mktemp)
awk -v marker="${MARKER}" '
  /location \/ \{/ && !done {
    print "    " marker
    print "    location ~ ^/rtmp-whep-proxy/(?<whep_host>[^/]+)/(?<whep_port>[0-9]+)/(?<whep_path>.*)$ {"
    print "        resolver 8.8.8.8 ipv6=off valid=30s;"
    print "        proxy_pass http://$whep_host:$whep_port/$whep_path$is_args$args;"
    print "        proxy_http_version 1.1;"
    print "        proxy_set_header Host $whep_host:$whep_port;"
    print "        proxy_set_header X-Real-IP $remote_addr;"
    print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
    print "        proxy_set_header X-Forwarded-Proto $scheme;"
    print "        proxy_read_timeout 300s;"
    print "        proxy_send_timeout 300s;"
    print "    }"
    print ""
    done=1
  }
  { print }
' "${SITE_PATH}" > "${TMP}"

mv "${TMP}" "${SITE_PATH}"
nginx -t
systemctl reload nginx

echo ""
echo "✅ Proxy WHEP dinâmico ativo:"
echo "   https://gateway.lacosapp.com/rtmp-whep-proxy/{host}/{port}/... → http://{host}:{port}/..."
