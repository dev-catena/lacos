/**
 * Logs estruturados do fluxo BLE V8.
 * Prefixo fixo para filtrar no Metro / logcat: V8BLE
 *
 * Metro:  filtre por "V8BLE"
 * adb:    scripts/v8-ble-logcat.sh
 */

const PREFIX = 'V8BLE';

function ts() {
  return new Date().toISOString().slice(11, 23);
}

function fmtExtra(extra) {
  if (extra == null) return '';
  if (typeof extra === 'string') return ` ${extra}`;
  try {
    return ` ${JSON.stringify(extra)}`;
  } catch {
    return ` ${String(extra)}`;
  }
}

export function v8Log(step, message, extra) {
  // eslint-disable-next-line no-console
  console.log(`[${PREFIX}] ${ts()} | ${step} | ${message}${fmtExtra(extra)}`);
}

export function v8Warn(step, message, extra) {
  console.warn(`[${PREFIX}] ${ts()} | ${step} | ${message}${fmtExtra(extra)}`);
}

export function v8Error(step, message, extra) {
  const errMsg =
    extra instanceof Error
      ? { message: extra.message, name: extra.name, stack: extra.stack?.split('\n').slice(0, 4) }
      : extra;
  console.error(`[${PREFIX}] ${ts()} | ${step} | ${message}${fmtExtra(errMsg)}`);
}

/** Marca tempo desde `t0` (ms) para achar etapa lenta/crash. */
export function elapsedMs(t0) {
  return Math.round(performance.now() - t0);
}
