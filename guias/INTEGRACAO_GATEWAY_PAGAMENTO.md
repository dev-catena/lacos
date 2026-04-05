# 💳 Integração com Gateway de Pagamento - Sistema Laços

## 📋 Visão Geral

Este documento descreve o processo completo de integração com gateway de pagamento para o sistema de teleconsultas do Laços, incluindo fluxo de pagamento, divisão de valores, reembolsos e todas as regras de negócio.

---

## 🔄 Fluxo Completo do Processo

### 1. Agendamento da Teleconsulta

**Atores:** Cuidador/Amigo

**Processo:**
- Cuidador/Amigo agenda uma teleconsulta com um médico
- Após o agendamento, a consulta é criada no sistema com status: **`AGENDADA`** (não paga)

**Estado no Banco de Dados:**
```sql
status: 'agendada'
payment_status: 'pending'
payment_id: NULL
amount: [valor_da_consulta]
```

---

### 2. Processamento do Pagamento

**Atores:** Cuidador/Amigo, Gateway de Pagamento

**Processo:**
- Cuidador/Amigo efetua o pagamento através do gateway
- O valor é **capturado** pelo gateway mas **NÃO é liberado** para o médico
- O recurso fica em **"hold"** ou **"escrow"** no gateway

**Estado no Banco de Dados:**
```sql
status: 'agendada'
payment_status: 'paid_held'
payment_id: [id_do_pagamento_no_gateway]
payment_hold_id: [id_do_hold_no_gateway]
amount: [valor_da_consulta]
held_at: [timestamp]
```

**Intervenções com Gateway:**
- ✅ Criar pagamento/autorização
- ✅ Capturar valor e colocar em hold/escrow
- ✅ Obter `payment_id` e `hold_id` do gateway

---

### 3. Realização da Consulta

**Atores:** Médico, Paciente, Sistema

**Cenários:**

#### 3.1. Paciente Informa que Fez a Consulta

**Processo:**
- Paciente confirma que a consulta foi realizada
- Sistema libera o pagamento automaticamente

**Estado no Banco de Dados:**
```sql
status: 'concluida'
payment_status: 'released'
confirmed_by: 'patient'
confirmed_at: [timestamp]
```

**Intervenções com Gateway:**
- ✅ Liberar hold/escrow
- ✅ Dividir valor: 80% para médico, 20% para plataforma
- ✅ Processar transferências automáticas

#### 3.2. Decorrem 6 Horas Após o Horário da Consulta

**Processo:**
- Se passaram 6 horas após o horário agendado
- Paciente não manifestou nenhum valor (não reclamou)
- Sistema assume que consulta foi realizada e libera pagamento

**Estado no Banco de Dados:**
```sql
status: 'concluida'
payment_status: 'released'
confirmed_by: 'system_auto'
confirmed_at: [timestamp]
auto_released_at: [timestamp]
```

**Intervenções com Gateway:**
- ✅ Liberar hold/escrow automaticamente
- ✅ Dividir valor: 80% para médico, 20% para plataforma
- ✅ Processar transferências automáticas

---

### 4. Divisão de Valores

**Regra de Negócio:**
- **80%** do valor vai para a conta do médico
- **20%** do valor vai para a conta da plataforma

**Intervenções com Gateway:**
- ✅ Configurar split de pagamento
- ✅ Definir destinatários:
  - Destinatário 1: Conta do Médico (80%)
  - Destinatário 2: Conta da Plataforma (20%)
- ✅ Processar transferências simultâneas

**Exemplo:**
```
Valor da Consulta: R$ 100,00
├── Médico: R$ 80,00 (80%)
└── Plataforma: R$ 20,00 (20%)
```

---

### 5. Cancelamento pelo Médico

**Atores:** Médico, Sistema

**Processo:**
- Médico cancela a consulta antes do horário agendado
- Valor é **reembolsado** integralmente para o cuidador/amigo

**Estado no Banco de Dados:**
```sql
status: 'cancelada'
payment_status: 'refunded'
cancelled_by: 'doctor'
cancelled_at: [timestamp]
refund_id: [id_do_reembolso_no_gateway]
```

**Intervenções com Gateway:**
- ✅ Cancelar hold/escrow
- ✅ Processar reembolso integral para o cuidador/amigo
- ✅ Obter `refund_id` do gateway

---

### 6. Médico Não Entra na Videoconsulta

**Condições:**
- Entre **15 minutos antes** do horário agendado
- Até **40 minutos depois** do horário previsto de início
- Médico não entra na videoconsulta

**Processo:**
- Sistema detecta ausência do médico
- Valor é **reembolsado** integralmente para o cuidador/amigo

**Estado no Banco de Dados:**
```sql
status: 'cancelada'
payment_status: 'refunded'
cancelled_by: 'system_doctor_absence'
cancelled_at: [timestamp]
refund_id: [id_do_reembolso_no_gateway]
absence_detected_at: [timestamp]
```

**Intervenções com Gateway:**
- ✅ Cancelar hold/escrow
- ✅ Processar reembolso integral para o cuidador/amigo
- ✅ Obter `refund_id` do gateway

---

### 7. Paciente Não Entra na Videoconsulta

**Condições:**
- Entre **15 minutos antes** do horário agendado
- Até **40 minutos depois** do horário previsto de início
- Paciente não entra na videoconsulta

**Processo:**
- Sistema detecta ausência do paciente
- Valor é **liberado** para o médico (mesmo sem consulta realizada)
- Divisão normal: 80% médico, 20% plataforma

**Estado no Banco de Dados:**
```sql
status: 'cancelada'
payment_status: 'released'
cancelled_by: 'system_patient_absence'
cancelled_at: [timestamp]
released_at: [timestamp]
```

**Intervenções com Gateway:**
- ✅ Liberar hold/escrow
- ✅ Dividir valor: 80% para médico, 20% para plataforma
- ✅ Processar transferências automáticas

---

## 🗄️ Estrutura de Dados Necessária

### Tabela: `appointments`

```sql
CREATE TABLE appointments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    doctor_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    status ENUM('agendada', 'concluida', 'cancelada') DEFAULT 'agendada',
    payment_status ENUM('pending', 'paid_held', 'released', 'refunded') DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    
    -- Gateway de Pagamento
    payment_id VARCHAR(255) NULL,
    payment_hold_id VARCHAR(255) NULL,
    refund_id VARCHAR(255) NULL,
    
    -- Timestamps
    paid_at DATETIME NULL,
    held_at DATETIME NULL,
    released_at DATETIME NULL,
    refunded_at DATETIME NULL,
    confirmed_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    
    -- Metadados
    confirmed_by ENUM('patient', 'system_auto', 'system_doctor_absence', 'system_patient_absence') NULL,
    cancelled_by ENUM('doctor', 'patient', 'system_doctor_absence', 'system_patient_absence') NULL,
    
    -- Divisão de valores
    doctor_amount DECIMAL(10, 2) NULL,
    platform_amount DECIMAL(10, 2) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (patient_id) REFERENCES users(id),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status)
);
```

---

## 🔌 Integrações com Gateway de Pagamento

### 1. Criar Pagamento e Colocar em Hold

**Endpoint do Gateway:** `POST /payments`

**Payload:**
```json
{
  "amount": 100.00,
  "currency": "BRL",
  "description": "Teleconsulta - Dr. João Silva",
  "customer_id": "customer_123",
  "hold": true,
  "hold_duration": "7d", // ou até liberação manual
  "split": {
    "enabled": true,
    "recipients": [
      {
        "account_id": "doctor_account_456",
        "percentage": 80
      },
      {
        "account_id": "platform_account_789",
        "percentage": 20
      }
    ]
  }
}
```

**Resposta:**
```json
{
  "payment_id": "pay_abc123",
  "hold_id": "hold_xyz789",
  "status": "held",
  "amount": 100.00,
  "held_until": "2024-01-11T10:00:00Z"
}
```

---

### 2. Liberar Hold e Processar Divisão

**Endpoint do Gateway:** `POST /holds/{hold_id}/release`

**Payload:**
```json
{
  "split": true,
  "recipients": [
    {
      "account_id": "doctor_account_456",
      "amount": 80.00
    },
    {
      "account_id": "platform_account_789",
      "amount": 20.00
    }
  ]
}
```

**Resposta:**
```json
{
  "hold_id": "hold_xyz789",
  "status": "released",
  "transfers": [
    {
      "transfer_id": "trans_doctor_001",
      "account_id": "doctor_account_456",
      "amount": 80.00,
      "status": "completed"
    },
    {
      "transfer_id": "trans_platform_001",
      "account_id": "platform_account_789",
      "amount": 20.00,
      "status": "completed"
    }
  ]
}
```

---

### 3. Cancelar Hold e Reembolsar

**Endpoint do Gateway:** `POST /holds/{hold_id}/cancel`

**Payload:**
```json
{
  "refund": true,
  "refund_to": "original_payment_method"
}
```

**Resposta:**
```json
{
  "hold_id": "hold_xyz789",
  "status": "cancelled",
  "refund_id": "refund_abc456",
  "refund_amount": 100.00,
  "refund_status": "processing"
}
```

---

### 4. Verificar Status do Pagamento

**Endpoint do Gateway:** `GET /payments/{payment_id}`

**Resposta:**
```json
{
  "payment_id": "pay_abc123",
  "status": "held",
  "amount": 100.00,
  "hold_id": "hold_xyz789",
  "hold_status": "active",
  "created_at": "2024-01-04T10:00:00Z"
}
```

---

## ⚙️ Processos Automáticos Necessários

### 1. Job: Verificar Consultas com 6 Horas Decorridas

**Frequência:** A cada 5 minutos

**Lógica:**
```php
// Buscar consultas agendadas com mais de 6 horas do horário agendado
$appointments = Appointment::where('status', 'agendada')
    ->where('payment_status', 'paid_held')
    ->where('scheduled_at', '<=', now()->subHours(6))
    ->get();

foreach ($appointments as $appointment) {
    // Liberar pagamento automaticamente
    $this->releasePayment($appointment);
}
```

---

### 2. Job: Verificar Ausência de Médico

**Frequência:** A cada 1 minuto (durante janela de verificação)

**Lógica:**
```php
// Janela: 15 min antes até 40 min depois do horário agendado
$startWindow = $appointment->scheduled_at->subMinutes(15);
$endWindow = $appointment->scheduled_at->addMinutes(40);

if (now()->between($startWindow, $endWindow)) {
    // Verificar se médico entrou na videoconsulta
    if (!$this->doctorJoinedVideoCall($appointment)) {
        // Reembolsar para cuidador/amigo
        $this->refundPayment($appointment, 'doctor_absence');
    }
}
```

---

### 3. Job: Verificar Ausência de Paciente

**Frequência:** A cada 1 minuto (durante janela de verificação)

**Lógica:**
```php
// Janela: 15 min antes até 40 min depois do horário agendado
$startWindow = $appointment->scheduled_at->subMinutes(15);
$endWindow = $appointment->scheduled_at->addMinutes(40);

if (now()->between($startWindow, $endWindow)) {
    // Verificar se paciente entrou na videoconsulta
    if (!$this->patientJoinedVideoCall($appointment)) {
        // Liberar pagamento para médico (mesmo sem consulta)
        $this->releasePayment($appointment, 'patient_absence');
    }
}
```

---

## 📝 Endpoints da API Necessários

### 1. Processar Pagamento

**POST** `/api/appointments/{id}/payment`

**Request:**
```json
{
  "payment_method": "credit_card",
  "card_token": "card_token_123",
  "installments": 1
}
```

**Response:**
```json
{
  "appointment_id": 123,
  "payment_id": "pay_abc123",
  "hold_id": "hold_xyz789",
  "status": "paid_held",
  "amount": 100.00,
  "message": "Pagamento processado e valor mantido em hold"
}
```

---

### 2. Confirmar Consulta Realizada

**POST** `/api/appointments/{id}/confirm`

**Request:**
```json
{
  "confirmed_by": "patient"
}
```

**Response:**
```json
{
  "appointment_id": 123,
  "status": "concluida",
  "payment_status": "released",
  "transfers": [
    {
      "account": "doctor",
      "amount": 80.00
    },
    {
      "account": "platform",
      "amount": 20.00
    }
  ]
}
```

---

### 3. Cancelar Consulta

**POST** `/api/appointments/{id}/cancel`

**Request:**
```json
{
  "cancelled_by": "doctor",
  "reason": "Emergência médica"
}
```

**Response:**
```json
{
  "appointment_id": 123,
  "status": "cancelada",
  "payment_status": "refunded",
  "refund_id": "refund_abc456",
  "refund_amount": 100.00
}
```

---

### 4. Verificar Status do Pagamento

**GET** `/api/appointments/{id}/payment-status`

**Response:**
```json
{
  "appointment_id": 123,
  "payment_status": "paid_held",
  "amount": 100.00,
  "payment_id": "pay_abc123",
  "hold_id": "hold_xyz789",
  "held_at": "2024-01-04T10:00:00Z",
  "scheduled_at": "2024-01-05T14:00:00Z",
  "time_until_auto_release": "5h 30m"
}
```

---

## 🔐 Segurança e Validações

### 1. Validações de Pagamento

- ✅ Verificar se consulta está no status correto antes de processar pagamento
- ✅ Validar valor do pagamento (não pode ser alterado após agendamento)
- ✅ Verificar se cuidador/amigo tem método de pagamento válido
- ✅ Validar token do cartão antes de processar

### 2. Validações de Liberação

- ✅ Verificar se hold ainda está ativo antes de liberar
- ✅ Validar que consulta foi realmente realizada antes de liberar
- ✅ Verificar janela de tempo para liberação automática

### 3. Validações de Reembolso

- ✅ Verificar se pagamento está em hold antes de reembolsar
- ✅ Validar motivo do cancelamento
- ✅ Verificar se reembolso já foi processado

---

## 📊 Webhooks do Gateway

### 1. Webhook: Pagamento Processado

**URL:** `POST /api/webhooks/payment-processed`

**Payload:**
```json
{
  "event": "payment.processed",
  "payment_id": "pay_abc123",
  "status": "held",
  "amount": 100.00,
  "hold_id": "hold_xyz789"
}
```

**Ação:**
- Atualizar `appointments` com `payment_id` e `hold_id`
- Atualizar `payment_status` para `paid_held`

---

### 2. Webhook: Hold Liberado

**URL:** `POST /api/webhooks/hold-released`

**Payload:**
```json
{
  "event": "hold.released",
  "hold_id": "hold_xyz789",
  "transfers": [
    {
      "transfer_id": "trans_doctor_001",
      "account_id": "doctor_account_456",
      "amount": 80.00
    },
    {
      "transfer_id": "trans_platform_001",
      "account_id": "platform_account_789",
      "amount": 20.00
    }
  ]
}
```

**Ação:**
- Atualizar `appointments` com status `released`
- Registrar valores divididos

---

### 3. Webhook: Reembolso Processado

**URL:** `POST /api/webhooks/refund-processed`

**Payload:**
```json
{
  "event": "refund.processed",
  "refund_id": "refund_abc456",
  "payment_id": "pay_abc123",
  "amount": 100.00,
  "status": "completed"
}
```

**Ação:**
- Atualizar `appointments` com `refund_id`
- Atualizar `payment_status` para `refunded`

---

## 🧪 Casos de Teste

### 1. Fluxo Normal - Consulta Realizada

1. ✅ Agendar consulta
2. ✅ Processar pagamento (valor em hold)
3. ✅ Paciente confirma consulta realizada
4. ✅ Sistema libera pagamento
5. ✅ Verificar divisão: 80% médico, 20% plataforma

### 2. Fluxo Automático - 6 Horas Decorridas

1. ✅ Agendar consulta
2. ✅ Processar pagamento (valor em hold)
3. ✅ Aguardar 6 horas após horário agendado
4. ✅ Sistema libera pagamento automaticamente
5. ✅ Verificar divisão: 80% médico, 20% plataforma

### 3. Cancelamento pelo Médico

1. ✅ Agendar consulta
2. ✅ Processar pagamento (valor em hold)
3. ✅ Médico cancela consulta
4. ✅ Sistema reembolsa valor integral
5. ✅ Verificar reembolso processado

### 4. Ausência do Médico

1. ✅ Agendar consulta
2. ✅ Processar pagamento (valor em hold)
3. ✅ Médico não entra na videoconsulta (janela: -15min a +40min)
4. ✅ Sistema detecta ausência
5. ✅ Sistema reembolsa valor integral

### 5. Ausência do Paciente

1. ✅ Agendar consulta
2. ✅ Processar pagamento (valor em hold)
3. ✅ Paciente não entra na videoconsulta (janela: -15min a +40min)
4. ✅ Sistema detecta ausência
5. ✅ Sistema libera pagamento para médico (80% médico, 20% plataforma)

---

## 📋 Checklist de Implementação

### Backend (Laravel)

- [ ] Criar migration para tabela `appointments` com campos de pagamento
- [ ] Criar model `Appointment` com relacionamentos
- [ ] Criar service `PaymentService` para integração com gateway
- [ ] Criar service `AppointmentPaymentService` para lógica de negócio
- [ ] Implementar endpoint `POST /api/appointments/{id}/payment`
- [ ] Implementar endpoint `POST /api/appointments/{id}/confirm`
- [ ] Implementar endpoint `POST /api/appointments/{id}/cancel`
- [ ] Implementar endpoint `GET /api/appointments/{id}/payment-status`
- [ ] Criar jobs para verificação automática:
  - [ ] Job: Verificar 6 horas decorridas
  - [ ] Job: Verificar ausência de médico
  - [ ] Job: Verificar ausência de paciente
- [ ] Implementar webhooks do gateway:
  - [ ] Webhook: Pagamento processado
  - [ ] Webhook: Hold liberado
  - [ ] Webhook: Reembolso processado
- [ ] Criar testes unitários para serviços
- [ ] Criar testes de integração para fluxos completos

### Frontend (Mobile/Web)

- [ ] Tela de pagamento para teleconsulta
- [ ] Tela de confirmação de consulta realizada
- [ ] Tela de status do pagamento
- [ ] Notificações push para eventos de pagamento
- [ ] Integração com gateway de pagamento (SDK)

### Gateway de Pagamento

- [ ] Configurar contas de recebedores (médicos e plataforma)
- [ ] Configurar split de pagamento (80/20)
- [ ] Configurar sistema de hold/escrow
- [ ] Configurar webhooks
- [ ] Testar todos os fluxos em ambiente sandbox

---

## 🔗 Referências

- Documentação do Gateway de Pagamento (Stripe/PagSeguro/etc)
- API de Hold/Escrow
- API de Split de Pagamento
- API de Reembolsos
- Webhooks e Eventos

---

## 📝 Notas Importantes

1. **Hold/Escrow:** O gateway deve suportar manter valores em hold sem liberar imediatamente
2. **Split Automático:** O gateway deve suportar divisão automática de valores
3. **Reembolsos:** O gateway deve processar reembolsos de forma rápida e confiável
4. **Webhooks:** Implementar retry e idempotência para webhooks
5. **Monitoramento:** Implementar logs detalhados de todas as operações de pagamento
6. **Segurança:** Nunca armazenar dados sensíveis de cartão no banco de dados
7. **Concorrência:** Implementar locks para evitar processamento duplicado de eventos

---

**Última Atualização:** 04/01/2024  
**Versão:** 1.0  
**Autor:** Sistema Laços

