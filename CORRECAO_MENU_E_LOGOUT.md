# Correção: Menu e Logout ✅

## Problemas Corrigidos

### 1. ❌ **Aplicação fechando ao clicar nos ícones do menu**
**Causa:** Possível erro ao renderizar os ícones customizados do tab bar

**Solução:**
- ✅ Adicionado tratamento de erro (try/catch) na renderização dos ícones
- ✅ Valores padrão para size e color
- ✅ Proteção contra valores undefined/null

### 2. 🚪 **Logout não voltava para tela de seleção**
**Causa:** Sessão do paciente não estava sendo limpa

**Solução:**
- ✅ Logout agora limpa TODAS as sessões (acompanhante E paciente)
- ✅ Remove `@lacos:user`, `@lacos:token` e `@lacos_patient_session`
- ✅ Mensagem de confirmação mais clara
- ✅ Retorna para tela de seleção (Paciente ou Acompanhante)

---

## 🔧 Mudanças Implementadas

### **AppNavigator.js**
```javascript
// ANTES: Sem proteção
tabBarIcon: ({ focused, color, size }) => {
  if (route.name === 'Home') {
    return <HomeIcon size={size} color={color} filled={focused} />;
  }
}

// DEPOIS: Com proteção
tabBarIcon: ({ focused, color, size }) => {
  const iconSize = size || 24;
  const iconColor = color || colors.gray400;
  
  try {
    if (route.name === 'Home') {
      return <HomeIcon size={iconSize} color={iconColor} filled={focused} />;
    }
  } catch (error) {
    console.error('Error rendering icon:', error);
    return null;
  }
}
```

### **AuthContext.js**
```javascript
// ANTES: Limpava apenas dados do acompanhante
await AsyncStorage.removeItem('@lacos:user');
await AsyncStorage.removeItem('@lacos:token');

// DEPOIS: Limpa TUDO
await AsyncStorage.removeItem('@lacos:user');
await AsyncStorage.removeItem('@lacos:token');
await AsyncStorage.removeItem('@lacos_patient_session'); // ← NOVO
```

### **ProfileScreen.js**
```javascript
// Mensagem melhorada no alerta de logout
Alert.alert(
  'Sair da Conta',
  'Ao sair, você retornará à tela inicial onde poderá ' +
  'escolher entre entrar como Paciente ou Acompanhante novamente.\n\n' +
  'Deseja continuar?',
  ...
);
```

---

## 🎯 Como Funciona Agora

### **Fluxo de Logout:**

```
1. Usuário clica em "Sair da Conta" no Perfil
   ↓
2. Alerta aparece explicando o que vai acontecer
   ↓
3. Usuário confirma "Sair"
   ↓
4. Sistema limpa:
   - ✅ Dados do acompanhante
   - ✅ Token de autenticação
   - ✅ Sessão do paciente (se houver)
   ↓
5. Retorna para tela de seleção:
   ┌─────────────────────────┐
   │   Laços (Logo)          │
   │                         │
   │ [Sou Paciente]          │
   │ [Sou Acompanhante]      │
   └─────────────────────────┘
```

---

## 🧪 Como Testar

### **Teste 1: Menu não fecha mais**

1. **Abra o app**
2. **Clique em cada ícone do menu:**
   - 🏠 Home
   - 👥 Grupos
   - 🔔 Notificações
   - 👤 Perfil
3. ✅ **Deve navegar normalmente SEM fechar o app**

---

### **Teste 2: Logout funciona corretamente**

#### **Cenário A: Logout como Acompanhante**
```
1. Login como acompanhante
2. Vá em Perfil (última aba)
3. Role até o final
4. Clique em "Sair da Conta" (botão vermelho)
5. Leia o alerta
6. Confirme "Sair"
7. ✅ Deve voltar para tela de seleção
8. ✅ Pode escolher Paciente ou Acompanhante
```

#### **Cenário B: Entrar como Paciente após Logout**
```
1. Após fazer logout (Cenário A)
2. Na tela de seleção, clique "Sou Paciente"
3. Digite o código do grupo
4. ✅ Deve entrar na interface do paciente
5. ✅ Logout do paciente também funciona
```

#### **Cenário C: Entrar como Acompanhante novamente**
```
1. Após fazer logout (Cenário A)
2. Na tela de seleção, clique "Sou Acompanhante"
3. Faça login
4. ✅ Deve entrar normalmente
5. ✅ Grupos ainda estão salvos
```

---

## 🐛 Debug: Se Ainda Houver Problemas

### **Se o app ainda fechar ao clicar no menu:**

1. **Verifique o terminal do Expo:**
   ```
   Procure por erros tipo:
   - "Error rendering icon"
   - "undefined is not an object"
   - "Cannot read property 'size'"
   ```

2. **Recarregue o app:**
   - Sacuda o dispositivo
   - Clique "Reload"

3. **Limpe o cache:**
   ```bash
   cd /home/darley/lacos
   pkill -f "expo start"
   npx expo start --clear
   ```

---

### **Se o logout não voltar para tela de seleção:**

1. **Verifique se está na versão correta:**
   ```
   O RootNavigator deve mostrar:
   - signed=true → AppNavigator (tabs)
   - signed=false → AuthNavigator (tela de seleção)
   ```

2. **Force limpar dados:**
   ```javascript
   // No console do navegador (Debug Remote JS):
   AsyncStorage.clear().then(() => {
     console.log('Tudo limpo!');
   });
   ```

---

## 📱 Interface do Botão Sair

### **Localização:**
```
App → Tab "Perfil" → Role até o final
```

### **Aparência:**
```
┌──────────────────────────────────────┐
│                                      │
│  🚪  Sair da Conta               →  │ ← Vermelho
│      Voltar à tela inicial          │
│                                      │
└──────────────────────────────────────┘
```

### **Ao clicar:**
```
┌─────────────────────────────────────┐
│          Sair da Conta              │
├─────────────────────────────────────┤
│                                     │
│ Ao sair, você retornará à tela      │
│ inicial onde poderá escolher entre  │
│ entrar como Paciente ou             │
│ Acompanhante novamente.             │
│                                     │
│ Deseja continuar?                   │
│                                     │
│     [Cancelar]        [Sair]        │
└─────────────────────────────────────┘
```

---

## ✅ Checklist de Verificação

- [ ] App não fecha ao clicar nos ícones do menu
- [ ] Logout limpa todas as sessões
- [ ] Volta para tela de seleção após logout
- [ ] Pode escolher Paciente ou Acompanhante
- [ ] Pode fazer login novamente como acompanhante
- [ ] Pode fazer login como paciente com código
- [ ] Grupos continuam salvos após logout

---

## 🎉 Resultado Esperado

### **Ícones do Menu:**
- ✅ Navegação suave entre abas
- ✅ Sem crashes
- ✅ Ícones aparecem corretamente
- ✅ Animação de ativo/inativo funciona

### **Logout:**
- ✅ Botão grande e visível no final do Perfil
- ✅ Alerta claro explicando o que acontece
- ✅ Limpa todas as sessões
- ✅ Retorna para tela de seleção
- ✅ Pode entrar como Paciente ou Acompanhante

---

**Status:** ✅ Corrigido e Testável
**Data:** 22/11/2025
**Arquivos Modificados:**
- `AppNavigator.js`
- `AuthContext.js`
- `ProfileScreen.js`

