# 📋 Comandos Separados: Web vs APK

## 🎯 Comandos para Desenvolvimento Web

### Desenvolver no Web (Nunca gera APK)

```bash
# Opção 1: Script npm
npm run web

# Opção 2: Expo direto
npx expo start --web

# Opção 3: Script customizado
./DESENVOLVER_WEB_SIMPLES.sh
```

**Resultado:** Apenas servidor web, zero APK gerado.

---

## 📱 Comandos para Gerar APK

### Gerar APK (Só quando você quiser)

```bash
# Opção 1: Script automatizado
./GERAR_APK_FINAL.sh

# Opção 2: EAS Build direto
eas build --profile production --platform android

# Opção 3: Build de desenvolvimento
eas build --profile development --platform android
```

**Resultado:** APK gerado, zero impacto no desenvolvimento web.

---

## 🔄 Fluxo Recomendado

### Desenvolvimento Diário

```bash
# Todo dia, várias vezes
npm run web
# Desenvolve, testa, ajusta...
# NUNCA gera APK
```

### Teste no Mobile (Opcional)

```bash
# Opção A: Expo Go (sem gerar APK)
npx expo start
# Escaneia QR code

# Opção B: APK de desenvolvimento (quando quiser)
eas build --profile development --platform android
```

### Produção (Quando Pronto)

```bash
# Gera APK final (1 comando)
eas build --profile production --platform android
```

---

## ✅ Garantias

| Ação | Gera APK? | Afeta Dev Web? |
|------|-----------|----------------|
| `npm run web` | ❌ Não | ❌ Não |
| `npx expo start --web` | ❌ Não | ❌ Não |
| `eas build` | ✅ Sim | ❌ Não |
| Desenvolvimento contínuo | ❌ Não | ❌ Não |

**Conclusão:** Desenvolvimento web e geração de APK são 100% independentes!

