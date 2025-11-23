# 🎉 Integração Backend-Frontend Concluída

## ✅ O que foi feito

### 1. Backend Laravel 11 + MySQL
- ✅ Servidor deployado em `193.203.182.22`
- ✅ Banco MySQL configurado (`lacos` / `lacos` / `Lacos2025Secure`)
- ✅ Nginx + PHP 8.2-FPM configurados
- ✅ Todas as tabelas criadas via migrations
- ✅ API RESTful com autenticação Sanctum
- ✅ Rotas funcionando (testadas com curl)

**URL Base da API:** `http://193.203.182.22/api`

### 2. Frontend React Native
- ✅ AuthContext atualizado para usar API real
- ✅ apiService configurado com autenticação Bearer Token
- ✅ Serviços criados para todas as entidades:
  - groupService
  - medicationService
  - doctorService
  - appointmentService
  - emergencyContactService
  - vitalSignService

## 📡 Endpoints da API Disponíveis

### Autenticação
```
POST /api/register - Criar nova conta
POST /api/login - Fazer login
POST /api/logout - Fazer logout
GET /api/user - Obter dados do usuário autenticado
```

### Grupos
```
GET /api/groups - Listar grupos
POST /api/groups - Criar grupo
GET /api/groups/:id - Obter grupo
PUT /api/groups/:id - Atualizar grupo
DELETE /api/groups/:id - Deletar grupo
POST /api/groups/:id/generate-code - Gerar código de convite
POST /api/groups/join - Entrar em grupo com código
```

### Medicamentos
```
GET /api/medications - Listar medicamentos
POST /api/medications - Criar medicamento
GET /api/medications/:id - Obter medicamento
PUT /api/medications/:id - Atualizar medicamento
DELETE /api/medications/:id - Deletar medicamento
```

### Histórico de Doses
```
GET /api/dose-history - Listar histórico
POST /api/dose-history - Registrar dose
GET /api/dose-history/:id - Obter dose
PUT /api/dose-history/:id - Atualizar dose
DELETE /api/dose-history/:id - Deletar dose
```

### Médicos
```
GET /api/doctors - Listar médicos
POST /api/doctors - Criar médico
GET /api/doctors/:id - Obter médico
PUT /api/doctors/:id - Atualizar médico
DELETE /api/doctors/:id - Deletar médico
```

### Contatos de Emergência
```
GET /api/emergency-contacts - Listar contatos
POST /api/emergency-contacts - Criar contato
GET /api/emergency-contacts/:id - Obter contato
PUT /api/emergency-contacts/:id - Atualizar contato
DELETE /api/emergency-contacts/:id - Deletar contato
```

### Consultas
```
GET /api/appointments - Listar consultas
POST /api/appointments - Criar consulta
GET /api/appointments/:id - Obter consulta
PUT /api/appointments/:id - Atualizar consulta
DELETE /api/appointments/:id - Deletar consulta
```

### Sinais Vitais
```
GET /api/vital-signs - Listar sinais vitais
POST /api/vital-signs - Registrar sinal vital
GET /api/vital-signs/:id - Obter sinal vital
PUT /api/vital-signs/:id - Atualizar sinal vital
DELETE /api/vital-signs/:id - Deletar sinal vital
```

## 🚀 Como Usar os Serviços no Frontend

### Exemplo 1: Login
```javascript
import { useAuth } from './src/contexts/AuthContext';

function LoginScreen() {
  const { signIn } = useAuth();

  const handleLogin = async () => {
    const result = await signIn('usuario@exemplo.com', 'senha123');
    
    if (result.success) {
      console.log('Login bem-sucedido!');
    } else {
      console.error('Erro:', result.error);
    }
  };
}
```

### Exemplo 2: Criar Grupo
```javascript
import { groupService } from './src/services';

async function createGroup() {
  const result = await groupService.createGroup({
    name: 'Família Silva',
    accompaniedName: 'Maria Silva',
    accompaniedBirthDate: '1950-01-15',
    accompaniedGender: 'female',
  });

  if (result.success) {
    console.log('Grupo criado:', result.data);
  } else {
    console.error('Erro:', result.error);
  }
}
```

### Exemplo 3: Adicionar Medicamento
```javascript
import { medicationService } from './src/services';

async function addMedication(groupId) {
  const result = await medicationService.createMedication({
    groupId: groupId,
    name: 'Losartana',
    form: 'pill',
    dosage: '50',
    unit: 'mg',
    administrationRoute: 'oral',
    frequencyType: 'hours',
    frequencyDetails: { hours: 12 },
    firstDoseAt: '2025-11-23T08:00:00Z',
    durationType: 'continuous',
    notes: 'Tomar em jejum',
    isActive: true,
  });

  if (result.success) {
    console.log('Medicamento criado:', result.data);
  }
}
```

### Exemplo 4: Registrar Dose
```javascript
import { medicationService } from './src/services';

async function recordDose(medicationId) {
  const result = await medicationService.recordDose({
    medicationId: medicationId,
    takenAt: '2025-11-23T08:05:00Z',
    status: 'taken',
  });

  if (result.success) {
    console.log('Dose registrada!');
  }
}
```

## 🧪 Testes Manuais

### 1. Testar Autenticação no Terminal
```bash
# No servidor
ssh darley@193.203.182.22

# Registrar usuário
curl -X POST http://localhost/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@teste.com",
    "password": "senha123",
    "password_confirmation": "senha123",
    "phone": "11999999999"
  }'

# Login
curl -X POST http://localhost/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@teste.com",
    "password": "senha123"
  }'
```

### 2. Testar Endpoint Protegido
```bash
# Substituir TOKEN pelo token retornado no login
TOKEN="seu_token_aqui"

curl -X GET http://localhost/api/user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

## 📝 Próximos Passos

### Tarefas Pendentes
- [ ] Testar fluxo completo de autenticação no app mobile
- [ ] Testar criação de grupos
- [ ] Testar adição de medicamentos
- [ ] Testar registro de doses
- [ ] Substituir AsyncStorage restante por chamadas API
- [ ] Adicionar tratamento de erros offline
- [ ] Implementar sincronização de dados

### Melhorias Futuras
- [ ] Cache local com AsyncStorage para modo offline
- [ ] Upload de fotos de perfil
- [ ] Upload de gravações de áudio
- [ ] Notificações push
- [ ] Sincronização automática em background

## 🐛 Troubleshooting

### Erro 401 Unauthorized
- Verifique se o token está sendo enviado corretamente
- Token pode ter expirado, faça login novamente

### Erro de Conexão
- Verifique se o servidor está rodando: `ssh darley@193.203.182.22 "sudo systemctl status nginx"`
- Verifique a URL da API em `src/config/api.js`

### Erro 500 Server Error
- Verifique os logs: `ssh darley@193.203.182.22 "tail -50 /var/www/lacos-backend/storage/logs/laravel.log"`

## 📞 Suporte

Para qualquer problema, verifique:
1. Logs do Laravel: `/var/www/lacos-backend/storage/logs/laravel.log`
2. Logs do Nginx: `/var/log/nginx/error.log`
3. Status do PHP-FPM: `sudo systemctl status php8.2-fpm`
4. Status do Nginx: `sudo systemctl status nginx`

---

**Backend deployado e funcionando em:** `http://193.203.182.22`
**Última atualização:** 23/11/2025

