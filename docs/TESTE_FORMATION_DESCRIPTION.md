# Teste - Detalhes de Formação (formation_description)

## Resumo

O campo **"Detalhes da Formação"** (`formation_description`) foi testado em backend e frontend. Ambos estão funcionando corretamente quando testados isoladamente.

## Scripts de Teste

### 1. Backend (curl)
```bash
cd backend-laravel
./test-curl-formation-update.sh
# ou com URL remota:
./test-curl-formation-update.sh http://192.168.0.20:8000
```

### 2. Ciclo de Vida Frontend (Node.js)
```bash
node scripts/test-frontend-formation-lifecycle.js
# ou com URL remota:
BASE_URL=http://192.168.0.20:8000 node scripts/test-frontend-formation-lifecycle.js
```

---

## Fluxo do Frontend (Ciclo de Vida)

### 1. Carregamento Inicial
- **useFocusEffect** em `ProfessionalCaregiverDataScreen` chama `userService.getUser()`
- **GET /api/user** retorna o usuário com `formation_description` (snake_case)
- `extractFormationDescription(data)` usa: `data?.formation_description ?? data?.formationDescription`
- `updateUser(data)` atualiza o contexto e `setFormData` com os valores

### 2. Envio ao Salvar
- **handleSubmit** monta `dataToUpdate.formation_description = formData.formation_description?.trim() || null`
- **PUT /api/users/{id}** envia JSON com `formation_description`
- Backend retorna o usuário atualizado (inclui `formation_description`)

### 3. Após Sucesso
- `response.data` contém o usuário retornado
- `formationDesc = response.data.formation_description ?? response.data.formationDescription ?? ''`
- `updateUser(userWithCourses)` persiste no AuthContext e AsyncStorage
- `setFormData` atualiza com o valor retornado

---

## Formato do JSON

| Origem | Chave | Formato |
|--------|-------|---------|
| Backend (Laravel) | `formation_description` | snake_case |
| Backend | `formationDescription` | Não usado (camelCase) |
| Frontend espera | `formation_description` ou `formationDescription` | Fallback para compatibilidade |

---

## Pontos de Falha Possíveis

Se o app não exibe ou não persiste o valor:

1. **Backend não retorna o campo**
   - Verificar migration: coluna `formation_description` existe?
   - Verificar Model User: `formation_description` no `$fillable`?

2. **Frontend não envia**
   - Verificar `ProfessionalCaregiverDataScreen`: `dataToUpdate.formation_description` está sendo incluído?
   - Verificar se `formData.formation_description` está sendo lido do TextInput

3. **JSON mal parseado**
   - apiService retorna `response.text()` e faz `JSON.parse(cleanedText)`
   - Se houver texto antes do `{`, o script remove (firstBrace)

4. **Contexto não atualizado**
   - `updateUser` faz merge: `{ ...user, ...updatedData }`
   - Se `response.data` não tiver `formation_description`, o merge não atualiza

5. **formData não atualizado após salvar**
   - Linha 401-405: `setFormData` com `formationDesc` do response
   - Se `response.data` não tiver o campo, `formationDesc` fica vazio

6. **useFocusEffect não recarrega**
   - Ao voltar para a tela, `reloadUserData` chama `userService.getUser()`
   - Se o GET não retornar `formation_description`, o formData fica desatualizado

---

## Resultado dos Testes

- ✅ **Backend**: PUT salva e retorna `formation_description`
- ✅ **Frontend**: GET recebe, parseia e extrai corretamente
- ✅ **Frontend**: PUT envia e atualiza formData com o retorno
- ✅ **Persistência**: Valor persiste no banco e retorna no GET seguinte
