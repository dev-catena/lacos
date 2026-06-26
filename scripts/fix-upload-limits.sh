#!/usr/bin/env bash
#
# Aumenta limites de upload no Nginx + PHP para mídias do app (até 150 MB vídeo / 50 MB foto).
#
# Uso no servidor de produção (gateway.lacosapp.com):
#   sudo bash fix-upload-limits.sh
#
set -euo pipefail

NGINX_LIMIT="${NGINX_LIMIT:-160M}"
PHP_UPLOAD="${PHP_UPLOAD:-160M}"
PHP_POST="${PHP_POST:-160M}"
PHP_EXEC_TIME="${PHP_EXEC_TIME:-600}"
PHP_INPUT_TIME="${PHP_INPUT_TIME:-600}"
PHP_MEMORY="${PHP_MEMORY:-512M}"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Execute como root: sudo bash $0" >&2
  exit 1
fi

echo "=== Limites: nginx=${NGINX_LIMIT}, PHP upload=${PHP_UPLOAD}, post=${PHP_POST} ==="

# --- Nginx: client_max_body_size em todos os sites ativos ---
NGINX_SNIPPET="/etc/nginx/conf.d/lacos-upload-limits.conf"
cat >"${NGINX_SNIPPET}" <<NGINX
# Laços — uploads de mídia (fotos/vídeos)
client_max_body_size ${NGINX_LIMIT};
client_body_timeout 600s;
NGINX
echo "✅ Snippet global: ${NGINX_SNIPPET}"

# Garantir fastcgi_read_timeout nos sites PHP
for site in /etc/nginx/sites-enabled/*; do
  [[ -f "${site}" ]] || continue
  if grep -q "client_max_body_size" "${site}"; then
    echo "   (já tem client_max_body_size: ${site})"
  else
    # Inserir após a linha server_name ou listen 443
    if grep -q "server_name" "${site}"; then
      sed -i "/server_name/a\\    client_max_body_size ${NGINX_LIMIT};\\n    client_body_timeout 600s;" "${site}" 2>/dev/null || true
    fi
  fi
  if grep -q "fastcgi_pass" "${site}" && ! grep -q "fastcgi_read_timeout" "${site}"; then
    sed -i '/fastcgi_pass/a\        fastcgi_read_timeout 600;' "${site}" 2>/dev/null || true
  fi
done

nginx -t
systemctl reload nginx
echo "✅ Nginx recarregado"

# --- PHP: php.ini (CLI + FPM) ---
patch_php_ini() {
  local ini="$1"
  [[ -f "${ini}" ]] || return 0
  echo "   Patch: ${ini}"
  for key in upload_max_filesize post_max_size max_execution_time max_input_time memory_limit; do
    sed -i "/^${key}\s*=/d" "${ini}" 2>/dev/null || true
    sed -i "/^;${key}\s*=/d" "${ini}" 2>/dev/null || true
  done
  cat >>"${ini}" <<PHP

; Laços — limites de upload (fix-upload-limits.sh)
upload_max_filesize = ${PHP_UPLOAD}
post_max_size = ${PHP_POST}
max_execution_time = ${PHP_EXEC_TIME}
max_input_time = ${PHP_INPUT_TIME}
memory_limit = ${PHP_MEMORY}
PHP
}

# php.ini principal
MAIN_INI="$(php -r 'echo PHP_CONFIG_FILE_PATH;' 2>/dev/null)/php.ini"
patch_php_ini "${MAIN_INI}"

# Pool FPM (sobrescreve php.ini se existir)
for pool in /etc/php/*/fpm/pool.d/www.conf; do
  [[ -f "${pool}" ]] || continue
  sed -i '/^php_admin_value\[upload_max_filesize\]/d' "${pool}" 2>/dev/null || true
  sed -i '/^php_admin_value\[post_max_size\]/d' "${pool}" 2>/dev/null || true
  sed -i '/^php_admin_value\[max_execution_time\]/d' "${pool}" 2>/dev/null || true
  cat >>"${pool}" <<POOL

; Laços — limites de upload
php_admin_value[upload_max_filesize] = ${PHP_UPLOAD}
php_admin_value[post_max_size] = ${PHP_POST}
php_admin_value[max_execution_time] = ${PHP_EXEC_TIME}
POOL
  echo "   Pool FPM: ${pool}"
done

# Reiniciar PHP-FPM
for svc in php8.4-fpm php8.3-fpm php8.2-fpm php8.1-fpm php-fpm; do
  if systemctl is-enabled "${svc}" &>/dev/null || systemctl list-unit-files | grep -q "^${svc}"; then
    systemctl restart "${svc}" 2>/dev/null && echo "✅ ${svc} reiniciado" && break
  fi
done

echo ""
echo "=== Verificação ==="
php -i 2>/dev/null | grep -E 'upload_max_filesize|post_max_size' | head -2
echo ""
echo "Teste (deve retornar 401/422, NÃO 413):"
echo "  dd if=/dev/zero bs=1M count=6 2>/dev/null | curl -s -o /dev/null -w 'HTTP %{http_code}\n' -X POST 'https://gateway.lacosapp.com/api/groups/1/media' --data-binary @-"
echo ""
echo "✅ Concluído. Peça ao usuário tentar o upload novamente."
