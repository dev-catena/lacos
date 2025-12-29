# 🔧 Corrigir Erro BLE - Recompilar App

## ❌ Erro Encontrado

```
ERROR  Erro ao inicializar BLE: [Invariant Violation: `new NativeEventEmitter()` requires a non-null argument.]
```

## 🔍 Causa

O erro ocorre porque `react-native-ble-plx` é uma biblioteca **nativa** que requer código compilado. Após instalar a biblioteca, o app precisa ser **recompilado** para incluir o módulo nativo.

## ✅ Solução

### Opção 1: Recompilar com Expo (Recomendado)

```bash
# No diretório raiz do projeto
cd /home/darley/lacos

# Recompilar o app Android
npx expo run:android

# Ou para iOS
npx expo run:ios
```

### Opção 2: Usando npm scripts

```bash
# Android
npm run android

# iOS
npm run ios
```

### Opção 3: Build completo (se as opções acima não funcionarem)

```bash
# Limpar cache e recompilar
npx expo prebuild --clean
npx expo run:android
```

## 📱 Após Recompilar

1. O app será instalado no dispositivo/emulador
2. O módulo nativo BLE estará disponível
3. O sensor de queda poderá ser conectado

## ⚠️ Importante

- **Não use Expo Go** para testar BLE - bibliotecas nativas não funcionam no Expo Go
- Use **Expo Dev Client** (já configurado no projeto)
- Certifique-se de que o dispositivo/emulador tem Bluetooth habilitado

## 🧪 Testar Após Recompilar

1. Abra o app no dispositivo
2. Acesse um grupo
3. Toque no card "Sensor de Queda"
4. Toque em "Conectar"
5. O app deve escanear e conectar ao sensor WT901BLE67

## 📝 Notas

- A primeira compilação pode demorar alguns minutos
- Certifique-se de ter o ambiente de desenvolvimento configurado (Android Studio, Xcode, etc.)
- Se o erro persistir, verifique se `react-native-ble-plx` está instalado: `npm list react-native-ble-plx`

