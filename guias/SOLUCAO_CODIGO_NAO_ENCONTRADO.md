# Solução: Código Não Encontrado 🔍

## Problema Reportado
Código `0VKXSPY1` não está sendo encontrado

---

## 🛠️ Solução Imediata: Use o Botão Debug

Adicionei um **botão de debug** na tela de login do paciente que mostra TODOS os códigos disponíveis.

### Como Usar:

1. **Abra o app**
2. **Escolha "Sou Paciente"**
3. **Na tela de código, role até o final**
4. **Clique em:** 🐛 **"Ver Códigos Disponíveis (Debug)"**
5. **Veja o alerta com TODOS os códigos salvos**

Isso vai mostrar:
- Quantos grupos existem
- Quais são os códigos exatos
- Se o código `0VKXSPY1` realmente existe

---

## 🔍 Possíveis Causas e Soluções

### **Causa 1: Grupo criado antes das correções**

**Sintoma:** Código antigo não funciona

**Solução:**
```
1. Delete o grupo "Rosa" (se existir)
2. Crie o grupo NOVAMENTE
3. Anote o NOVO código que aparecer
4. Use o novo código
```

---

### **Causa 2: Código digitado errado**

**Sintoma:** Você tem certeza do código mas não funciona

**Verificação:**
```
Código correto:  0VKXSPY1
                 ↑↑↑↑↑↑↑↑
Verifique letra por letra:
- É zero (0) ou letra O?
- É número 1 ou letra I/l?
```

**Dica:** Use o botão debug para copiar o código exato!

---

### **Causa 3: Grupos salvos em sessão antiga**

**Sintoma:** Grupo não aparece em lugar nenhum

**Solução - Limpar tudo e recomeçar:**

#### Opção A: Pelo Terminal
```bash
cd /home/darley/lacos
pkill -f "expo start"
npx expo start --clear
```

#### Opção B: No App
1. Faça logout
2. Desinstale o app
3. Reinstale o app
4. Crie o grupo novamente

---

## 📋 Passo a Passo Completo (Do Zero)

### **1. Verificar Códigos Existentes**

```
1. Abra o app
2. "Sou Paciente"
3. Clique "Ver Códigos Disponíveis (Debug)"
4. Anote TODOS os códigos mostrados
```

**Se aparecer o código `0VKXSPY1`:**
- ✅ Código existe! Use-o exatamente como está

**Se NÃO aparecer o código:**
- ❌ Código não está salvo
- 👉 Vá para Passo 2

---

### **2. Recriar o Grupo (Como Acompanhante)**

```
1. Abra o app (ou volte à tela inicial)
2. Escolha "Sou Acompanhante"
3. Faça login (se necessário)
4. Vá em "Grupos"
5. Clique no "+" para criar grupo
6. Preencha os dados:
   - Nome do acompanhado: [Seu nome]
   - Data de nascimento: [Data]
   - Sexo: [Escolha]
7. Clique "Próximo"
8. Nome do grupo: Rosa (ou qualquer nome)
9. Clique "Criar Grupo"
10. ⚠️ ATENÇÃO: Anote o código que aparecer no alerta!
```

**Exemplo do alerta:**
```
╔═══════════════════════════════════╗
║        Sucesso! 🎉                ║
║                                   ║
║ Grupo "Rosa" criado com sucesso!  ║
║                                   ║
║ Acompanhado: João                 ║
║ Código de pareamento: AB12CD34    ║ ← ESTE É O CÓDIGO!
║                                   ║
║ Use este código para o paciente   ║
║ acessar o aplicativo.             ║
╚═══════════════════════════════════╝
```

---

### **3. Verificar o Código nas Configurações**

```
1. Ainda como acompanhante
2. Tela de "Grupos"
3. Clique no grupo "Rosa"
4. No TOPO da tela, veja o código
5. Confirme que é o MESMO código do alerta
```

**Deve aparecer assim:**
```
╔════════════════════════════════╗
║ 🔑 Código do Paciente          ║
║                                ║
║ Código: AB12CD34               ║ ← Confirme aqui!
║                                ║
║ [Copiar] [Compartilhar]        ║
╚════════════════════════════════╝
```

**Dica:** Clique em "Copiar" para copiar o código exato!

---

### **4. Testar Como Paciente**

```
1. Faça logout (ou use outro dispositivo)
2. Abra o app
3. Escolha "Sou Paciente"
4. Digite o código EXATAMENTE como está
5. Clique "Entrar"
```

**Se ainda não funcionar:**
- Clique no botão debug
- Compare o código que você digitou com os códigos listados

---

## 🐛 Debug Avançado

### **Verificar nos Logs do Terminal**

Quando você tenta fazer login, o terminal deve mostrar:

```
Código digitado: 0VKXSPY1
Grupos encontrados: [...]
Grupos parseados: [...]
Códigos disponíveis: ["ABC123", "XYZ789"]
Comparando: "ABC123" com "0VKXSPY1"
Comparando: "XYZ789" com "0VKXSPY1"
Grupo encontrado: undefined
```

**O que verificar:**
- "Códigos disponíveis" mostra TODOS os códigos salvos
- Se `0VKXSPY1` NÃO estiver na lista → Código não está salvo
- Se `0VKXSPY1` ESTIVER na lista → Pode ser problema de digitação

---

## ✅ Checklist de Verificação

- [ ] Usei o botão debug para ver códigos disponíveis
- [ ] O código `0VKXSPY1` aparece na lista?
- [ ] Se sim: digitei EXATAMENTE igual (com zeros e uns corretos)?
- [ ] Se não: recrei o grupo como acompanhante?
- [ ] Anotei o NOVO código que apareceu?
- [ ] Verifiquei o código nas Configurações do grupo?
- [ ] Testei com o NOVO código?

---

## 🎯 Solução Definitiva

**Se nada funcionar, faça isso:**

```
1. Como Acompanhante:
   - Delete TODOS os grupos
   - Crie UM grupo novo
   - Anote o código que aparecer
   - Vá em Configurações do grupo
   - COPIE o código (botão Copiar)

2. Como Paciente:
   - Use o botão Debug
   - Confirme que o código está lá
   - COLE o código copiado
   - Entre
```

---

## 📞 Ainda Não Funciona?

**Envie essas informações:**

1. O que o botão Debug mostra? (screenshot ou texto)
2. Qual código você está tentando usar?
3. O código aparece na lista do Debug?
4. O que aparece nos logs do terminal quando tenta entrar?

---

**Teste agora com o botão Debug e me avise o que ele mostra!** 🔍

