#!/usr/bin/env bash
#
# Corrige permissões do Laravel (storage + bootstrap/cache).
# Erro típico no app: "laravel.log could not be opened in append mode: Permission denied"
#
# Uso no servidor gateway:
#   sudo bash /var/www/lacos/backend-laravel/scripts/fix-storage-permissions.sh
#
# Ou informando o caminho:
#   sudo LARAVEL_ROOT=/var/www/lacos/backend-laravel bash fix-storage-permissions.sh
#
set -euo pipefail

LARAVEL_ROOT="${LARAVEL_ROOT:-/var/www/lacos/backend-laravel}"
WEB_USER="${WEB_USER:-www-data}"
WEB_GROUP="${WEB_GROUP:-www-data}"

if [[ ! -d "${LARAVEL_ROOT}" ]]; then
  echo "❌ Diretório Laravel não encontrado: ${LARAVEL_ROOT}" >&2
  echo "   Tente: export LARAVEL_ROOT=/var/www/lacos-backend" >&2
  exit 1
fi

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Execute com sudo." >&2
  exit 1
fi

echo "🔧 Ajustando permissões em ${LARAVEL_ROOT}"

mkdir -p \
  "${LARAVEL_ROOT}/storage/logs" \
  "${LARAVEL_ROOT}/storage/framework/cache" \
  "${LARAVEL_ROOT}/storage/framework/sessions" \
  "${LARAVEL_ROOT}/storage/framework/views" \
  "${LARAVEL_ROOT}/storage/app/public" \
  "${LARAVEL_ROOT}/bootstrap/cache"

touch "${LARAVEL_ROOT}/storage/logs/laravel.log"

chown -R "${WEB_USER}:${WEB_GROUP}" "${LARAVEL_ROOT}/storage" "${LARAVEL_ROOT}/bootstrap/cache"
chmod -R ug+rwx "${LARAVEL_ROOT}/storage" "${LARAVEL_ROOT}/bootstrap/cache"
find "${LARAVEL_ROOT}/storage" -type d -exec chmod 775 {} \;
find "${LARAVEL_ROOT}/storage" -type f -exec chmod 664 {} \;

cd "${LARAVEL_ROOT}"
sudo -u "${WEB_USER}" php artisan config:clear || true
sudo -u "${WEB_USER}" php artisan route:clear || true
sudo -u "${WEB_USER}" php artisan cache:clear || true

echo ""
echo "✅ Permissões corrigidas."
echo "   Teste: curl -sI https://gateway.lacosapp.com/api/gateway/status | head -3"
echo ""
ls -la "${LARAVEL_ROOT}/storage/logs/laravel.log"
