#!/usr/bin/env bash
#
# Proxy HTTPS /rtmp-agent/{host}/{port}/ → agente RTMP HTTP (porta 8000).
# Necessário para o app iOS obter secure-play-url e snapshots via HTTPS.
#
# Uso no gateway:
#   sudo bash /var/www/lacos/backend-laravel/scripts/add-rtmp-api-nginx-proxy.sh
#
set -euo pipefail

NGINX_SITE="${NGINX_SITE:-lacos-gateway}"
SITE_PATH="/etc/nginx/sites-available/${NGINX_SITE}"
MARKER="# RTMP API proxy (camera iOS HTTPS)"

if [[ ! -f "${SITE_PATH}" ]]; then
  echo "❌ Site nginx não encontrado: ${SITE_PATH}" >&2
  exit 1
fi

if grep -q "${MARKER}" "${SITE_PATH}"; then
  echo "✅ Proxy RTMP API já configurado em ${SITE_PATH}"
  exit 0
fi

TMP=$(mktemp)
awk -v marker="${MARKER}" '
  /location \/ \{/ && !done {
    print "    " marker
    print "    location ~ ^/rtmp-agent/(?<rtmp_host>[^/]+)/(?<rtmp_port>[0-9]+)/(?<rtmp_path>.*)$ {"
    print "        resolver 8.8.8.8 ipv6=off valid=30s;"
    print "        proxy_pass http://$rtmp_host:$rtmp_port/$rtmp_path$is_args$args;"
    print "        proxy_http_version 1.1;"
    print "        proxy_set_header Host $rtmp_host:$rtmp_port;"
    print "        proxy_set_header X-Real-IP $remote_addr;"
    print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
    print "        proxy_set_header X-Forwarded-Proto $scheme;"
    print "        proxy_read_timeout 60s;"
    print "        proxy_send_timeout 60s;"
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
echo "✅ Proxy RTMP API ativo:"
echo "   https://gateway.lacosapp.com/rtmp-agent/{host}/{port}/... → http://{host}:{port}/..."
echo ""
echo "Teste:"
echo "   curl -sI -u roboflex:yhvh77 'https://gateway.lacosapp.com/rtmp-agent/streaming.robohub.dev/8000/streams/secure-play-url/CAMERA_ID' | head -3"
