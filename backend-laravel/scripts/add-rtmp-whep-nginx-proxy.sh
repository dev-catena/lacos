#!/usr/bin/env bash
#
# Adiciona proxy HTTPS /rtmp-whep/ → MediaMTX WHEP (177.104.165.210:8890)
# Necessário para playback de câmeras no iOS (ATS exige HTTPS).
#
# Uso no gateway:
#   sudo bash /var/www/lacos/backend-laravel/scripts/add-rtmp-whep-nginx-proxy.sh
#
set -euo pipefail

NGINX_SITE="${NGINX_SITE:-lacos-gateway}"
SITE_PATH="/etc/nginx/sites-available/${NGINX_SITE}"
WHEP_UPSTREAM="${WHEP_UPSTREAM:-http://177.104.165.210:8890}"
MARKER="# RTMP WHEP proxy (camera iOS ATS)"

if [[ ! -f "${SITE_PATH}" ]]; then
  echo "❌ Site nginx não encontrado: ${SITE_PATH}" >&2
  exit 1
fi

if grep -q "${MARKER}" "${SITE_PATH}"; then
  echo "✅ Proxy WHEP já configurado em ${SITE_PATH}"
  exit 0
fi

TMP=$(mktemp)
awk -v marker="${MARKER}" -v upstream="${WHEP_UPSTREAM}" '
  /location \/ \{/ && !done {
    print "    " marker
    print "    location /rtmp-whep/ {"
    print "        proxy_pass " upstream "/;"
    print "        proxy_http_version 1.1;"
    print "        proxy_set_header Host $host;"
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
echo "✅ Proxy WHEP ativo: https://gateway.lacosapp.com/rtmp-whep/ → ${WHEP_UPSTREAM}"
echo "   Teste: curl -sI https://gateway.lacosapp.com/rtmp-whep/ | head -3"
