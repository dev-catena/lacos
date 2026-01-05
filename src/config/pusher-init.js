/**
 * Inicialização do Pusher para React Native
 * Este arquivo deve ser importado antes de qualquer uso do Laravel Echo
 */

import Pusher from 'pusher-js';

// Tornar Pusher disponível globalmente para Laravel Echo
// No React Native, precisamos definir em múltiplos lugares para garantir compatibilidade

// globalThis (ES2020+)
if (typeof globalThis !== 'undefined') {
  globalThis.Pusher = Pusher;
}

// global (Node.js / React Native)
if (typeof global !== 'undefined') {
  global.Pusher = Pusher;
}

// window (Browser)
if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
}

// Verificar se foi definido
if (typeof globalThis !== 'undefined' && globalThis.Pusher) {
  console.log('✅ Pusher disponível globalmente via globalThis');
} else if (typeof global !== 'undefined' && global.Pusher) {
  console.log('✅ Pusher disponível globalmente via global');
} else if (typeof window !== 'undefined' && window.Pusher) {
  console.log('✅ Pusher disponível globalmente via window');
} else {
  console.warn('⚠️ Pusher não pôde ser definido globalmente');
}

export default Pusher;








