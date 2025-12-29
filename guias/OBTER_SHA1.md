# 🔐 Como Obter o SHA-1 do Certificado Android

## Método 1: Via Expo (Recomendado para Expo Apps)

```bash
# 1. Fazer prebuild (gera pasta android)
npx expo prebuild

# 2. Entrar na pasta android
cd android

# 3. Executar signingReport
./gradlew signingReport

# 4. Procure por "SHA1" na saída
# Exemplo de saída:
# Variant: debug
# SHA1: A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0
```

## Método 2: Via keytool (Debug Keystore)

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Saída esperada:**
```
Certificate fingerprints:
         SHA1: A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0
         SHA256: ...
```

## Método 3: Via Android Studio

1. Abra o projeto em **Android Studio**
2. Vá em: **Gradle** (aba lateral direita)
3. Navegue: **app** → **Tasks** → **android** → **signingReport**
4. Dê um duplo clique
5. O SHA-1 aparecerá no console

## 🎯 Localizações de Keystores

### Debug Keystore (Desenvolvimento):
```
Linux/Mac: ~/.android/debug.keystore
Windows: C:\Users\{USUARIO}\.android\debug.keystore
```

### Release Keystore (Produção):
```
Você precisa criar um keystore de produção:

keytool -genkey -v -keystore lacos-release.keystore -alias lacos -keyalg RSA -keysize 2048 -validity 10000

Depois obtenha o SHA-1:
keytool -list -v -keystore lacos-release.keystore -alias lacos
```

## ⚠️ IMPORTANTE:

- **Debug SHA-1**: Use durante desenvolvimento
- **Release SHA-1**: Use para a versão de produção
- Você pode adicionar **ambos** no Google Cloud Console
- Cada keystore tem um SHA-1 diferente

## 📋 Checklist:

- [ ] Obtive o SHA-1 de debug
- [ ] Adicionei no Google Cloud Console
- [ ] Testei o autocomplete no app
- [ ] (Produção) Criei keystore de release
- [ ] (Produção) Obtive SHA-1 de release
- [ ] (Produção) Adicionei SHA-1 de release no Google Console

## 🔗 Links Úteis:

- [Documentação Oficial - Android Signing](https://developer.android.com/studio/publish/app-signing)
- [Expo - Configurando Builds](https://docs.expo.dev/build/setup/)
- [Google Maps - Registrar App](https://developers.google.com/maps/documentation/android-sdk/get-api-key)
