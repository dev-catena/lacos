#!/usr/bin/env bash
#
# Testa a cadeia completa: API → snapshot → secure-play → WHEP
# Uso: bash scripts/test-rtmp-camera-chain.sh [camera_id] [stream_host] [api_port]
#
set -euo pipefail

CAMERA_ID="${1:-camerad8365fcd15a92}"
STREAM_HOST="${2:-streaming.robohub.dev}"
API_PORT="${3:-8000}"
WHEP_PORT="${4:-8890}"
AUTH_USER="${RTMP_AGENT_USERNAME:-roboflex}"
AUTH_PASS="${RTMP_AGENT_PASSWORD:-yhvh77}"
GATEWAY="${GATEWAY_ORIGIN:-https://gateway.lacosapp.com}"

pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; }
warn() { echo "⚠️  $1"; }

echo "=== Diagnóstico câmeras RTMP ==="
echo "camera=$CAMERA_ID host=$STREAM_HOST api=:$API_PORT whep=:$WHEP_PORT"
echo ""

CODE=$(curl -sS -o /dev/null -w "%{http_code}" -u "$AUTH_USER:$AUTH_PASS" \
  "$GATEWAY/rtmp-agent/$STREAM_HOST/$API_PORT/streams/secure-play-url/$CAMERA_ID" || echo "000")
if [[ "$CODE" == "200" ]]; then pass "API HTTPS proxy (secure-play-url) → $CODE"; else fail "API HTTPS proxy → $CODE"; fi

CODE=$(curl -sS -o /dev/null -w "%{http_code}" \
  "$GATEWAY/rtmp-agent/$STREAM_HOST/$API_PORT/snapshots/latest/$CAMERA_ID" || echo "000")
if [[ "$CODE" == "200" ]]; then pass "Snapshot HTTPS proxy → $CODE"; else warn "Snapshot HTTPS proxy → $CODE (404 = sem frame ainda)"; fi

TOKEN=$(curl -sS -u "$AUTH_USER:$AUTH_PASS" \
  "$GATEWAY/rtmp-agent/$STREAM_HOST/$API_PORT/streams/secure-play-url/$CAMERA_ID" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null || true)
if [[ -n "$TOKEN" ]]; then pass "Token de playback obtido"; else fail "Token de playback"; exit 1; fi

CONNECTED=$(curl -sS -u "$AUTH_USER:$AUTH_PASS" \
  "http://$STREAM_HOST:$API_PORT/streams/status" 2>/dev/null \
  | python3 -c "import sys,json; c='$CAMERA_ID'; d=next((x for x in json.load(sys.stdin) if x.get('camera_id')==c),{}); print('true' if d.get('connected') else 'false')" 2>/dev/null || echo "unknown")
if [[ "$CONNECTED" == "true" ]]; then pass "Câmera online (RTMP connected)"; else warn "Câmera offline ou status indisponível ($CONNECTED)"; fi

CODE=$(curl -sS -o /dev/null -w "%{http_code}" \
  "$GATEWAY/rtmp-agent/$STREAM_HOST/$API_PORT/streams/secure-play/$CAMERA_ID?token=$TOKEN" || echo "000")
if [[ "$CODE" == "200" ]]; then pass "Página secure-play HTTPS → $CODE"; else fail "Página secure-play HTTPS → $CODE"; fi

WHEP_BODY=$(curl -sS -w "\n%{http_code}" -X POST \
  "$GATEWAY/rtmp-whep-proxy/$STREAM_HOST/$WHEP_PORT/live/${CAMERA_ID}_webrtc/whep?token=$TOKEN" \
  -H "Content-Type: application/sdp" -d "v=0" 2>/dev/null || echo -e "\n000")
WHEP_CODE=$(echo "$WHEP_BODY" | tail -1)
if [[ "$WHEP_CODE" == "201" || "$WHEP_CODE" == "200" ]]; then
  pass "WHEP HTTPS proxy → $WHEP_CODE (vídeo deve funcionar no app)"
elif [[ "$WHEP_CODE" == "500" ]]; then
  fail "WHEP HTTPS proxy → 500 (problema no MediaMTX/nginx do agente :$WHEP_PORT)"
  echo "   → Corrigir no servidor $STREAM_HOST, não no app Laços."
else
  fail "WHEP HTTPS proxy → $WHEP_CODE"
fi

echo ""
echo "=== Fim ==="
