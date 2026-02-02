#!/bin/bash

echo "🔧 Corrigindo método getClients no CaregiverController..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# 1. Fazer backup
echo "📦 Criando backup..."
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# 2. Verificar se o método existe
if grep -q "public function getClients" "$CONTROLLER_FILE"; then
    echo "✅ Método getClients encontrado"
    echo "📝 Verificando implementação..."
    
    # Verificar se tem DB::table
    if grep -q "DB::table.*group_members" "$CONTROLLER_FILE"; then
        echo "✅ Implementação parece correta"
    else
        echo "⚠️  Implementação pode estar incorreta"
    fi
    
    # Verificar se tem use Illuminate\Support\Facades\DB
    if grep -q "use Illuminate\\Support\\Facades\\DB" "$CONTROLLER_FILE"; then
        echo "✅ Use DB encontrado"
    else
        echo "❌ Use DB NÃO encontrado - isso pode causar erro 500!"
        echo "📝 Adicionando use DB..."
        
        # Adicionar use DB após outros use statements
        sudo sed -i "/^use Illuminate\\Support\\Facades\\Auth;/a use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE"
        echo "✅ Use DB adicionado"
    fi
else
    echo "❌ Método getClients NÃO encontrado!"
    echo "📝 Adicionando método..."
    
    # Verificar se tem use DB
    if ! grep -q "use Illuminate\\Support\\Facades\\DB" "$CONTROLLER_FILE"; then
        echo "📝 Adicionando use DB..."
        sudo sed -i "/^use Illuminate\\Support\\Facades\\Auth;/a use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE"
    fi
    
    # Adicionar método antes do último }
    # Encontrar a linha do último método e adicionar antes
    LAST_METHOD_LINE=$(grep -n "public function" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)
    if [ -z "$LAST_METHOD_LINE" ]; then
        echo "❌ Não foi possível encontrar onde adicionar o método"
        exit 1
    fi
    
    # Criar método completo
    cat >> /tmp/getClients_method.txt << 'METHOD_EOF'

    /**
     * Listar clientes (admins dos grupos onde o cuidador é membro)
     * 
     * GET /api/caregivers/clients
     */
    public function getClients()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Buscar grupos onde o usuário é membro usando query direta na tabela group_members
            $groupIds = DB::table('group_members')
                ->where('user_id', $user->id)
                ->pluck('group_id')
                ->toArray();

            if (empty($groupIds)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // Buscar admins (clientes) desses grupos
            $clients = DB::table('group_members')
                ->join('users', 'group_members.user_id', '=', 'users.id')
                ->join('groups', 'group_members.group_id', '=', 'groups.id')
                ->whereIn('group_members.group_id', $groupIds)
                ->where('group_members.role', 'admin')
                ->where('group_members.user_id', '!=', $user->id) // Excluir o próprio usuário
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.phone',
                    'users.city',
                    'users.neighborhood',
                    'users.photo as photo_url',
                    'groups.name as group_name',
                    'groups.id as group_id'
                )
                ->distinct()
                ->get()
                ->map(function ($client) {
                    // Calcular rating médio (se houver reviews)
                    $rating = DB::table('reviews')
                        ->where('reviewed_user_id', $client->id)
                        ->avg('rating');
                    
                    $reviewsCount = DB::table('reviews')
                        ->where('reviewed_user_id', $client->id)
                        ->count();

                    return [
                        'id' => $client->id,
                        'name' => $client->name,
                        'email' => $client->email,
                        'phone' => $client->phone,
                        'city' => $client->city,
                        'neighborhood' => $client->neighborhood,
                        'photo_url' => $client->photo_url,
                        'photo' => $client->photo_url, // Alias para compatibilidade
                        'group_name' => $client->group_name,
                        'group_id' => $client->group_id,
                        'rating' => $rating ? round($rating, 1) : 0,
                        'reviews_count' => $reviewsCount,
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'data' => $clients
            ]);

        } catch (\Exception $e) {
            \Log::error('Erro em getClients: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar clientes: ' . $e->getMessage()
            ], 500);
        }
    }
METHOD_EOF

    # Inserir antes do último }
    sudo sed -i "$((LAST_METHOD_LINE + 50))r /tmp/getClients_method.txt" "$CONTROLLER_FILE"
    rm /tmp/getClients_method.txt
    echo "✅ Método adicionado"
fi

echo ""

# 3. Verificar sintaxe PHP
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe detectado"
    php -l "$CONTROLLER_FILE"
    echo ""
    echo "🔄 Restaurando backup..."
    sudo cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi
echo ""

# 4. Limpar cache
echo "🧹 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Correção concluída!"
echo ""
echo "📋 Resumo:"
echo "   - Backup: $BACKUP_FILE"
echo "   - Método getClients verificado/corrigido"
echo "   - Use DB verificado/adicionado"
echo "   - Sintaxe PHP validada"
echo ""


