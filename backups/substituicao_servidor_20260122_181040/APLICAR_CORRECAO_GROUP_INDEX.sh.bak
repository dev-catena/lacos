#!/bin/bash

# Script para aplicar correção no método index() do GroupController automaticamente

SERVER_IP="193.203.182.22"
SERVER_USER="darley"
SERVER_PASSWORD="yhvh77"
PORT="63022"

echo "🔧 Aplicando correção no método index() do GroupController..."
echo ""

# Criar script para aplicar no servidor
cat > /tmp/aplicar_correcao_group_index.sh << 'SERVER_SCRIPT'
#!/bin/bash

cd /var/www/lacos-backend

# Fazer backup
echo "📝 Fazendo backup..."
sudo cp app/Http/Controllers/Api/GroupController.php app/Http/Controllers/Api/GroupController.php.bak.$(date +%Y%m%d_%H%M%S)

# Ler o arquivo atual
FILE="app/Http/Controllers/Api/GroupController.php"

# Encontrar início e fim do método index()
START_LINE=$(grep -n "public function index" "$FILE" | cut -d: -f1)
END_LINE=$(awk "NR > $START_LINE && /^    \}/ && /^    \/\*\*/ {print NR; exit}" "$FILE" || awk "NR > $START_LINE && /^    \}/ && /^    public function/ {print NR-1; exit}" "$FILE" || echo "$((START_LINE + 20))")

if [ -z "$END_LINE" ] || [ "$END_LINE" -le "$START_LINE" ]; then
    # Tentar encontrar o próximo método
    END_LINE=$(awk "NR > $START_LINE && /^    public function/ {print NR-1; exit}" "$FILE")
fi

if [ -z "$END_LINE" ] || [ "$END_LINE" -le "$START_LINE" ]; then
    END_LINE=$((START_LINE + 25))
fi

echo "📋 Método index() encontrado nas linhas $START_LINE a $END_LINE"

# Criar novo método index()
cat > /tmp/new_index_method.php << 'NEW_METHOD'
    /**
     * Display a listing of user's groups
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        \Log::info("🔍 GroupController.index - Buscando grupos para usuário ID: {$user->id}, Email: {$user->email}");
        
        // Buscar grupos onde o usuário é membro (via group_members)
        $groupsAsMember = $user->groups()
            ->with(['creator', 'groupMembers.user'])
            ->withCount('groupMembers as members_count')
            ->get();
        
        \Log::info("📊 GroupController.index - Grupos como membro: " . $groupsAsMember->count());
        
        // Buscar grupos criados pelo usuário (via created_by)
        $groupsAsCreator = Group::where('created_by', $user->id)
            ->with(['creator', 'groupMembers.user'])
            ->withCount('groupMembers as members_count')
            ->get();
        
        \Log::info("📊 GroupController.index - Grupos como criador: " . $groupsAsCreator->count());
        
        // Combinar e remover duplicatas
        $allGroups = $groupsAsMember->merge($groupsAsCreator)->unique('id');
        
        \Log::info("📊 GroupController.index - Total de grupos únicos: " . $allGroups->count());
        
        // Adicionar is_admin e is_creator para cada grupo
        $allGroups->each(function ($group) use ($user) {
            $member = $group->groupMembers->firstWhere('user_id', $user->id);
            $group->is_admin = $member && $member->role === 'admin';
            $group->is_creator = $group->created_by === $user->id;
            
            // Log para debug
            \Log::info("   - Grupo ID: {$group->id}, Nome: {$group->name}, is_admin: " . ($group->is_admin ? 'true' : 'false') . ", is_creator: " . ($group->is_creator ? 'true' : 'false'));
        });
        
        return response()->json($allGroups->values());
    }
NEW_METHOD

# Criar arquivo temporário com a substituição
{
    head -n $((START_LINE - 1)) "$FILE"
    cat /tmp/new_index_method.php
    tail -n +$((END_LINE + 1)) "$FILE"
} > /tmp/GroupController_temp.php

# Substituir arquivo original
sudo mv /tmp/GroupController_temp.php "$FILE"
sudo chown www-data:www-data "$FILE"

echo "✅ Correção aplicada!"
echo ""
echo "🧹 Limpando cache..."
sudo php artisan route:clear
sudo php artisan config:clear

echo ""
echo "✅ Concluído!"
SERVER_SCRIPT

echo "📤 Copiando script para o servidor..."
sshpass -p "$SERVER_PASSWORD" scp -P $PORT -o StrictHostKeyChecking=no \
    /tmp/aplicar_correcao_group_index.sh \
    $SERVER_USER@$SERVER_IP:/tmp/aplicar_correcao_group_index.sh

echo ""
echo "✅ Script copiado!"
echo ""
echo "📋 Execute no servidor:"
echo "   ssh -p $PORT $SERVER_USER@$SERVER_IP"
echo "   chmod +x /tmp/aplicar_correcao_group_index.sh"
echo "   sudo bash /tmp/aplicar_correcao_group_index.sh"
echo ""












