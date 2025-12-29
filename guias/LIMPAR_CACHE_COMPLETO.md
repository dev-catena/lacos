# 🧹 Limpar Cache Completo - Expo/React Native

## ⚠️ Se nada mudou após edições, siga estes passos:

### 1. **Parar o Expo/Metro**
```bash
# Pressione Ctrl+C no terminal onde o Expo está rodando
# OU mate os processos:
pkill -f "expo start"
pkill -f "metro"
```

### 2. **Limpar Cache do Metro/Expo**
```bash
cd /home/darley/lacos

# Limpar cache do Expo
rm -rf .expo
rm -rf node_modules/.cache

# Limpar cache do Metro
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/haste-* 2>/dev/null
```

### 3. **Limpar Cache do NPM**
```bash
npm cache clean --force
```

### 4. **Reiniciar com Cache Limpo**
```bash
npx expo start --clear
```

### 5. **No Dispositivo Android**

#### Opção A: Recarregar o App
- **Agite o dispositivo** → Selecione "Reload"
- **OU** Pressione `r` no terminal do Expo

#### Opção B: Limpar Cache do Expo Go
1. Vá em **Configurações** do Android
2. **Apps** → **Expo Go**
3. **Armazenamento** → **Limpar Cache**
4. **Limpar Dados** (se necessário)

#### Opção C: Reinstalar Expo Go
1. Desinstale o Expo Go
2. Reinstale da Play Store
3. Abra novamente e escaneie o QR code

### 6. **Verificar se o Código Foi Salvo**
```bash
# Verificar última modificação do arquivo
ls -lh src/screens/Home/DoctorVideoCallScreen.js

# Verificar se tem os botões flutuantes
grep -n "controlsFloating" src/screens/Home/DoctorVideoCallScreen.js
```

### 7. **Forçar Rebuild Completo**
```bash
# Se ainda não funcionar, reinstale dependências
rm -rf node_modules
npm install
npx expo start --clear
```

---

## 🔍 Verificar se Mudanças Estão no Código

Execute para verificar:
```bash
cd /home/darley/lacos
grep -A 5 "controlsFloating" src/screens/Home/DoctorVideoCallScreen.js
grep -A 5 "safeAreaBottom" src/screens/Home/DoctorVideoCallScreen.js
```

Se aparecer resultados, o código está correto e é problema de cache.

---

## ✅ Checklist Rápido

- [ ] Expo parado
- [ ] Cache limpo (`.expo`, `node_modules/.cache`)
- [ ] Expo reiniciado com `--clear`
- [ ] App recarregado no dispositivo (agitar → Reload)
- [ ] Cache do Expo Go limpo no Android
- [ ] Código verificado (grep acima)

---

## 🚨 Se Ainda Não Funcionar

1. **Verifique qual arquivo está sendo usado:**
   ```bash
   # Verificar imports
   grep -r "DoctorVideoCallScreen" src/navigation/
   ```

2. **Verifique se há outro arquivo:**
   ```bash
   find . -name "*VideoCall*.js" -type f
   ```

3. **Force rebuild completo:**
   ```bash
   rm -rf node_modules .expo
   npm install
   npx expo start --clear
   ```



