# 🚨 Botão de Pânico - Documentação Completa

## Visão Geral

O Botão de Pânico é uma funcionalidade crítica de segurança que permite ao paciente (pessoa acompanhada) acionar rapidamente uma chamada de emergência com um simples toque prolongado de 5 segundos.

---

## 🎯 Funcionalidades Implementadas

### ✅ Backend (API)

#### Tabela `panic_events`
```sql
- id: ID único do evento
- group_id: Grupo vinculado
- user_id: Usuário que acionou
- trigger_type: 'manual' ou 'voice'
- latitude: Coordenada GPS
- longitude: Coordenada GPS
- location_address: Endereço formatado
- call_duration: Duração da chamada (segundos)
- call_status: 'ongoing', 'completed', 'cancelled'
- notes: Observações
- created_at: Data/hora do acionamento
- updated_at: Última atualização
```

#### Campos Adicionados
- **`groups.panic_enabled`**: Habilita/desabilita botão por grupo
- **`group_members.is_emergency_contact`**: Define contatos prioritários

#### Rotas API
```
POST   /api/panic/trigger              - Acionar pânico
PUT    /api/panic/{eventId}/end-call   - Finalizar chamada
GET    /api/panic                       - Listar eventos
GET    /api/panic/config/{groupId}     - Verificar configuração
```

### ✅ Frontend (React Native)

#### Componente `PanicButton`

**Localização**: `src/components/PanicButton.js`

**Props**:
- `groupId` (obrigatório): ID do grupo
- `onPanicTriggered` (opcional): Callback quando pânico é acionado

**Estados**:
1. **Normal**: Botão vermelho flutuante com ícone SOS
2. **Holding (5s)**: Animação de expansão progressiva
3. **Chamada Ativa**: Tela cheia vermelha com controles

**Funcionalidades**:
- ✅ Animação de hold por 5 segundos
- ✅ Expansão progressiva até ocupar toda a tela
- ✅ Captura automática de localização GPS
- ✅ Reverse geocoding (endereço legível)
- ✅ Ligação automática para contato prioritário
- ✅ Interface de chamada ativa com pulso
- ✅ Botão "Desligar" com ícone de telefone
- ✅ Registro de duração da chamada
- ✅ Toast de confirmação

#### Service `panicService`

**Localização**: `src/services/panicService.js`

**Métodos**:
```javascript
panicService.trigger(data)        // Acionar pânico
panicService.endCall(eventId, data) // Finalizar chamada
panicService.getEvents(groupId)   // Listar eventos
panicService.checkConfig(groupId) // Verificar config
```

#### Integração com `PatientHomeScreen`

- Botão flutuante fixo no canto inferior direito
- Posicionamento absoluto com `zIndex: 1000`
- Apenas visível quando `groupId` está definido
- Espaçamento de 24px das bordas

---

## 🔒 Permissões Necessárias

### iOS (`app.json`)
```json
"ios": {
  "infoPlist": {
    "NSLocationWhenInUseUsageDescription": "Precisamos da sua localização para enviar aos contatos de emergência quando você acionar o botão de pânico.",
    "NSLocationAlwaysUsageDescription": "Permite enviar sua localização em emergências."
  }
}
```

### Android (`app.json`)
```json
"android": {
  "permissions": [
    "ACCESS_FINE_LOCATION",
    "ACCESS_COARSE_LOCATION",
    "CALL_PHONE"
  ]
}
```

---

## 🎨 Fluxo de Uso

### 1. Acionamento Manual

```
1. Paciente pressiona e SEGURA o botão vermelho SOS
   ↓
2. Animação de 5 segundos começa (botão expande)
   Texto: "SEGURE PARA ACIONAR PÂNICO"
   Barra de progresso branca
   ↓
3. Se soltar antes de 5s → Cancela (volta ao normal)
   ↓
4. Se completar 5s → Aciona pânico:
   - Captura localização GPS
   - Converte para endereço (reverse geocoding)
   - Envia dados para API
   - Recebe lista de contatos de emergência
   - Inicia ligação para primeiro contato
   ↓
5. Tela muda para modo "Chamada Ativa":
   - Fundo vermelho sólido
   - Ícone SOS pulsando
   - Nome do contato sendo chamado
   - Botão "Desligar" (telefone invertido)
   ↓
6. Ao desligar:
   - Registra duração da chamada
   - Atualiza status no backend
   - Volta para tela normal
   - Toast de confirmação
```

### 2. Interface de Chamada Ativa

```
┌─────────────────────────────┐
│                             │
│        [SOS PULSANDO]       │ ← Animação de pulso
│                             │
│  Chamada de Emergência      │
│        Ativa                │
│                             │
│  Conectado: Dr. João Silva  │ ← Nome do contato
│                             │
│                             │
│     [📞 Desligar]           │ ← Botão branco
│                             │
└─────────────────────────────┘
```

---

## 📊 Dados Enviados ao Backend

### Ao Acionar Pânico (`POST /api/panic/trigger`)

```json
{
  "group_id": 1,
  "trigger_type": "manual",
  "latitude": -23.550520,
  "longitude": -46.633309,
  "location_address": "Av. Paulista, 1578, Bela Vista, São Paulo - SP"
}
```

**Resposta**:
```json
{
  "success": true,
  "message": "Pânico acionado com sucesso",
  "data": {
    "panic_event": {
      "id": 42,
      "group_id": 1,
      "user_id": 15,
      "trigger_type": "manual",
      "latitude": "-23.55052000",
      "longitude": "-46.63330900",
      "location_address": "Av. Paulista, 1578...",
      "call_status": "ongoing",
      "created_at": "2025-11-23T18:45:30.000000Z"
    },
    "emergency_contacts": [
      {
        "id": 3,
        "user_id": 12,
        "is_emergency_contact": true,
        "user": {
          "id": 12,
          "name": "Dr. João Silva",
          "phone": "+5511987654321"
        }
      }
    ]
  }
}
```

### Ao Finalizar Chamada (`PUT /api/panic/{eventId}/end-call`)

```json
{
  "status": "completed",
  "duration": 127,  // segundos
  "notes": null
}
```

---

## 🔧 Configuração no Backend (Servidor)

### Verificar se Backend está Configurado

```bash
# No servidor (207.244.235.147)
mysql lacos -e "DESCRIBE panic_events;"
mysql lacos -e "SELECT * FROM panic_events LIMIT 5;"
php artisan route:list | grep panic
```

### Habilitar Botão de Pânico para um Grupo

```sql
UPDATE `groups` SET panic_enabled = TRUE WHERE id = 1;
```

### Definir Contato de Emergência

```sql
UPDATE group_members 
SET is_emergency_contact = TRUE 
WHERE group_id = 1 AND user_id = 12;
```

---

## 🧪 Como Testar

### 1. Configuração Inicial

```bash
# No servidor
mysql lacos << 'SQL'
UPDATE `groups` SET panic_enabled = TRUE WHERE id = 1;
UPDATE group_members SET is_emergency_contact = TRUE 
WHERE group_id = 1 LIMIT 1;
SQL
```

### 2. Teste no App

1. **Abrir como Paciente**:
   ```
   Home → Perfil → "Entrar como Paciente"
   Código: [código do grupo]
   ```

2. **Localizar Botão**:
   - Botão vermelho SOS no canto inferior direito
   - Sempre visível (flutuante)

3. **Testar Acionamento**:
   - Pressionar e SEGURAR por 5 segundos
   - Observar animação de expansão
   - Observar mudança de texto
   - Observar barra de progresso

4. **Testar Cancelamento**:
   - Pressionar e SEGURAR
   - Soltar ANTES de completar 5 segundos
   - Botão deve voltar ao normal

5. **Testar Acionamento Completo**:
   - Segurar por 5 segundos até o fim
   - Observar tela vermelha
   - Verificar se ligação é iniciada
   - Testar botão "Desligar"

6. **Verificar Localização**:
   ```bash
   # No servidor
   mysql lacos -e "SELECT * FROM panic_events ORDER BY id DESC LIMIT 1;"
   ```

### 3. Verificar Logs

```bash
# No dispositivo (Expo)
# Ver console para:
- "Pânico acionado:"
- Dados da localização
- Contatos de emergência
```

---

## 🚀 Melhorias Futuras (Não Implementadas)

### 1. Reconhecimento de Voz
- Palavra-chave personalizada (ex: "socorro", "ajuda")
- Detecção de 3 repetições consecutivas
- Acionamento automático

### 2. Configurações no GroupSettings
- Toggle para habilitar/desabilitar botão
- Definir contatos prioritários
- Testar botão de pânico
- Configurar palavra-chave de voz

### 3. Timeline de Eventos
- Visualização de histórico de acionamentos
- Mapa com localização do evento
- Duração das chamadas
- Status (completado, cancelado)

### 4. Notificações Push
- Notificar TODOS os membros do grupo
- Som de alerta diferenciado
- Vibração contínua
- Prioridade alta

### 5. Chamadas Sequenciais
- Se primeiro contato não atender
- Ligar automaticamente para próximo
- Tentativas configuráveis

---

## 📱 Dependências

```json
{
  "expo-location": "^18.0.6",  // GPS e reverse geocoding
  "react-native": "0.76.6",
  "expo": "~54.0.5"
}
```

---

## ⚠️ Considerações de Segurança

1. **Localização sempre atualizada**: Captura em tempo real
2. **Registro permanente**: Todos os eventos ficam no banco
3. **Ligação imediata**: Sem confirmações extras
4. **Cancelamento fácil**: Soltar o dedo antes de 5s
5. **Visual claro**: Tela vermelha inconfundível

---

## 📝 Logs e Debugging

### Console.log no Componente
```javascript
'Pânico acionado:'           // Quando completa 5s
'Erro ao acionar pânico:'    // Erros na API
'Erro ao fazer chamada:'     // Erros ao ligar
'Erro ao finalizar chamada:' // Erros ao desligar
```

### Toast Messages
- 🚨 "PÂNICO ACIONADO" (erro/vermelho)
- ✅ "Chamada finalizada" (sucesso)
- ❌ "Erro ao acionar pânico" (erro)
- ❌ "Não foi possível iniciar a chamada" (erro)

---

## 🎯 Casos de Uso

✅ **Implementado** (Caso de Uso 14):
- Acionamento manual com hold de 5s
- Captura de localização automática
- Ligação para contato prioritário
- Registro permanente no banco
- Interface de chamada ativa
- Botão desligar funcional
- Registro de duração da chamada

❌ **Não Implementado**:
- Acionamento por voz
- Notificação para todos os membros
- Configuração via interface
- Histórico na timeline
- Tentativas de ligação múltiplas

---

## 🔗 Arquivos Relacionados

### Frontend
- `src/components/PanicButton.js` - Componente principal
- `src/services/panicService.js` - Comunicação com API
- `src/screens/Patient/PatientHomeScreen.js` - Integração

### Backend
- `app/Models/PanicEvent.php` - Model Eloquent
- `app/Http/Controllers/Api/PanicController.php` - Controller
- `routes/api.php` - Rotas da API
- Tabela: `panic_events`
- Tabela: `groups` (panic_enabled)
- Tabela: `group_members` (is_emergency_contact)

---

## ✅ Checklist de Implementação

- [x] Tabela `panic_events` criada
- [x] Model `PanicEvent` criado
- [x] Controller `PanicController` criado
- [x] Rotas API configuradas
- [x] Service `panicService` criado
- [x] Componente `PanicButton` criado
- [x] Animação de 5 segundos implementada
- [x] Expansão até tela cheia
- [x] Captura de GPS
- [x] Reverse geocoding
- [x] Ligação automática
- [x] Interface de chamada ativa
- [x] Botão desligar
- [x] Registro de duração
- [x] Integração com PatientHomeScreen
- [x] Permissões de localização
- [x] Permissões de telefone
- [x] Tratamento de erros
- [x] Toasts informativos
- [x] Commit no GitHub
- [ ] Reconhecimento de voz
- [ ] Configurações no GroupSettings
- [ ] Timeline de eventos

---

## 📧 Suporte

Para dúvidas ou problemas:
1. Verificar logs do Expo
2. Verificar permissões do dispositivo
3. Verificar configuração do backend
4. Verificar contatos de emergência cadastrados

---

**Status**: ✅ **FUNCIONALIDADE PRINCIPAL COMPLETA E TESTÁVEL**

**Data**: 23/11/2025
**Versão**: 1.0.0

