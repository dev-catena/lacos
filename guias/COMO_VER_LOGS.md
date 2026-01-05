# 📊 Como Ver Logs do App Expo

## 🎯 Métodos para Ver Logs

### 1. **No Terminal do Expo (Mais Simples)**

No terminal onde você rodou `npm run start:lan`, você já vê alguns logs automaticamente. Para ver mais:

**No terminal do Expo, pressione:**
- `j` - Abre o Chrome DevTools (debugger)
- `r` - Recarrega o app
- `m` - Abre o menu de desenvolvimento

### 2. **Chrome DevTools (Recomendado)**

1. No terminal do Expo, pressione `j`
2. Isso abre o Chrome DevTools em: `http://localhost:19000/debugger-ui/`
3. Vá para a aba **Console** para ver todos os `console.log()`
4. Vá para a aba **Network** para ver requisições HTTP

**Ou acesse diretamente:**
```bash
# Abra no navegador:
http://localhost:19000/debugger-ui/
```

### 3. **React Native Debugger (Mais Completo)**

Instale o React Native Debugger:

```bash
# Linux (via snap ou AppImage)
# Baixe de: https://github.com/jhen0409/react-native-debugger/releases

# Ou use o Chrome DevTools (já vem com o Expo)
```

No app Expo Go:
1. Sacuda o dispositivo (ou pressione `Cmd+D` no iOS / `Cmd+M` no Android)
2. Toque em **"Debug Remote JS"**
3. O Chrome DevTools abrirá automaticamente

### 4. **Logs Nativos (Android/iOS)**

#### Android:
```bash
# Ver logs do Android em tempo real
adb logcat | grep -i "reactnative\|expo"

# Ou ver todos os logs
adb logcat
```

#### iOS (apenas macOS):
```bash
# Ver logs do simulador iOS
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "Expo"'
```

### 5. **No Próprio App (Menu de Desenvolvimento)**

No app Expo Go:
1. Sacuda o dispositivo (ou `Cmd+D` / `Cmd+M`)
2. Menu de desenvolvimento aparece
3. Toque em **"Show Element Inspector"** para ver a hierarquia
4. Toque em **"Debug Remote JS"** para abrir DevTools

## 🚀 Comandos Rápidos

### Ver logs no terminal do Expo:
```bash
# Já está rodando quando você faz:
npm run start:lan

# Os logs aparecem automaticamente no terminal
```

### Abrir DevTools:
```bash
# No terminal do Expo, pressione 'j'
# Ou acesse diretamente:
xdg-open http://localhost:19000/debugger-ui/
```

### Ver logs do Android:
```bash
# Instalar adb se não tiver:
sudo apt install android-tools-adb

# Ver logs:
adb logcat | grep -i "reactnative\|expo"
```

## 📝 Adicionar Logs no Código

Para ver logs específicos, use `console.log()` no seu código:

```javascript
// Exemplo em qualquer componente
console.log('🔵 Componente renderizado');
console.log('📱 Dados:', dados);
console.error('❌ Erro:', erro);
console.warn('⚠️ Aviso:', aviso);
```

Os logs aparecerão:
- No terminal do Expo
- No Chrome DevTools (pressione `j`)
- No React Native Debugger

## 🔍 Ver Requisições HTTP

Para ver todas as requisições HTTP em tempo real:

1. Abra o Chrome DevTools (pressione `j` no terminal)
2. Vá para a aba **Network**
3. Realize ações no app
4. Veja as requisições sendo feitas

## 🎯 Método Mais Rápido (Recomendado)

**Passo a passo simples:**

1. **Terminal do Expo já está mostrando logs** (quando você roda `npm run start:lan`)

2. **Para ver mais detalhes, pressione `j` no terminal do Expo**
   - Isso abre o Chrome DevTools
   - Vá para a aba **Console**
   - Todos os `console.log()` aparecerão lá

3. **Para ver requisições HTTP:**
   - No Chrome DevTools, vá para a aba **Network**
   - Realize ações no app
   - Veja as requisições em tempo real

## 📱 No App (Menu de Desenvolvimento)

1. **Sacuda o dispositivo** (ou `Cmd+D` / `Cmd+M`)
2. **Menu aparece** com opções:
   - **Reload** - Recarrega o app
   - **Debug Remote JS** - Abre DevTools
   - **Show Element Inspector** - Inspecta elementos
   - **Enable Fast Refresh** - Hot reload

## 🛠️ Scripts Úteis

Crie estes scripts no `package.json`:

```json
{
  "scripts": {
    "logs:android": "adb logcat | grep -i 'reactnative\\|expo'",
    "logs:all": "adb logcat"
  }
}
```

Depois use:
```bash
npm run logs:android
```

## 💡 Dica Pro

Para ver logs de forma mais organizada, use cores:

```javascript
console.log('%c🔵 Meu Log', 'color: blue; font-weight: bold', dados);
console.log('%c✅ Sucesso', 'color: green; font-weight: bold', resultado);
console.log('%c❌ Erro', 'color: red; font-weight: bold', erro);
```

## 🎯 Resumo Rápido

**Método mais simples:**
1. Terminal do Expo já mostra logs
2. Pressione `j` no terminal → Abre Chrome DevTools
3. Vá para aba **Console** → Vê todos os logs
4. Vá para aba **Network** → Vê requisições HTTP

**Pronto!** 🎉

