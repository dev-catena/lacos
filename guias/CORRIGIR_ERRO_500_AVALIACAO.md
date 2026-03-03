# 🔧 Corrigir Erro 500 ao Avaliar Cliente

## ❌ Problema

Ao tentar avaliar um paciente, aparece erro 500:
```
ERROR ❌ API Error: Server Error
POST /caregivers/clients/14/reviews
```

## 🔍 Causa

O método `createClientReview` provavelmente não existe no `CaregiverController` do backend ou tem algum erro.

## ✅ Solução

### Passo 1: Verificar se o método existe no servidor

Conecte ao servidor e verifique:

```bash
ssh darley@192.168.0.20
cd /var/www/lacos-backend
grep -n "createClientReview" app/Http/Controllers/Api/CaregiverController.php
```

**Se não aparecer nada**, o método não existe e precisa ser adicionado.

### Passo 2: Executar script de correção

Se o método não existir, execute o script de correção:

```bash
# No servidor (192.168.0.20)
cd /var/www/lacos-backend
sudo bash /home/darley/lacos/scripts/CORRIGIR_CREATE_CLIENT_REVIEW_CORRETO.sh
```

**OU** copie o script para o servidor primeiro:

```bash
# No seu computador local
scp /home/darley/lacos/scripts/CORRIGIR_CREATE_CLIENT_REVIEW_CORRETO.sh darley@192.168.0.20:/tmp/

# Depois no servidor
ssh darley@192.168.0.20
sudo bash /tmp/CORRIGIR_CREATE_CLIENT_REVIEW_CORRETO.sh
```

### Passo 3: Verificar se a rota está registrada

Verifique se a rota está no arquivo de rotas da API:

```bash
# No servidor
cd /var/www/lacos-backend
grep -n "caregivers/clients.*reviews" routes/api.php
```

Deve aparecer algo como:
```php
Route::post('/caregivers/clients/{id}/reviews', [CaregiverController::class, 'createClientReview']);
```

### Passo 4: Verificar se o model CaregiverReview existe

```bash
# No servidor
ls -la app/Models/CaregiverReview.php
```

Se não existir, pode ser que o model tenha outro nome ou precise ser criado.

### Passo 5: Verificar logs do Laravel

Para ver o erro real:

```bash
# No servidor
tail -50 /var/www/lacos-backend/storage/logs/laravel.log
```

Procure por erros relacionados a `createClientReview` ou `CaregiverReview`.

### Passo 6: Limpar cache do Laravel

Após fazer as correções:

```bash
# No servidor
cd /var/www/lacos-backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

## 🎯 Solução Rápida (Se tiver acesso SSH)

Execute tudo de uma vez:

```bash
ssh darley@192.168.0.20 << 'EOF'
cd /var/www/lacos-backend

# 1. Verificar se método existe
echo "🔍 Verificando método createClientReview..."
if grep -q "public function createClientReview" app/Http/Controllers/Api/CaregiverController.php; then
    echo "✅ Método existe"
    grep -n "public function createClientReview" app/Http/Controllers/Api/CaregiverController.php
else
    echo "❌ Método NÃO existe - precisa adicionar"
fi

# 2. Verificar rota
echo ""
echo "🔍 Verificando rota..."
if grep -q "caregivers/clients.*reviews" routes/api.php; then
    echo "✅ Rota existe"
    grep -n "caregivers/clients.*reviews" routes/api.php
else
    echo "❌ Rota NÃO existe - precisa adicionar"
fi

# 3. Verificar model
echo ""
echo "🔍 Verificando model CaregiverReview..."
if [ -f "app/Models/CaregiverReview.php" ]; then
    echo "✅ Model existe"
else
    echo "❌ Model NÃO existe"
fi

# 4. Ver últimos erros
echo ""
echo "🔍 Últimos erros do Laravel:"
tail -20 storage/logs/laravel.log | grep -i "error\|exception" | tail -5
EOF
```

## 📝 Adicionar Método Manualmente (Se necessário)

Se o script não funcionar, adicione o método manualmente no `CaregiverController.php`:

```php
/**
 * Criar avaliação de um cliente
 */
public function createClientReview(Request $request, $id)
{
    try {
        $user = $request->user();
        
        // Validar dados
        $validated = $request->validate([
            "rating" => "required|integer|min:1|max:5",
            "comment" => "required|string|min:10|max:500",
        ]);
        
        // Buscar cliente
        $client = User::find($id);
        if (!$client) {
            return response()->json([
                "success" => false,
                "message" => "Cliente não encontrado",
            ], 404);
        }
        
        // Verificar se o usuário e o cliente estão no mesmo grupo
        $userGroups = $user->groups()->pluck("groups.id")->toArray();
        $clientGroups = $client->groups()->pluck("groups.id")->toArray();
        $commonGroups = array_intersect($userGroups, $clientGroups);
        
        if (empty($commonGroups)) {
            return response()->json([
                "success" => false,
                "message" => "Você não tem permissão para avaliar este cliente",
            ], 403);
        }
        
        $groupId = $commonGroups[0]; // Usar o primeiro grupo em comum
        
        // Verificar se já existe uma avaliação deste cuidador para este cliente
        $existingReview = CaregiverReview::where("caregiver_id", $user->id)
            ->where("author_id", $client->id)
            ->where("group_id", $groupId)
            ->first();
        
        if ($existingReview) {
            // Atualizar avaliação existente
            $existingReview->update([
                "rating" => $validated["rating"],
                "comment" => $validated["comment"],
            ]);
            
            return response()->json([
                "success" => true,
                "message" => "Avaliação atualizada com sucesso",
                "review" => $existingReview->load(["caregiver", "author"]),
            ]);
        }
        
        // Criar nova avaliação
        $review = CaregiverReview::create([
            "caregiver_id" => $user->id,
            "author_id" => $client->id,
            "group_id" => $groupId,
            "rating" => $validated["rating"],
            "comment" => $validated["comment"],
        ]);
        
        return response()->json([
            "success" => true,
            "message" => "Avaliação criada com sucesso",
            "review" => $review->load(["caregiver", "author"]),
        ]);
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            "success" => false,
            "message" => "Dados inválidos",
            "errors" => $e->errors(),
        ], 422);
    } catch (\Exception $e) {
        \Log::error("Erro ao criar avaliação de cliente", [
            "error" => $e->getMessage(),
            "trace" => $e->getTraceAsString(),
        ]);
        
        return response()->json([
            "success" => false,
            "message" => "Server Error",
        ], 500);
    }
}
```

**Não esqueça de adicionar o import no topo do arquivo:**
```php
use App\Models\CaregiverReview;
```

## ✅ Verificação Final

Após corrigir, teste novamente no app. O erro 500 deve desaparecer e a avaliação deve ser criada com sucesso.

