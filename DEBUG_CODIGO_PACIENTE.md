# Debug - Problema do Código do Paciente 🔍

## Problemas Corrigidos

### 1. ✅ Layout da Tela Inicial
- Diminuído tamanho dos cards
- Ajustado espaçamentos
- Cards não sobrepõem mais a frase

### 2. 🔧 Validação do Código
- Adicionados logs de debug
- Comparação case-insensitive
- Mensagem de erro mais detalhada

---

## Como Testar Agora

### 1️⃣ **Verificar os Logs**

Abra o terminal onde o Expo está rodando e observe os logs quando:

**Ao criar grupo:**
```
Grupo criado: { id: "...", code: "43AY1501", ... }
Código gerado: 43AY1501
Todos os grupos salvos: [...]
```

**Ao tentar login do paciente:**
```
Código digitado: 43AY1501
Grupos encontrados: [...]
Grupos parseados: [...]
Códigos disponíveis: ["43AY1501"]
Comparando: "43AY1501" com "43AY1501"
Grupo encontrado: { ... }
```

---

## 🧹 Solução: Limpar e Recriar

Se o código continuar inválido, pode ser que há dados antigos. Vamos limpar:

### Opção A: Via React Native Debugger

1. Abra o menu do Expo no app (sacuda o dispositivo)
2. "Debug Remote JS"
3. No console do navegador:
   ```javascript
   AsyncStorage.clear()
   ```
4. Recarregue o app

### Opção B: Reinstalar o App

1. Desinstale o app do dispositivo
2. Feche o Expo
3. `npx expo start --clear`
4. Reinstale o app

### Opção C: Código de Limpeza (Temporário)

Adicione temporariamente no `PatientLoginScreen.js`, logo após os imports:

```javascript
// TEMPORÁRIO - REMOVER DEPOIS
import AsyncStorage from '@react-native-async-storage/async-storage';

const clearData = async () => {
  await AsyncStorage.removeItem('@lacos_groups');
  alert('Dados limpos!');
};

// Adicione um botão na tela:
<TouchableOpacity onPress={clearData}>
  <Text>Limpar Dados (DEBUG)</Text>
</TouchableOpacity>
```

---

## 🧪 Passos para Testar Completo

### 1. Limpar Dados (se necessário)
```
Use uma das opções acima
```

### 2. Criar Novo Grupo
```
1. Abra o app
2. Escolha "Sou Acompanhante"
3. Login (se necessário)
4. Vá em "Grupos"
5. Crie grupo "Rosa"
6. OBSERVE O CÓDIGO no alerta
7. ANOTE o código exibido (ex: 43AY1501)
```

### 3. Verificar Código nas Configurações
```
1. Na tela de Grupos
2. Clique no grupo "Rosa"
3. Veja o código no topo
4. Confirme que é o mesmo código
```

### 4. Testar Login do Paciente
```
1. Volte à tela inicial (ou abra outro dispositivo)
2. Escolha "Sou Paciente"
3. Digite o código EXATAMENTE como viu
4. Clique "Entrar"
```

### 5. Verificar Logs
```
Observe no terminal:
- Código digitado
- Códigos disponíveis
- Se encontrou match
```

---

## 🔍 Diagnóstico

### Se ver nos logs:

**Caso 1: Código não encontrado nos grupos**
```
Grupos encontrados: null
```
**Solução:** O grupo não foi salvo. Recrie o grupo.

**Caso 2: Código diferente**
```
Código digitado: "43AY1501"
Códigos disponíveis: ["OUTRO_CODIGO"]
```
**Solução:** Use o código correto ou recrie o grupo.

**Caso 3: Comparação falha**
```
Comparando: "43AY1501" com "43AY1501"
Grupo encontrado: undefined
```
**Solução:** Bug na comparação (já corrigido no código atual).

---

## 📋 Checklist de Verificação

- [ ] App foi recarregado após as mudanças
- [ ] Terminal do Expo está aberto e visível
- [ ] Grupo foi criado APÓS as correções
- [ ] Código foi copiado corretamente (sem espaços)
- [ ] Código está em maiúsculas
- [ ] Verificou o código nas Configurações do grupo

---

## 🆘 Se Ainda Não Funcionar

### Envie as seguintes informações:

1. **Logs do Terminal** ao criar grupo:
   ```
   Cole aqui os logs que aparecem
   ```

2. **Logs do Terminal** ao tentar login:
   ```
   Cole aqui os logs que aparecem
   ```

3. **Código mostrado no alerta** ao criar grupo

4. **Código digitado** na tela de login

5. **Mensagem de erro** exata que aparece

---

## 🔧 Código de Debug Completo

Se quiser adicionar um botão de debug na tela de login do paciente:

```javascript
// Adicione no PatientLoginScreen, antes do return:

const debugInfo = async () => {
  const groups = await AsyncStorage.getItem('@lacos_groups');
  const parsed = groups ? JSON.parse(groups) : [];
  Alert.alert(
    'Debug Info',
    `Grupos: ${parsed.length}\n` +
    `Códigos: ${parsed.map(g => g.code).join(', ')}\n\n` +
    `Você digitou: ${code}`
  );
};

// Adicione o botão na interface:
<TouchableOpacity onPress={debugInfo} style={styles.debugButton}>
  <Text>Debug</Text>
</TouchableOpacity>
```

---

## ✅ Após Resolver

Quando estiver funcionando, remova os console.log adicionados:
- `PatientLoginScreen.js` (linhas com console.log)
- `CreateGroupScreen.js` (linhas com console.log)

---

**Última Atualização:** Código com logs de debug e validação melhorada
**Status:** Aguardando teste com logs

