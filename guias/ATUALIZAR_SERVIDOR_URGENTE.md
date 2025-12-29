# 🚨 ATUALIZAR SERVIDOR - CAMPO TYPE EM APPOINTMENTS

## ❌ Problema Resolvido

O erro `"The type field is required"` ao salvar compromissos na **Agenda** foi causado por:

1. ✅ **Frontend** não estava enviando o campo `type`
2. ✅ **Backend** não tinha o campo `type` na tabela `appointments`
3. ✅ **Backend** não validava o campo `type` no controller

---

## ✅ Correções Aplicadas

### Frontend (`main` branch)
- ✅ `AddAppointmentScreen.js` agora envia o campo `type`
- ✅ `appointmentService.js` inclui `type` nos dados enviados
- ✅ Logs detalhados adicionados para debug

### Backend (`backend` branch)
- ✅ Migration para adicionar coluna `type` na tabela `appointments`
- ✅ `AppointmentController` agora valida o campo `type`
- ✅ `Appointment` model atualizado com `type` no fillable

---

## 🚀 PASSOS PARA ATUALIZAR O SERVIDOR

### 1. Conectar ao Servidor

```bash
ssh seu_usuario@207.244.235.147
```

### 2. Atualizar o Backend

```bash
# Navegar para o diretório
cd lacos-api

# Fazer backup do banco (IMPORTANTE!)
mysqldump -u lacos -p lacos > backup_antes_type_$(date +%Y%m%d_%H%M%S).sql

# Fazer pull das alterações
git pull origin backend

# Ver o status das migrations
php artisan migrate:status
```

### 3. Rodar a Migration

```bash
# Rodar a migration que adiciona o campo type
php artisan migrate --force

# A migration adiciona:
# - Campo 'type' ENUM('common', 'medical', 'fisioterapia', 'exames')
# - Default: 'common'
# - Posição: após 'group_id'
```

### 4. Verificar se Funcionou

```bash
# Conectar ao MySQL
mysql -u lacos -p lacos

# Verificar a estrutura da tabela
DESCRIBE appointments;
```

**Você deve ver:**

```
+------------------+---------------------------------------------+------+-----+---------+----------------+
| Field            | Type                                        | Null | Key | Default | Extra          |
+------------------+---------------------------------------------+------+-----+---------+----------------+
| id               | bigint unsigned                             | NO   | PRI | NULL    | auto_increment |
| group_id         | bigint unsigned                             | NO   | MUL | NULL    |                |
| type             | enum('common','medical','fisioterapia','exames') | NO   |     | common  |                |
| doctor_id        | bigint unsigned                             | YES  | MUL | NULL    |                |
| title            | varchar(255)                                | NO   |     | NULL    |                |
| description      | text                                        | YES  |     | NULL    |                |
| appointment_date | timestamp                                   | NO   |     | NULL    |                |
| location         | varchar(255)                                | YES  |     | NULL    |                |
| status           | enum('scheduled','completed','cancelled')   | NO   |     | scheduled |              |
| notes            | text                                        | YES  |     | NULL    |                |
| created_at       | timestamp                                   | YES  |     | NULL    |                |
| updated_at       | timestamp                                   | YES  |     | NULL    |                |
+------------------+---------------------------------------------+------+-----+---------+----------------+
```

### 5. Atualizar Registros Existentes (Se Houver)

```sql
-- Se houver compromissos antigos sem type, definir como 'common'
UPDATE appointments SET type = 'common' WHERE type IS NULL;

-- Sair do MySQL
exit
```

### 6. Limpar Caches

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan optimize
```

### 7. Testar a API

```bash
# Testar listagem de appointments
curl -H "Authorization: Bearer SEU_TOKEN" \
     http://207.244.235.147/api/appointments?group_id=1

# Testar criação de appointment
curl -X POST http://207.244.235.147/api/appointments \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": 1,
    "type": "medical",
    "title": "Teste via curl",
    "scheduled_at": "2025-11-24 10:00:00"
  }'
```

**Resposta esperada:** Status 201 Created com os dados do appointment criado

---

## 🧪 Testar no App

Depois de atualizar o servidor:

1. **Recarregue o app** (pressione `r` no terminal do Expo)
2. **Entre em um grupo**
3. **Clique em "Agenda"**
4. **Clique no botão "+"** (adicionar compromisso)
5. **Selecione um tipo**: Comum, Médico, Fisioterapia ou Exames
6. **Preencha o título**: ex: "Consulta teste"
7. **Clique em "Agendar Compromisso"**

**Logs esperados no console:**

```
📤 Salvando compromisso: {
  group_id: 1,
  type: 'medical',
  title: 'Consulta teste',
  scheduled_at: '2025-11-23T...',
  appointment_date: '2025-11-23T...',
  ...
}
📋 Tipo selecionado: medical
🔵 appointmentService.createAppointment - Dados enviados: {...}
✅ appointmentService.createAppointment - Resposta: {...}
```

---

## 🔍 Valores Válidos para `type`

O campo aceita **apenas** estes valores:
- `common` - Compromisso comum (default)
- `medical` - Consulta médica
- `fisioterapia` - Sessão de fisioterapia
- `exames` - Realização de exames

Qualquer outro valor resultará em erro de validação.

---

## ⚠️ Se a Migration Falhar

### Erro: "Duplicate column name 'type'"

Se você já rodou a migration antes:

```bash
php artisan migrate:rollback --step=1
php artisan migrate
```

### Erro: "SQLSTATE[HY000] [2002] Connection refused"

Verifique se o MySQL está rodando:

```bash
sudo systemctl status mysql
sudo systemctl start mysql
```

### Erro: "Access denied for user"

Verifique as credenciais no `.env`:

```bash
cat .env | grep DB_
```

---

## 📝 Arquivos Alterados

### Backend
- ✅ `database/migrations/2025_11_23_173455_add_type_to_appointments_table.php` (NEW)
- ✅ `app/Models/Appointment.php` (updated fillable)
- ✅ `app/Http/Controllers/Api/AppointmentController.php` (updated validation)

### Frontend
- ✅ `src/screens/Groups/AddAppointmentScreen.js` (envia type)
- ✅ `src/services/appointmentService.js` (inclui type)

---

## ✅ Checklist de Atualização

- [ ] Conectado ao servidor
- [ ] Backup do banco criado
- [ ] Git pull origin backend executado
- [ ] php artisan migrate executado
- [ ] Campo `type` aparece no DESCRIBE appointments
- [ ] Caches limpos
- [ ] API testada com curl
- [ ] App recarregado
- [ ] Teste de criação de compromisso funcionou

---

## 📞 Suporte

Se encontrar qualquer erro durante a atualização:

1. **Copie a mensagem de erro completa**
2. **Copie o resultado de `php artisan migrate:status`**
3. **Envie para análise**

Não force commits ou rollbacks sem entender o erro!

---

## 🎯 Após Atualizar

Teste os 4 tipos de compromisso:
1. ✅ Comum
2. ✅ Médico (com gravação de áudio habilitada no perfil do paciente)
3. ✅ Fisioterapia (sem gravação de áudio)
4. ✅ Exames

Todos devem salvar com sucesso! 🎉

