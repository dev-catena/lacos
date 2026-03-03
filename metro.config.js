/**
 * Metro config - VERSÃO SIMPLIFICADA
 * O middleware anterior reescrevia o bundle e podia corromper o JS (download infinito)
 */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const EXPO_IP = process.env.EXPO_IP || process.env.REACT_NATIVE_PACKAGER_HOSTNAME || '192.168.0.20';
const EXPO_PORT = '8081';

process.env.REACT_NATIVE_PACKAGER_HOSTNAME = EXPO_IP;
process.env.EXPO_PACKAGER_HOSTNAME = EXPO_IP;
process.env.PACKAGER_HOSTNAME = EXPO_IP;
process.env.EXPO_NO_LOCALHOST = '1';

// Use --lan ao iniciar (npm run start) para escutar em todas as interfaces
config.server = {
  ...config.server,
  port: parseInt(EXPO_PORT),
};

module.exports = config;
