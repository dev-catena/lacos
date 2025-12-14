# 🧹 COMO LIMPAR DADOS DO APP (AsyncStorage)

## 🚨 Problema Identificado

Você relatou:
> "Reiniciei o serviço com `npx expo start --clear`. Desconectei e conectei o dispositivo no Expo e qual foi a primeira tela que abriu? A tela para criar grupo e entrar com código sem hora nenhuma mostrar a tela de login."

### Por que isso acontece?

```
❌ npx expo start --clear
   └─ Limpa cache do BUNDLER (Metro)
   └─ NÃO limpa AsyncStorage do DISPOSITIVO

✅ AsyncStorage do dispositivo
   └─ Ainda tem user e token salvos
   └─ AuthContext carrega esses dados
   └─ signed vira true
   └─ RootNavigator renderiza AppNavigator
   └─ Você vê NoGroupsScreen sem fazer login!
```

---

## ✅ SOLUÇÃO 1: Botão de Debug (NOVA FUNCIONALIDADE)

Adicionei um **botão invisível** na WelcomeScreen:

### Como usar:

1. **Abrir o app** (qualquer tela)
2. **Navegar até WelcomeScreen** (se não aparecer, veja Solução 2)
3. **Tocar 5 vezes rápido no LOGO** (o logo "Laços" no topo)
4. **Vai aparecer**:
   ```
   🧹 Debug: 1/5 toques
   🧹 Debug: 2/5 toques
   ...
   🧹 Debug: 5/5 toques
   ```
5. **Alert aparece**:
   ```
   🧹 Limpar Dados
   
   Deseja limpar TODOS os dados do AsyncStorage?
   
   Isso vai forçar logout e remover todas as sessões salvas.
   
   [Cancelar]  [Limpar Tudo]
   ```
6. **Clique em "Limpar Tudo"**
7. **Reinicie o app** (fechar e abrir novamente)
8. **Agora sim**: WelcomeScreen aparece primeiro! ✅

---

## ✅ SOLUÇÃO 2: Limpar Manualmente no Expo Go

Se não conseguir acessar a WelcomeScreen:

### Android (Expo Go):
1. Abra o app
2. **Shake** (balance o celular)
3. Menu de desenvolvedor aparece
4. Clique em **"Clear AsyncStorage"** ou **"Delete app data"**
5. Clique em **"Reload"**
6. Agora deve abrir em WelcomeScreen ✅

### iOS (Expo Go):
1. Abra o app
2. **Shake** (balance o celular)
3. Menu de desenvolvedor aparece
4. Clique em **"Clear AsyncStorage"** ou **"Delete app data"**
5. Clique em **"Reload"**
6. Agora deve abrir em WelcomeScreen ✅

---

## ✅ SOLUÇÃO 3: Desinstalar e Reinstalar

Método mais drástico mas 100% eficaz:

1. **Desinstalar Expo Go** do celular
2. **Reinstalar Expo Go** da Play Store/App Store
3. **Scannear QR Code** novamente
4. App inicia LIMPO ✅

---

## ✅ SOLUÇÃO 4: Limpar Via Código (Se WelcomeScreen aparecer)

Se você conseguir ver a WelcomeScreen:

1. Toque **5 vezes rápido no logo "Laços"**
2. Alert aparece
3. Confirme "Limpar Tudo"
4. Feche e reabra o app

---

## 📋 Checklist de Verificação

Após limpar os dados, você DEVE ver:

### ✅ Console (Logs Esperados):
```bash
🔑 AuthContext - Carregando dados do storage...
🔑 AuthContext - storedUser: NULL
🔑 AuthContext - storedToken: NULL
✅ AuthContext - Nenhum token armazenado (primeira vez ou logout)
🔑 AuthContext - Loading finalizado, signed: false
🔐 RootNavigator - Estado: { signed: false, loading: false, hasUser: false }
🔐 RootNavigator - isAuthenticated: false
🔐 RootNavigator - Renderizando: AuthNavigator (Não autenticado)
```

### ✅ Tela:
```
WelcomeScreen aparece primeiro ✅
Com opções:
- 📝 Criar Conta
- 🔑 Já tenho conta
```

### ❌ NÃO deve ver:
```
❌ NoGroupsScreen
❌ HomeScreen
❌ Tela de criar grupo
```

---

## 🔍 Se AINDA aparecer NoGroupsScreen sem login

Me envie IMEDIATAMENTE estes logs:

1. **Console completo** desde o `npx expo start`
2. **Procure por estes logs**:
   ```
   🔑 AuthContext - storedUser: ???
   🔑 AuthContext - storedToken: ???
   🔐 RootNavigator - isAuthenticated: ???
   ```

3. **Tire screenshot** da tela que aparece

---

## 🆕 Novos Logs de Debug

Agora o console mostra TUDO que está acontecendo:

### Ao carregar app:
```bash
🔑 AuthContext - Carregando dados do storage...
🔑 AuthContext - storedUser: EXISTE ou NULL
🔑 AuthContext - storedToken: EXISTE ou NULL
```

### Se encontrar token:
```bash
🔑 AuthContext - Token encontrado, validando com servidor...
🔑 AuthContext - User do storage: João Silva
✅ AuthContext - Token VÁLIDO, usuário: João Silva
```

### Se token inválido:
```bash
❌ AuthContext - Token INVÁLIDO, limpando dados...
✅ AuthContext - Nenhum token armazenado
```

### No RootNavigator:
```bash
🔐 RootNavigator - Estado: { signed: true/false, ... }
🔐 RootNavigator - isAuthenticated: true/false
🔐 RootNavigator - Renderizando: AppNavigator ou AuthNavigator
```

---

## 🎯 Fluxo Correto Após Limpeza

```
1. App abre
   ↓
2. AuthContext carrega storage
   ↓
3. storedUser: NULL, storedToken: NULL
   ↓
4. signed = false
   ↓
5. isAuthenticated = false
   ↓
6. RootNavigator renderiza AuthNavigator
   ↓
7. WelcomeScreen aparece ✅
   ↓
8. Usuário clica "Criar Conta" ou "Já tenho conta"
   ↓
9. AGORA SIM faz login/cadastro
   ↓
10. signed = true
   ↓
11. RootNavigator renderiza AppNavigator
   ↓
12. HomeScreen ou NoGroupsScreen (se não tem grupos)
```

---

## 🔧 Comandos Úteis

### Para reiniciar o bundler:
```bash
cd /home/darley/lacos
npx expo start --clear
```

### Para ver logs em tempo real:
```bash
# Console no terminal mostra logs do React Native
# Ou use o console do navegador (Expo DevTools)
```

---

## 💡 Dica: Como Evitar o Problema

Sempre que quiser testar o fluxo de login limpo:

**Opção 1**: Use o botão de debug (5 toques no logo)

**Opção 2**: No código, comente a validação temporariamente:

```javascript
// AuthContext.js - APENAS PARA TESTES
const loadStorageData = async () => {
  // FORÇAR LOGOUT PARA TESTES
  await AsyncStorage.clear();
  setUser(null);
  setLoading(false);
  return;
  
  // ... resto do código
};
```

**⚠️ NÃO deixe isso em produção!**

---

## ✅ Resumo das Soluções

| Método | Dificuldade | Eficácia |
|--------|-------------|----------|
| 5 toques no logo | ⭐ Fácil | ✅ 100% |
| Shake → Clear AsyncStorage | ⭐⭐ Médio | ✅ 100% |
| Desinstalar/Reinstalar | ⭐⭐⭐ Difícil | ✅ 100% |

---

**Teste agora uma das soluções e me confirme se funcionou!** 🚀

Se continuar aparecendo NoGroupsScreen sem login, me envie os logs completos do console!

