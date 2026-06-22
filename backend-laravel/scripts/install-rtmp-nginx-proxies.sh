#!/usr/bin/env bash
#
# Instala proxies nginx para câmeras iOS (API :8000 + WHEP :8890 via HTTPS).
# Rode no gateway: sudo bash install-rtmp-nginx-proxies.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

install_script() {
  local name="$1"
  local target="${SCRIPT_DIR}/${name}"
  if [[ ! -f "${target}" ]]; then
    echo "❌ Arquivo ausente: ${target}" >&2
    exit 1
  fi
  chmod +x "${target}"
  echo "▶ ${name}"
  bash "${target}"
}

echo "🔧 Instalando proxies RTMP para câmeras iOS..."
install_script "add-rtmp-api-nginx-proxy.sh"
install_script "add-rtmp-whep-dynamic-nginx-proxy.sh"

echo ""
echo "✅ Concluído. Teste:"
echo "curl -sI -u roboflex:yhvh77 'https://gateway.lacosapp.com/rtmp-agent/streaming.robohub.dev/8000/streams/secure-play-url/camerad8365fcd15a92' | head -3"
