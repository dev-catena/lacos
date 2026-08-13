#!/usr/bin/env bash
# Captura crash / BLE da pulseira V8 no Android (opcional — só se houver USB).
#
# Fluxo principal do projeto: builds EAS (sem USB).
# Para diagnóstico sem cabo, use o breadcrumb na aba Pulseira
# ("Última etapa antes de falha/crash") após reabrir o app.
#
# Publicar JS de diagnóstico:
#   eas update --channel preview --message "V8 BLE breadcrumbs"
# (ou o channel do build instalado: development / preview / production)
#
# Este script só ajuda se o aparelho estiver em depuracao USB/wifi:
#   ./scripts/v8-ble-logcat.sh
#   ./scripts/v8-ble-logcat.sh --file
set -euo pipefail

if ! command -v adb >/dev/null 2>&1; then
  echo "adb não encontrado. Em builds EAS, ignore este script e use o breadcrumb na UI." >&2
  exit 1
fi

DEVICES="$(adb devices | awk 'NR>1 && $2=="device" {print $1}')"
if [[ -z "$DEVICES" ]]; then
  echo "Nenhum aparelho no adb (esperado se você só usa EAS)." >&2
  echo "Diagnóstico sem USB:" >&2
  echo "  1) eas update --channel <seu-canal>" >&2
  echo "  2) Abra o app → Pulseira → conectar até crashar" >&2
  echo "  3) Reabra → copie 'Última etapa antes de falha/crash'" >&2
  exit 1
fi

echo "Dispositivo(s): $DEVICES"
echo "Limpando buffer do logcat…"
adb logcat -c || true

FILTER='V8BLE|AndroidRuntime|FATAL EXCEPTION|BlePlx|bleplx|BleManager|react-native-ble|SecurityException|BluetoothGatt|UndeliverableException|com.lacos.app|ReactNativeJS'

OUT=""
if [[ "${1:-}" == "--file" ]]; then
  OUT="/tmp/v8-ble-logcat-$(date +%Y%m%d-%H%M%S).txt"
  echo "Gravando em: $OUT"
  echo "Reproduza o crash (Sinais Vitais → Pulseira → Conectar). Ctrl+C para parar."
  adb logcat -v time | grep -iE "$FILTER" | tee "$OUT"
else
  echo "Reproduza o crash (Sinais Vitais → Pulseira → Conectar). Ctrl+C para parar."
  echo "Filtro: $FILTER"
  echo "---"
  adb logcat -v time | grep -iE "$FILTER"
fi
