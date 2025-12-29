# 📋 Endpoints da API - Backend Requirements

Este documento lista os endpoints que precisam ser implementados no backend para suportar as funcionalidades de **Mídias** e **Alertas** do aplicativo.

## 🎬 Endpoints de Mídias

### 1. Listar Mídias do Grupo
```
GET /api/groups/{groupId}/media
```

**Resposta de Sucesso (200):**
```json
[
  {
    "id": 1,
    "group_id": 18,
    "type": "image",
    "url": "https://storage.example.com/media/abc123.jpg",
    "media_url": "https://storage.example.com/media/abc123.jpg",
    "description": "Momento especial em família",
    "posted_by_user_id": 10,
    "posted_by_name": "João Silva",
    "created_at": "2025-11-28T10:30:00Z",
    "updated_at": "2025-11-28T10:30:00Z"
  },
  {
    "id": 2,
    "group_id": 18,
    "type": "video",
    "url": "https://storage.example.com/media/def456.mp4",
    "media_url": "https://storage.example.com/media/def456.mp4",
    "description": "Passeio no parque",
    "posted_by_user_id": 12,
    "posted_by_name": "Maria Santos",
    "created_at": "2025-11-28T14:15:00Z",
    "updated_at": "2025-11-28T14:15:00Z"
  }
]
```

**Regras:**
- Retornar apenas mídias criadas nas últimas 24 horas
- Ordenar por `created_at` DESC (mais recentes primeiro)
- Incluir o nome do usuário que postou
- Limitar a 10 mídias por grupo

---

### 2. Postar Nova Mídia
```
POST /api/groups/{groupId}/media
Content-Type: multipart/form-data
```

**Parâmetros:**
- `file` (file, required): Arquivo de imagem ou vídeo
- `type` (string, required): "image" ou "video"
- `description` (string, optional): Descrição da mídia

**Resposta de Sucesso (201):**
```json
{
  "id": 3,
  "group_id": 18,
  "type": "image",
  "url": "https://storage.example.com/media/xyz789.jpg",
  "description": "Nova foto",
  "posted_by_user_id": 10,
  "posted_by_name": "João Silva",
  "created_at": "2025-11-28T16:45:00Z",
  "updated_at": "2025-11-28T16:45:00Z"
}
```

**Regras:**
- Validar que o usuário é admin do grupo
- Aceitar imagens: jpg, jpeg, png, gif (max 10MB)
- Aceitar vídeos: mp4, mov (max 50MB)
- Fazer upload para storage (S3, CloudFlare R2, etc)
- Gerar thumbnail para vídeos (opcional)

---

### 3. Deletar Mídia
```
DELETE /api/media/{mediaId}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Mídia removida com sucesso"
}
```

**Regras:**
- Validar que o usuário é admin do grupo ou criador da mídia
- Remover arquivo do storage
- Soft delete ou hard delete conforme preferência

---

## 🔔 Endpoints de Alertas

### 1. Listar Alertas Ativos
```
GET /api/groups/{groupId}/alerts/active
```

**Resposta de Sucesso (200):**
```json
[
  {
    "id": 1,
    "group_id": 18,
    "patient_user_id": 25,
    "type": "medication",
    "message": "Hora de tomar seu medicamento!",
    "medication_name": "Losartana 50mg",
    "dosage": "1 comprimido",
    "time": "2025-11-28T08:00:00Z",
    "created_at": "2025-11-28T07:45:00Z",
    "expires_at": "2025-11-28T08:30:00Z",
    "is_active": true
  },
  {
    "id": 2,
    "group_id": 18,
    "patient_user_id": 25,
    "type": "appointment",
    "message": "Consulta médica daqui a 2 horas",
    "details": "Dr. João Silva - Cardiologista",
    "location": "Rua das Flores, 123 - Centro",
    "appointment_type": "medical",
    "time": "2025-11-28T16:00:00Z",
    "created_at": "2025-11-28T14:00:00Z",
    "expires_at": "2025-11-28T16:00:00Z",
    "is_active": true
  },
  {
    "id": 3,
    "group_id": 18,
    "patient_user_id": 25,
    "type": "vital_signs",
    "message": "Saturação de oxigênio abaixo do normal",
    "value": "87%",
    "normal_range": "95-100%",
    "vital_sign_type": "oxygen_saturation",
    "time": "2025-11-28T15:30:00Z",
    "created_at": "2025-11-28T15:30:00Z",
    "is_active": true
  },
  {
    "id": 4,
    "group_id": 18,
    "patient_user_id": 25,
    "type": "sedentary",
    "message": "Você está há 3 horas sem se movimentar",
    "details": "Que tal fazer uma pequena caminhada?",
    "time": "2025-11-28T15:45:00Z",
    "created_at": "2025-11-28T15:45:00Z",
    "is_active": true
  }
]
```

**Tipos de Alertas:**
- `medication`: Lembretes de medicamentos
- `appointment`: Lembretes de consultas
- `vital_signs`: Alertas de sinais vitais anormais
- `sedentary`: Alertas de sedentarismo

**Regras:**
- Retornar apenas alertas ativos (`is_active = true`)
- Retornar apenas para o paciente do grupo
- Ordenar por prioridade e `created_at`

---

### 2. Marcar Medicamento como Tomado
```
POST /api/alerts/{alertId}/taken
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Medicamento marcado como tomado",
  "alert_id": 1,
  "taken_at": "2025-11-28T08:05:00Z"
}
```

**Regras:**
- Marcar alerta como inativo (`is_active = false`)
- Registrar em histórico de medicamentos
- Notificar cuidadores (opcional)

---

### 3. Dispensar Alerta
```
POST /api/alerts/{alertId}/dismiss
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Alerta dispensado",
  "alert_id": 2
}
```

**Regras:**
- Marcar alerta como inativo
- Registrar ação no log

---

## 🔄 Sistema de Geração de Alertas

### Lógica de Criação Automática

#### 1. Alertas de Medicamentos
- **Quando:** No horário definido no `schedule` do medicamento
- **Frequência:** Conforme configurado (diário, 8/8h, etc)
- **Expiração:** 30 minutos após o horário programado

#### 2. Alertas de Consultas
- **Quando:** 
  - 24 horas antes da consulta
  - 2 horas antes da consulta
  - 15 minutos antes da consulta
- **Expiração:** Após o horário da consulta

#### 3. Alertas de Sinais Vitais
- **Quando:** Valor registrado fora da faixa normal
- **Exemplos:**
  - Pressão arterial: < 90/60 ou > 140/90
  - Glicemia: < 70 ou > 180
  - Saturação O2: < 95%
  - Frequência cardíaca: < 60 ou > 100
- **Expiração:** 1 hora ou quando novo valor normal for registrado

#### 4. Alertas de Sedentarismo
- **Quando:** 3 horas sem movimentação detectada
- **Frequência:** A cada 3 horas inativas
- **Expiração:** Quando movimento for detectado

---

## 🗄️ Estrutura de Banco de Dados Sugerida

### Tabela: `group_media`
```sql
CREATE TABLE group_media (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  posted_by_user_id BIGINT NOT NULL,
  type ENUM('image', 'video') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (posted_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_created (group_id, created_at DESC)
);
```

### Tabela: `patient_alerts`
```sql
CREATE TABLE patient_alerts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  patient_user_id BIGINT NOT NULL,
  type ENUM('medication', 'appointment', 'vital_signs', 'sedentary') NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  
  -- Campos específicos por tipo
  medication_id BIGINT,
  medication_name VARCHAR(255),
  dosage VARCHAR(100),
  
  appointment_id BIGINT,
  appointment_type VARCHAR(50),
  location TEXT,
  
  vital_sign_type VARCHAR(50),
  value VARCHAR(50),
  normal_range VARCHAR(50),
  
  -- Controle de estado
  is_active BOOLEAN DEFAULT TRUE,
  priority TINYINT DEFAULT 1,
  time TIMESTAMP,
  expires_at TIMESTAMP,
  dismissed_at TIMESTAMP NULL,
  taken_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_active_alerts (group_id, patient_user_id, is_active, time)
);
```

---

## 🛠️ Tarefas de Implementação Backend

### Prioridade Alta 🔴
- [ ] Implementar endpoints de mídias (GET, POST, DELETE)
- [ ] Configurar storage para arquivos (S3, R2, etc)
- [ ] Implementar endpoints de alertas (GET)

### Prioridade Média 🟡
- [ ] Sistema de geração automática de alertas de medicamentos
- [ ] Sistema de geração automática de alertas de consultas
- [ ] Implementar endpoints de ações em alertas (taken, dismiss)

### Prioridade Baixa 🟢
- [ ] Sistema de alertas de sinais vitais
- [ ] Sistema de alertas de sedentarismo
- [ ] Notificações push para alertas
- [ ] Geração de thumbnails para vídeos

### Cron Jobs Necessários
- [ ] **Limpeza de mídias antigas:** Rodar a cada hora, deletar mídias com > 24h
- [ ] **Geração de alertas:** Rodar a cada minuto, verificar medicamentos/consultas
- [ ] **Limpeza de alertas expirados:** Rodar a cada hora, marcar como inativos

---

## 📱 Status no Frontend

✅ **Implementado:**
- Componentes de UI (MediaCarousel, AlertCard)
- Serviços (mediaService, alertService)
- Telas (MediaScreen para cuidadores)
- Integração na PatientHomeScreen
- Tratamento de erros 404 (gracioso quando backend não está pronto)

⏳ **Aguardando Backend:**
- Todos os endpoints listados acima
- Sistema de geração de alertas
- Storage de arquivos

---

## 🧪 Testes Sugeridos

### Endpoints de Mídias
1. Upload de imagem válida
2. Upload de vídeo válido
3. Upload com arquivo muito grande (deve rejeitar)
4. Upload de tipo inválido (deve rejeitar)
5. Listar mídias (verificar filtro de 24h)
6. Deletar mídia (verificar permissões)

### Endpoints de Alertas
1. Listar alertas ativos de um grupo
2. Marcar medicamento como tomado
3. Dispensar alerta
4. Geração automática de alerta de medicamento
5. Geração automática de alerta de consulta
6. Expiração automática de alertas

---

## 📞 Suporte

Se tiver dúvidas sobre a implementação, consulte:
- Código frontend em: `src/services/mediaService.js` e `src/services/alertService.js`
- Componentes em: `src/components/MediaCarousel.js` e `src/components/AlertCard.js`
- Telas em: `src/screens/Media/MediaScreen.js` e `src/screens/Patient/PatientHomeScreen.js`

---

**Última atualização:** 28/11/2025

