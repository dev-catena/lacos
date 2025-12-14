# 🧪 Como Testar o Autocomplete de Endereços

Este guia mostra como testar o Google Places Autocomplete no app.

---

## 📱 Teste Rápido (Sem API Key)

Se você ainda não configurou a API Key, o app vai funcionar com um **campo de texto manual**:

1. Abra o app
2. Vá em: **Agenda** → **+ Novo Compromisso**
3. No campo **"Endereço"**, você verá:
   - 🟡 Ícone de ajuda (ⓘ) ao lado do label
   - Campo de texto normal para digitar manualmente
   - Botões Google Maps e Waze (aparecem após digitar)

**Para configurar o autocomplete:**
1. Clique no ícone ⓘ ao lado de "Endereço"
2. Siga as instruções
3. Configure a API Key em `src/config/maps.js`

---

## 🗺️ Teste Completo (Com API Key)

### 1. Configure a API Key

Siga o guia: [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md)

### 2. Reinicie o App

```bash
npx expo start --clear
```

### 3. Teste o Autocomplete

1. Abra o app no seu dispositivo
2. Vá em: **Agenda** → **+ Novo Compromisso**
3. No campo **"Endereço"**, você verá:
   - ✅ Campo com autocomplete ativo
   - SEM ícone de ajuda (ⓘ)

**Digite um endereço:**
- Digite pelo menos **3 caracteres**
- Exemplo: "Av P"
- Aguarde 400ms (debounce)
- Sugestões aparecerão abaixo

**Selecione uma sugestão:**
- Toque em uma das sugestões
- O endereço completo será preenchido
- Botões Google Maps e Waze aparecerão

### 4. Teste os Botões de Navegação

**Google Maps:**
1. Clique no botão "Google Maps"
2. O app de mapas deve abrir (ou o site se o app não estiver instalado)
3. O endereço deve estar pré-carregado

**Waze:**
1. Clique no botão "Waze"
2. O Waze deve abrir (ou o site)
3. O endereço deve estar pré-carregado

---

## 🐛 Cenários de Teste

### ✅ Teste 1: API Key não configurada
- **Esperado**: Campo manual + ícone de ajuda
- **Ação**: Clicar no ⓘ mostra instruções

### ✅ Teste 2: API Key configurada
- **Esperado**: Autocomplete funcional
- **Ação**: Digitar mostra sugestões

### ✅ Teste 3: API Key inválida
- **Esperado**: Console mostra erro
- **Ação**: Nenhuma sugestão aparece

### ✅ Teste 4: Sem internet
- **Esperado**: Campo aceita texto manual
- **Ação**: Nenhuma sugestão aparece

### ✅ Teste 5: Endereço selecionado
- **Esperado**: Botões Maps/Waze aparecem
- **Ação**: Clicar abre o app de navegação

### ✅ Teste 6: Limpar endereço
- **Esperado**: Botões Maps/Waze desaparecem
- **Ação**: Campo volta ao estado inicial

---

## 📊 Exemplos de Endereços para Testar

### Brasil:
- "Av Paulista"
- "Praça da Sé"
- "Copacabana"
- "Centro, São Paulo"
- "Pelourinho, Salvador"

### Endereços Específicos:
- "Rua Augusta 1500"
- "Av Brasil 1000"
- "Shopping Iguatemi"
- "Aeroporto Guarulhos"

---

## 🔍 Verificar no Console

### Console do Expo (Terminal):

**Sucesso:**
```
Enviando para API: {groupId: 1, title: "Consulta", ...}
✅ Compromisso agendado!
```

**API Key não configurada:**
```
⚠️ Google Maps não configurado
```

**API Key inválida:**
```
ERROR: This API project is not authorized to use this API
```

### Chrome DevTools (se testando no navegador):

1. Abra: `F12` → `Console`
2. Busque por: `Google Places`
3. Veja mensagens de erro/sucesso

---

## 📸 Screenshots Esperados

### Sem API Key (Modo Manual):
```
┌──────────────────────────────────┐
│  Endereço (opcional)        ⓘ   │
│  ┌────────────────────────────┐  │
│  │ 📍 Digite o endereço...    │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Com API Key (Autocomplete):
```
┌──────────────────────────────────┐
│  Endereço (opcional)             │
│  ┌────────────────────────────┐  │
│  │ 📍 Av P|                   │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ Av Paulista, São Paulo     │  │
│  │ Av Padre Lebret, Santos    │  │
│  │ Av Pompeia, São Paulo      │  │
│  └────────────────────────────┘  │
│                                  │
│  [🧭 Google Maps] [🧭 Waze]     │
└──────────────────────────────────┘
```

---

## ⚡ Performance

O autocomplete está otimizado com:
- ✅ **Debounce de 400ms**: Aguarda o usuário parar de digitar
- ✅ **Mínimo 3 caracteres**: Evita buscas desnecessárias
- ✅ **Cache**: Reutiliza resultados recentes
- ✅ **Região prioritária**: Prioriza Brasil (`country:br`)

---

## 🎯 Checklist de Teste

- [ ] App abre sem erros
- [ ] Navegar para "Nova Consulta"
- [ ] Ver campo de endereço (manual ou autocomplete)
- [ ] Digitar 3 caracteres
- [ ] Ver sugestões (se API Key configurada)
- [ ] Selecionar uma sugestão
- [ ] Ver botões Google Maps e Waze
- [ ] Clicar em Google Maps (abre o app)
- [ ] Clicar em Waze (abre o app)
- [ ] Salvar o compromisso
- [ ] Ver toast de sucesso

---

## 💡 Dicas

1. **Primeira vez testando**: Use o modo manual primeiro
2. **Configure a API Key**: Siga GOOGLE_MAPS_SETUP.md
3. **Monitore o console**: Veja logs de erro/sucesso
4. **Teste em dispositivo real**: O simulador pode ter limitações
5. **Verifique a internet**: Autocomplete requer conexão

---

**Pronto para testar!** 🚀

Se tiver problemas, consulte a seção de **Solução de Problemas** em `GOOGLE_MAPS_SETUP.md`.

