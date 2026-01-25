# 📋 Resumo - Filtros Adicionados na Lista de Cuidadores

## ✅ Filtros Implementados

### Frontend (`CaregiversListScreen.js`)

1. **Avaliação mínima** (já existia)
   - Seleção por estrelas (1 a 5)
   - Filtra cuidadores com avaliação >= selecionada

2. **Proximidade geográfica** (já existia)
   - Opções: 5km, 10km, 20km, 50km
   - Usa coordenadas do usuário logado

3. **Busca por texto** (já existia)
   - Busca por nome, cidade ou bairro

4. **Formação** (NOVO) ✅
   - Checkboxes para selecionar:
     - "Cuidador"
     - "Auxiliar de enfermagem"
   - Permite selecionar múltiplas opções

5. **Sexo** (NOVO) ✅
   - Botões para selecionar:
     - "Masculino"
     - "Feminino"
   - Seleção única (pode desmarcar)

6. **Valor máximo por hora** (NOVO) ✅
   - Campo de texto numérico
   - Formato: R$ XX.XX
   - Filtra cuidadores com `hourly_rate <= valor informado`

---

## 🔧 Alterações no Backend

### Migration (`add_caregiver_fields_to_users_table.php`)

**Campo adicionado:**
- `gender` (string, 20) - Armazena "Masculino" ou "Feminino"

### Controller (`CaregiverController.php`)

**Novos parâmetros aceitos no endpoint `GET /api/caregivers`:**

1. **`formation_types`** (array)
   - Exemplo: `["Cuidador", "Auxiliar de enfermagem"]`
   - Filtra por tipo de formação
   - Mantém compatibilidade com parâmetro antigo `formation` (string)

2. **`gender`** (string)
   - Valores: "Masculino" ou "Feminino"
   - Filtra por sexo do cuidador

3. **`max_hourly_rate`** (float)
   - Exemplo: `50.00`
   - Filtra cuidadores com valor/hora <= informado

---

## 📝 Exemplo de Requisição

```javascript
GET /api/caregivers?min_rating=4&formation_types[]=Cuidador&formation_types[]=Auxiliar de enfermagem&gender=Feminino&max_hourly_rate=50.00&search=Maria
```

**Parâmetros:**
- `min_rating=4` - Avaliação mínima de 4 estrelas
- `formation_types[]=Cuidador` - Formação "Cuidador"
- `formation_types[]=Auxiliar de enfermagem` - Formação "Auxiliar de enfermagem"
- `gender=Feminino` - Apenas mulheres
- `max_hourly_rate=50.00` - Valor máximo R$ 50,00/hora
- `search=Maria` - Busca por "Maria"

---

## 🎨 Interface do Usuário

### Seção de Filtros

Os filtros aparecem quando o usuário clica no ícone de filtro no header:

1. **Avaliação mínima**
   - 5 botões de estrelas (1 a 5)
   - Clicar novamente desmarca

2. **Proximidade**
   - 4 botões: 5km, 10km, 20km, 50km
   - Clicar novamente desmarca

3. **Formação** (NOVO)
   - 2 checkboxes:
     - ☐ Cuidador
     - ☐ Auxiliar de enfermagem
   - Permite selecionar ambos

4. **Sexo** (NOVO)
   - 2 botões lado a lado:
     - [Masculino] [Feminino]
   - Seleção única, pode desmarcar

5. **Valor máximo por hora** (NOVO)
   - Campo de texto com prefixo "R$"
   - Aceita apenas números e ponto decimal
   - Exemplo: "50.00"

---

## 🔄 Próximos Passos

### Para conectar ao backend:

1. **Atualizar `loadCaregivers()` em `CaregiversListScreen.js`**:
   ```javascript
   const params = {
     min_rating: minRating > 0 ? minRating : undefined,
     max_distance: maxDistance,
     latitude: user?.latitude,
     longitude: user?.longitude,
     search: searchText.trim() || undefined,
     formation_types: selectedFormations.length > 0 ? selectedFormations : undefined,
     gender: selectedGender || undefined,
     max_hourly_rate: maxHourlyRate ? parseFloat(maxHourlyRate) : undefined,
   };
   
   // Remover undefined
   Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
   
   const response = await api.get('/caregivers', { params });
   ```

2. **Executar migration no backend**:
   ```bash
   cd /var/www/lacos-backend
   php artisan migrate
   ```

3. **Atualizar Model User**:
   - Adicionar `gender` no `$fillable`

---

## ✅ Status

- ✅ Frontend: Filtros implementados e funcionando (com dados mockados)
- ✅ Backend: Controller atualizado para aceitar novos filtros
- ✅ Migration: Campo `gender` adicionado
- ⚠️ Pendente: Conectar frontend ao backend (quando API estiver disponível)

