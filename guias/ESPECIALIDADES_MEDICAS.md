# Especialidades Médicas - Implementação Completa

## 📋 Resumo da Implementação

Foi implementado um sistema completo de **especialidades médicas** com autocomplete no cadastro de consultas médicas.

---

## 🗄️ Backend (Laravel)

### 1. Tabela `medical_specialties`

Criada uma tabela com **56 especialidades médicas** reconhecidas pelo CFM:

- Acupuntura
- Alergia e Imunologia
- Anestesiologia
- Angiologia
- Cardiologia
- ... (e mais 51 especialidades)

**Arquivos criados/modificados:**
- `database/migrations/2025_11_23_170200_create_medical_specialties_table.php`
- `database/migrations/2025_11_23_170253_add_medical_specialty_to_consultations_table.php`
- `app/Models/MedicalSpecialty.php`
- `app/Http/Controllers/Api/MedicalSpecialtyController.php`
- `app/Models/Consultation.php`
- `app/Http/Controllers/Api/ConsultationController.php`
- `routes/api.php`

### 2. Novos Endpoints da API

```
GET /api/medical-specialties              # Listar todas as especialidades
GET /api/medical-specialties?search=cardio # Buscar especialidades (filtro)
GET /api/medical-specialties/{id}         # Obter uma especialidade específica
```

### 3. Atualização nas Consultas

A tabela `consultations` agora tem um campo `medical_specialty_id` (nullable) que faz referência à especialidade médica.

---

## 📱 Frontend (React Native)

### 1. Novo Serviço: `medicalSpecialtyService.js`

Serviço para buscar especialidades médicas da API com suporte a busca/filtro.

### 2. Autocomplete no `AddConsultationScreen`

**Funcionamento:**
1. O campo de especialidade **só aparece quando o tipo de consulta é "Médica"**
2. Ao clicar no campo, abre um modal com:
   - **Campo de busca** para filtrar especialidades
   - **Lista completa** de todas as 56 especialidades
   - **Seleção visual** com ícone de check
3. A especialidade selecionada é exibida no campo
4. É enviada para a API ao salvar a consulta

**Componentes adicionados:**
- Modal de seleção com busca
- FlatList com scroll para as especialidades
- Design responsivo e intuitivo

---

## 🚀 Como Atualizar no Servidor

### Passo 1: Atualizar o código do backend

```bash
# Conectar ao servidor
ssh seu_usuario@207.244.235.147

# Navegar para o diretório do backend
cd lacos-api

# Fazer pull das alterações
git pull origin backend

# Executar as migrations
php artisan migrate --force

# Limpar cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### Passo 2: Verificar se as migrations rodaram

```bash
# Conectar ao MySQL
mysql -u lacos -p lacos

# Verificar se a tabela foi criada
SHOW TABLES LIKE 'medical_specialties';

# Ver as especialidades inseridas
SELECT COUNT(*) FROM medical_specialties;
# Deve retornar: 56

# Ver algumas especialidades
SELECT * FROM medical_specialties LIMIT 10;

# Verificar se o campo foi adicionado em consultations
DESCRIBE consultations;
# Deve ter: medical_specialty_id | bigint unsigned | YES | MUL | NULL
```

### Passo 3: Testar a API

```bash
# Testar endpoint de especialidades (substitua SEU_TOKEN)
curl -H "Authorization: Bearer SEU_TOKEN" \
     http://207.244.235.147/api/medical-specialties

# Testar busca por especialidade
curl -H "Authorization: Bearer SEU_TOKEN" \
     "http://207.244.235.147/api/medical-specialties?search=cardio"
```

---

## 📊 Estrutura da Tabela `medical_specialties`

| Campo      | Tipo       | Descrição                   |
|------------|------------|-----------------------------|
| id         | BIGINT     | ID único (auto increment)   |
| name       | VARCHAR    | Nome da especialidade       |
| created_at | TIMESTAMP  | Data de criação             |
| updated_at | TIMESTAMP  | Data de atualização         |

---

## 📊 Campo Adicionado em `consultations`

| Campo                | Tipo              | Descrição                           |
|----------------------|-------------------|-------------------------------------|
| medical_specialty_id | BIGINT (nullable) | Referência para medical_specialties |

- **Relacionamento:** `belongsTo(MedicalSpecialty::class)`
- **Constraint:** `onDelete('set null')` - se a especialidade for deletada, o campo fica NULL

---

## 🧪 Como Testar no App

1. **Abra o app** e faça login
2. **Entre em um grupo**
3. **Vá para Consultas** → Botão "+"
4. **Selecione tipo:** "Médica"
5. **Veja o campo "Especialidade Médica"** aparecer
6. **Clique no campo** → Modal abre
7. **Digite** "cardio" na busca → Veja a lista filtrar
8. **Selecione** "Cardiologia"
9. **Preencha os outros campos** e salve

---

## 📝 Notas Importantes

1. ✅ **Especialidade é opcional** (nullable) - não é obrigatória ao cadastrar
2. ✅ **Só aparece para consultas médicas** - não aparece para Fisioterapia, Exames ou Urgências
3. ✅ **Busca em tempo real** - filtra enquanto você digita
4. ✅ **Dados vindos do backend** - as 56 especialidades são buscadas da API
5. ✅ **Integração completa** - frontend e backend funcionando juntos

---

## 🔧 Solução de Problemas

### Se a migration falhar:

```bash
# Verificar status das migrations
php artisan migrate:status

# Se necessário, fazer rollback e tentar novamente
php artisan migrate:rollback --step=1
php artisan migrate
```

### Se o endpoint não funcionar:

```bash
# Limpar todas as caches
php artisan optimize:clear

# Verificar rotas
php artisan route:list | grep specialties
```

### Se as especialidades não aparecerem no app:

1. Verifique se o backend está rodando
2. Verifique o token de autenticação
3. Veja os logs no console do Expo
4. Teste o endpoint diretamente com curl

---

## ✅ Commits

**Backend:**
```
feat: adiciona tabela de especialidades médicas e campo no cadastro de consultas
```

**Frontend:**
```
feat: adiciona autocomplete de especialidades médicas no cadastro de consultas
```

---

## 📞 Suporte

Se tiver algum problema na implementação ou nas migrations, verifique:
1. Logs do Laravel: `storage/logs/laravel.log`
2. Logs do MySQL
3. Console do Expo no frontend

