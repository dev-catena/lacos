// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = {};
  return {
    getItem: jest.fn((key) => {
      return Promise.resolve(storage[key] || null);
    }),
    setItem: jest.fn((key, value) => {
      storage[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key) => {
      delete storage[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => {
      return Promise.resolve(Object.keys(storage));
    }),
    multiGet: jest.fn((keys) => {
      return Promise.resolve(keys.map(key => [key, storage[key] || null]));
    }),
    multiSet: jest.fn((pairs) => {
      pairs.forEach(([key, value]) => {
        storage[key] = value;
      });
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys) => {
      keys.forEach(key => delete storage[key]);
      return Promise.resolve();
    }),
  };
});

// Mock do React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules = {
    ...RN.NativeModules,
  };
  return RN;
});

// Mock do React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }),
    useFocusEffect: jest.fn((callback) => {
      // Executar o callback de forma assíncrona para permitir que as funções sejam definidas
      setTimeout(() => {
        try {
          callback();
        } catch (e) {
          // Ignorar erros durante a inicialização
        }
      }, 0);
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock do SafeAreaView
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock do Expo StatusBar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock do Expo Vector Icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, ...props }) => React.createElement(Text, { ...props, testID: `icon-${name}` }, name),
  };
});

// Mock do apiService
jest.mock('../services/apiService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({})),
    post: jest.fn(() => Promise.resolve({})),
    put: jest.fn(() => Promise.resolve({})),
    delete: jest.fn(() => Promise.resolve({})),
  },
}));

// Mock do AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    signed: false,
    loading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    updateUser: jest.fn(),
  })),
  AuthProvider: ({ children }) => children,
}));

// Mock do App navigationRef
jest.mock('../../App', () => ({
  navigationRef: {
    current: {
      navigate: jest.fn(),
    },
  },
}), { virtual: true });

// Mock do Expo completamente
jest.mock('expo', () => {
  const actualExpo = jest.requireActual('expo');
  return {
    ...actualExpo,
  };
}, { virtual: false });

// Mock do Expo Winter Runtime - precisa ser feito ANTES de qualquer import do Expo
if (typeof global.__ExpoImportMetaRegistry === 'undefined') {
  global.__ExpoImportMetaRegistry = {};
}

// Mock do structuredClone que o Expo Winter precisa
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

