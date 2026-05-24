const appJson = require('./app.json');

/** expo-dev-client só no perfil development — TestFlight/production usa app normal com Agora nativo. */
module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE || '';
  const base = appJson.expo;

  let plugins = [...(base.plugins || [])];
  if (profile === 'development') {
    if (!plugins.includes('expo-dev-client')) {
      plugins = ['expo-dev-client', ...plugins];
    }
  } else {
    plugins = plugins.filter((p) => p !== 'expo-dev-client');
  }

  return {
    ...config,
    ...base,
    plugins,
  };
};
