#!/usr/bin/env node
/**
 * Obtém o IP da máquina na rede local (para Expo/React Native)
 * Prioriza interfaces ativas (não loopback, não docker)
 */
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    // Ignorar Docker e interfaces virtuais
    if (name.startsWith('docker') || name.startsWith('veth') || name === 'lo') {
      continue;
    }
    
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return null;
}

const ip = getLocalIP();
if (ip) {
  console.log(ip);
} else {
  console.error('Não foi possível obter o IP da rede');
  process.exit(1);
}
