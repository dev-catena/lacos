# 🐛 Debug - Erro ao Salvar Consultas

## ❌ Erro Atual
```
ERROR API Error: {"errors": {"type": ["The type field is required."]}, "message": "The type field is required.", "status": 422}
```

---

## ✅ Correções Aplicadas

### 1. **Melhor Tratamento de Dados**
Agora os campos obrigatórios (`group_id`, `type`, `title`, `consultation_date`, `is_urgent`) **nunca são deletados**.

### 2. **Validação Adicional**
Adicionada validação para garantir que o campo `type` está preenchido antes de enviar.

### 3. **Logs Detalhados**
Adicionados logs em múltiplos pontos para rastrear o fluxo de dados:

```javascript
📋 Dados do formulário antes de salvar
🏥 Group ID
📤 Enviando consulta
🔵 consultationService.createConsultation - Dados enviados
✅ ou ❌ Resposta da API
```

---

## 🧪 Como Testar e Ver os Logs

### Passo 1: Recarregar o App
```bash
# No terminal onde o Expo está rodando, pressione 'r' para reload
# Ou feche e abra o app novamente
```

### Passo 2: Ir para Consultas
1. Abra o app
2. Entre em um grupo
3. Clique em **"Consultas"**
4. Clique no botão **"+"** (adicionar)

### Passo 3: Preencher o Formulário
1. **Tipo de Consulta**: Verifique se algum tipo está selecionado (deve ser "Urgência" por padrão)
2. **Título**: Digite qualquer título (ex: "Teste de Consulta")
3. **Data/Hora**: Deixe a data atual ou escolha outra
4. Clique em **"Salvar Consulta"**

### Passo 4: Ver os Logs
No terminal do Expo, você deve ver algo como:

```
📋 Dados do formulário antes de salvar: {
  type: 'urgency',
  title: 'Teste de Consulta',
  doctorName: '',
  ...
}
🏥 Group ID: 1
📤 Enviando consulta: {
  group_id: 1,
  type: 'urgency',
  title: 'Teste de Consulta',
  consultation_date: '2025-11-23T...',
  is_urgent: true
}
🔵 consultationService.createConsultation - Dados enviados: {...}
```

---

## 🔍 O Que Procurar nos Logs

### Cenário 1: `type` está vazio
Se você ver:
```
type: ''
```
ou
```
type: undefined
```

**Problema**: O estado inicial não está sendo setado corretamente.

**Solução**: Verificar se há algo resetando o `formData` após o componente montar.

---

### Cenário 2: `type` está OK mas ainda dá erro
Se você ver:
```
type: 'urgency'
```
Mas o erro persiste...

**Problema**: O campo pode estar sendo removido no caminho para a API.

**Solução**: Verificar os logs do `consultationService` para ver exatamente o que está sendo enviado.

---

### Cenário 3: Dados enviados estão corretos
Se você ver:
```
🔵 consultationService.createConsultation - Dados enviados: {
  group_id: 1,
  type: 'urgency',
  ...
}
```

**Problema**: O erro pode estar vindo do backend (migração não rodada ou problema de validação).

**Solução**: Verificar se as migrations foram rodadas no servidor.

---

## 🚀 Verificar Backend (Servidor)

Se os dados estão sendo enviados corretamente mas o erro persiste, verifique no servidor:

```bash
# Conectar ao servidor
ssh seu_usuario@207.244.235.147

# Ir para o diretório do backend
cd lacos-api

# Verificar se as migrations foram rodadas
php artisan migrate:status

# Se a tabela consultations não existe ou está incompleta:
git pull origin backend
php artisan migrate --force
php artisan cache:clear

# Verificar a estrutura da tabela
mysql -u lacos -p lacos
DESCRIBE consultations;
```

A tabela `consultations` deve ter:
- `id`
- `group_id`
- `type` (string, not null)
- `medical_specialty_id` (nullable)
- `title` (string, not null)
- `doctor_name` (nullable)
- `consultation_date` (datetime, not null)
- `location` (nullable)
- `summary` (nullable, text)
- `diagnosis` (nullable, text)
- `treatment` (nullable, text)
- `notes` (nullable, text)
- `is_urgent` (boolean, default false)
- `created_at`
- `updated_at`

---

## 📊 Valores Aceitos para `type`

O backend aceita **apenas** estes valores:
- `medical`
- `fisioterapia`
- `exames`
- `urgency`

Qualquer outro valor resultará em erro de validação.

---

## 🔧 Se o Problema Persistir

### 1. Verificar Estado Inicial
Adicione um `console.log` logo após o `useState`:

```javascript
const [formData, setFormData] = useState({
  type: 'urgency',
  ...
});

console.log('🎬 Estado inicial do formData:', formData);
```

### 2. Verificar Atualizações de Estado
No `updateField`, adicione log:

```javascript
const updateField = (field, value) => {
  console.log(`📝 Atualizando campo "${field}" para:`, value);
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

### 3. Testar Endpoint Diretamente
Teste a API diretamente com `curl`:

```bash
curl -X POST http://207.244.235.147/api/consultations \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": 1,
    "type": "urgency",
    "title": "Teste via curl",
    "consultation_date": "2025-11-23 15:00:00",
    "is_urgent": true
  }'
```

---

## ✅ Checklist de Debug

- [ ] Reload do app feito
- [ ] Console do Expo aberto e visível
- [ ] Tipo de consulta selecionado (visual)
- [ ] Título preenchido
- [ ] Log "📋 Dados do formulário" apareceu
- [ ] Log "📤 Enviando consulta" apareceu
- [ ] Campo `type` tem valor nos logs
- [ ] Campo `type` não é string vazia
- [ ] Migrations rodadas no servidor
- [ ] Tabela `consultations` existe
- [ ] Endpoint `/api/consultations` funciona com curl

---

## 📞 Próximos Passos

Depois de testar e ver os logs, me envie:
1. Os logs completos do console (copie e cole)
2. Se o erro persiste, qual mensagem aparece
3. Print da tela de cadastro mostrando o tipo selecionado

Com essas informações posso identificar exatamente onde está o problema! 🔍

