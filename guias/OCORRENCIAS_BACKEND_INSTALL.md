# 🚨 Instalação do Backend de Ocorrências

## 📋 O Que Foi Implementado

### Frontend ✅
- ✅ Tela de registro (`AddOccurrenceScreen.js`)
- ✅ Service de API (`occurrenceService.js`)
- ✅ Botão flutuante no Histórico
- ✅ Navegação configurada
- ✅ Integração com API completa

### Backend 📦
- ✅ Tabela `occurrences` (SQL)
- ✅ Controller `OccurrenceController.php`
- ✅ Rotas API configuradas
- ✅ Script de instalação automática

---

## 🚀 Como Instalar no Servidor

### **Opção 1: Instalação Automática (Recomendado)**

```bash
# 1. Copie o script para o servidor
scp /tmp/install_occurrences.sh root@209.145.54.77:/tmp/

# 2. Conecte no servidor
ssh root@209.145.54.77

# 3. Execute o script
cd /var/www/lacos-backend
bash /tmp/install_occurrences.sh
```

O script irá:
- ✅ Criar tabela `occurrences` no MySQL
- ✅ Criar `OccurrenceController.php`
- ✅ Adicionar rotas em `routes/api.php`
- ✅ Limpar caches do Laravel
- ✅ Verificar instalação

---

### **Opção 2: Instalação Manual**

#### **1. Criar Tabela no MySQL**

```bash
ssh root@209.145.54.77
cd /var/www/lacos-backend
mysql lacos
```

```sql
CREATE TABLE IF NOT EXISTS occurrences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'Usuário que registrou',
  type VARCHAR(100) NOT NULL COMMENT 'Tipo de ocorrência',
  type_code VARCHAR(50) NULL COMMENT 'Código do tipo',
  occurred_at TIMESTAMP NOT NULL COMMENT 'Data/hora da ocorrência',
  description TEXT NOT NULL COMMENT 'Descrição detalhada',
  responsible VARCHAR(255) NOT NULL COMMENT 'Responsável pelo registro',
  notes TEXT NULL COMMENT 'Observações adicionais',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_group_occurred (group_id, occurred_at DESC),
  INDEX idx_type_code (type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### **2. Criar Controller**

```bash
# Copie o arquivo do seu sistema local
scp /tmp/OccurrenceController.php root@209.145.54.77:/var/www/lacos-backend/app/Http/Controllers/Api/
```

#### **3. Adicionar Rotas**

Edite `routes/api.php` e adicione após a rota de `doctors`:

```php
Route::resource('occurrences', App\Http\Controllers\Api\OccurrenceController::class);
```

#### **4. Limpar Caches**

```bash
cd /var/www/lacos-backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

#### **5. Verificar Instalação**

```bash
# Verificar tabela
mysql lacos -e "DESCRIBE occurrences;"

# Verificar rotas
php artisan route:list | grep occurrences
```

Você deve ver:

```
GET|HEAD   api/occurrences .......................... occurrences.index
POST       api/occurrences .......................... occurrences.store
GET|HEAD   api/occurrences/{occurrence} ............. occurrences.show
PUT|PATCH  api/occurrences/{occurrence} ............. occurrences.update
DELETE     api/occurrences/{occurrence} ............. occurrences.destroy
```

---

## 🧪 Testar API

### **Criar Ocorrência (POST)**

```bash
curl -X POST https://seu-dominio.com/api/occurrences \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": 1,
    "type": "Queda",
    "type_code": "queda",
    "occurred_at": "2025-11-25 14:30:00",
    "description": "Queda leve ao se levantar da cadeira. Sem ferimentos graves.",
    "responsible": "Maria Silva",
    "notes": "Paciente estava levemente tonto."
  }'
```

### **Listar Ocorrências de um Grupo (GET)**

```bash
curl https://seu-dominio.com/api/occurrences?group_id=1
```

### **Ver Detalhes (GET)**

```bash
curl https://seu-dominio.com/api/occurrences/1
```

---

## 📊 Estrutura da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | BIGINT | ID único |
| `group_id` | BIGINT | FK para `groups` |
| `user_id` | BIGINT | FK para `users` (quem registrou) |
| `type` | VARCHAR(100) | Tipo da ocorrência |
| `type_code` | VARCHAR(50) | Código do tipo |
| `occurred_at` | TIMESTAMP | Data/hora da ocorrência |
| `description` | TEXT | Descrição detalhada |
| `responsible` | VARCHAR(255) | Nome do responsável |
| `notes` | TEXT | Observações adicionais |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

---

## 🎯 Tipos de Ocorrências

| Código | Label |
|--------|-------|
| `queda` | Queda |
| `desnutricao` | Desnutrição |
| `escabiose` | Escabiose |
| `desidratacao` | Desidratação |
| `lesao_pressao` | Lesão por pressão |
| `doenca_diarreica` | Doença diarreica aguda |
| `outro` | Outro (customizado) |

---

## 📱 Como Usar no App

1. **No Histórico**: Clique no botão flutuante laranja `+`
2. **Selecione o Tipo**: Escolha na lista ou use "Outro"
3. **Preencha os Campos**:
   - Data/hora da ocorrência
   - Descrição detalhada
   - Nome do responsável
   - Observações (opcional)
4. **Salve**: Clique em "Salvar"
5. **Confirmação**: Toast de sucesso e volta para o Histórico

---

## ❗ Problemas Comuns

### "The route api/occurrences could not be found"
```bash
cd /var/www/lacos-backend
php artisan route:clear
php artisan cache:clear
```

### "Table 'occurrences' doesn't exist"
```bash
# Execute o SQL de criação da tabela
mysql lacos < /tmp/occurrences_backend.sql
```

### "SQLSTATE[42S22]: Column not found"
```bash
# Verifique a estrutura da tabela
mysql lacos -e "DESCRIBE occurrences;"
```

---

## ✅ Checklist de Instalação

- [ ] Tabela `occurrences` criada
- [ ] Controller `OccurrenceController.php` copiado
- [ ] Rotas adicionadas em `routes/api.php`
- [ ] Caches limpos
- [ ] Rotas verificadas (`php artisan route:list`)
- [ ] Teste de POST bem-sucedido
- [ ] Teste de GET bem-sucedido

---

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs do Laravel: `/var/www/lacos-backend/storage/logs/laravel.log`
2. Verifique os logs do MySQL: `/var/log/mysql/error.log`
3. Execute: `php artisan cache:clear && php artisan config:clear`

---

**🎉 Tudo Pronto!** Agora você pode registrar ocorrências no app!

