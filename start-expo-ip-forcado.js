#!/usr/bin/env node

/**
 * Expo Go: LAN com IP fixo (--lan) ou túnel (--tunnel).
 * Em --tunnel não definir REACT_NATIVE_PACKAGER_HOSTNAME nem EXPO_OFFLINE — senão o ngrok não sobe e o app fica em "Opening project...".
 */

const { spawn } = require('child_process');
const path = require('path');

// IP: use variável EXPO_IP para override, ou 192.168.0.20 como padrão
const FORCED_IP = process.env.EXPO_IP || '192.168.0.20';
const FORCED_PORT = '8081';

const userArgs = process.argv.slice(2);
const useTunnel = userArgs.includes('--tunnel');

console.log('');
console.log('🚀 ============================================');
console.log(useTunnel ? '🚀 EXPO GO - TUNNEL (ngrok)' : '🚀 EXPO GO - IP FORÇADO');
console.log('🚀 ============================================');
console.log('');
if (useTunnel) {
  console.log(`📱 PORTA METRO: ${FORCED_PORT}`);
  console.log('📱 URL público vem do túnel (*.exp.direct) — não force REACT_NATIVE_PACKAGER_HOSTNAME em modo tunnel.');
  console.log('');
} else {
  console.log(`📱 IP FORÇADO: ${FORCED_IP}`);
  console.log(`📱 PORTA: ${FORCED_PORT}`);
  console.log(`📱 URL DO QR CODE: exp://${FORCED_IP}:${FORCED_PORT}`);
  console.log('');
  console.log('⚠️  GARANTINDO QUE NUNCA USE LOCALHOST!');
  console.log('');
}

// Parar processos antigos
console.log('🛑 Parando processos antigos...');
const { execSync } = require('child_process');
try {
  execSync('pkill -f "expo start" || true', { stdio: 'ignore' });
  execSync('pkill -f "metro" || true', { stdio: 'ignore' });
  execSync('pkill -f "node.*expo" || true', { stdio: 'ignore' });
  // Liberar porta
  try {
    execSync(`lsof -ti :${FORCED_PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  } catch (e) {}
  console.log('✅ Processos antigos parados');
} catch (e) {
  console.log('⚠️  Nenhum processo antigo encontrado');
}
console.log('');

// Limpar cache
console.log('🧹 Limpando cache...');
try {
  execSync('rm -rf .expo 2>/dev/null || true', { stdio: 'ignore' });
  execSync('rm -rf node_modules/.cache 2>/dev/null || true', { stdio: 'ignore' });
  execSync('rm -rf .metro 2>/dev/null || true', { stdio: 'ignore' });
  console.log('✅ Cache limpo');
} catch (e) {
  console.log('⚠️  Erro ao limpar cache (continuando...)');
}
console.log('');

// Configurar .expo/settings.json — LAN e tunnel exigem hostType diferentes
console.log(useTunnel ? '⚙️  Configurando Expo para túnel...' : '⚙️  Configurando Expo para usar IP fixo (LAN)...');
const fs = require('fs');
const settingsPath = path.join(process.cwd(), '.expo', 'settings.json');
try {
  fs.mkdirSync(path.join(process.cwd(), '.expo'), { recursive: true });
  const settings = useTunnel
    ? { hostType: 'tunnel', dev: true, urlRandomness: null }
    : { hostType: 'lan', lanType: 'ip', dev: true, urlRandomness: null };
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('✅ Configuração salva em .expo/settings.json');
} catch (e) {
  console.log('⚠️  Erro ao salvar configuração (continuando...)');
}
console.log('');

/**
 * O @expo/cli fixa TUNNEL_TIMEOUT em 10s (AsyncNgrok.js), o que falha em rede lenta / servidor sem egresso rápido.
 * Patch idempotente: substitui por leitura de EXPO_TUNNEL_TIMEOUT_MS no processo do Metro/CLI.
 */
function patchExpoNgrokTunnelTimeoutFromEnv(defaultMs) {
  const ngrokJs = path.join(
    __dirname,
    'node_modules',
    'expo',
    'node_modules',
    '@expo',
    'cli',
    'build',
    'src',
    'start',
    'server',
    'AsyncNgrok.js'
  );
  if (!fs.existsSync(ngrokJs)) {
    console.log('⚠️  AsyncNgrok.js não encontrado (caminho do Expo mudou?) — timeout do túnel não foi patchado.');
    return;
  }
  let s = fs.readFileSync(ngrokJs, 'utf8');
  const needle = 'const TUNNEL_TIMEOUT = 10 * 1000;';
  const already =
    s.includes('EXPO_TUNNEL_TIMEOUT_MS') &&
    s.includes('const TUNNEL_TIMEOUT = Number(process.env.EXPO_TUNNEL_TIMEOUT_MS)');
  if (already) {
    return;
  }
  if (!s.includes(needle)) {
    console.log(
      '⚠️  Expo CLI alterou AsyncNgrok (timeout fixo não é 10s) — não aplicámos patch. Se o túnel falhar, use LAN ou atualize o script.'
    );
    return;
  }
  const replacement = `const TUNNEL_TIMEOUT = Number(process.env.EXPO_TUNNEL_TIMEOUT_MS) || ${defaultMs};`;
  fs.writeFileSync(ngrokJs, s.replace(needle, replacement), 'utf8');
  console.log(
    `✅ Timeout do túnel ngrok: usa EXPO_TUNNEL_TIMEOUT_MS ou ${defaultMs}ms (${defaultMs / 1000}s) por omissão neste script.`
  );
}

const baseExpoEnv = {
  ...process.env,
  EXPO_USE_METRO_WORKSPACE_ROOT: '1',
  EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
  RCT_METRO_PORT: FORCED_PORT,
  PORT: FORCED_PORT,
  EXPO_PACKAGER_PORT: FORCED_PORT,
  CI: 'false',
  EXPO_NO_DOTENV: '1',
};

// Em --tunnel, NÃO forçar hostname LAN nem EXPO_OFFLINE: o app precisa da URL pública do ngrok
// e o túnel precisa de rede. Forçar 192.168.x quebrava o Expo Go ("Opening project..." infinito).
const tunnelTimeoutDefaultMs = 120000;
if (useTunnel && process.env.EXPO_NO_PATCH_TUNNEL_TIMEOUT !== '1') {
  patchExpoNgrokTunnelTimeoutFromEnv(tunnelTimeoutDefaultMs);
}
const env = useTunnel
  ? {
      ...baseExpoEnv,
      EXPO_TUNNEL_TIMEOUT_MS: String(
        process.env.EXPO_TUNNEL_TIMEOUT_MS || tunnelTimeoutDefaultMs
      ),
    }
  : {
      ...baseExpoEnv,
      REACT_NATIVE_PACKAGER_HOSTNAME: FORCED_IP,
      EXPO_PACKAGER_HOSTNAME: FORCED_IP,
      PACKAGER_HOSTNAME: FORCED_IP,
      HOST: FORCED_IP,
      METRO_HOST: FORCED_IP,
      EXPO_NO_LOCALHOST: '1',
      EXPO_USE_LOCALHOST: '0',
      EXPO_OFFLINE: '1',
    };

console.log('🔧 Variáveis de ambiente (relevantes):');
if (useTunnel) {
  console.log('   (tunnel) sem REACT_NATIVE_PACKAGER_HOSTNAME fixo — uso do hostname ngrok/Expo');
  console.log(`   PORT=${FORCED_PORT}`);
  console.log(
    `   EXPO_TUNNEL_TIMEOUT_MS=${env.EXPO_TUNNEL_TIMEOUT_MS} (ligação ao ngrok; Expo nativo usa só 10s)`
  );
} else {
  console.log(`   REACT_NATIVE_PACKAGER_HOSTNAME=${env.REACT_NATIVE_PACKAGER_HOSTNAME}`);
  console.log(`   EXPO_PACKAGER_HOSTNAME=${env.EXPO_PACKAGER_HOSTNAME}`);
  console.log(`   EXPO_NO_LOCALHOST=${env.EXPO_NO_LOCALHOST}`);
  console.log(`   EXPO_USE_LOCALHOST=${env.EXPO_USE_LOCALHOST}`);
}
console.log('');

// Argumentos para expo start - NÃO usar --lan e --tunnel juntos (Expo não permite)

const args = [
  'start',
  useTunnel ? '--tunnel' : '--lan',  // Um ou outro, nunca ambos
  '--port', FORCED_PORT,
  '--go',
  '--clear',
];

if (useTunnel) {
  console.log('📱 MODO TUNNEL ativado - use quando LAN não funcionar (Android travado em "downloading")');
}
const forbiddenArgs = ['--localhost', '--offline', '--host', '--tunnel', '--lan'];
const filteredArgs = userArgs.filter(arg => !forbiddenArgs.some(f => arg === f || arg.startsWith(f + '=')));
if (filteredArgs.length > 0) {
  console.log('📝 Argumentos adicionais:', filteredArgs.join(' '));
  args.push(...filteredArgs);
}

console.log('');
console.log('🚀 Iniciando Expo Go...');
console.log('');
if (useTunnel) {
  console.log('📱 MODO TUNNEL: Aguarde o QR code (pode levar 1-2 min). Escaneie com Expo Go.');
  console.log('   O URL será diferente (expo.dev) - funciona mesmo com rede/firewall!');
} else {
  console.log('📱 O QR CODE DEVE MOSTRAR:');
  console.log(`   exp://${FORCED_IP}:${FORCED_PORT}`);
}
console.log('');

// Iniciar Expo
const expoProcess = spawn('npx', ['expo', ...args], {
  env,
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

// Tratamento de erros
expoProcess.on('error', (error) => {
  console.error('❌ Erro ao iniciar Expo:', error);
  process.exit(1);
});

expoProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Expo terminou com código: ${code}`);
    process.exit(code);
  }
});

// Capturar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Parando Expo...');
  expoProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  expoProcess.kill('SIGTERM');
  process.exit(0);
});

