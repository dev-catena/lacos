#!/bin/bash

# Script simples para corrigir o método index() do GroupController

SERVER_IP="193.203.182.22"
SERVER_USER="darley"
SERVER_PASSWORD="yhvh77"
PORT="63022"

echo "🔧 Aplicando correção no método index() do GroupController..."
echo ""

# Criar patch para aplicar no servidor
sshpass -p "$SERVER_PASSWORD" ssh -p $PORT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'REMOTE_SCRIPT'
cd /var/www/lacos-backend

# Fazer backup
echo "📝 Fazendo backup..."
sudo cp app/Http/Controllers/Api/GroupController.php app/Http/Controllers/Api/GroupController.php.bak.$(date +%Y%m%d_%H%M%S)

# Criar arquivo com o método corrigido
sudo tee /tmp/index_method_corrigido.php > /dev/null << 'NEW_METHOD'
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
        
        // Buscar grupos criados pelo usuário (via created_by) que podem não estar em group_members
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

# Encontrar linhas do método index atual
FILE="app/Http/Controllers/Api/GroupController.php"
START_LINE=$(grep -n "public function index" "$FILE" | cut -d: -f1)

# Encontrar o final do método (próximo método ou fechamento de classe)
END_LINE=$(awk "NR > $START_LINE && /^    public function/ {print NR-1; exit}" "$FILE")
if [ -z "$END_LINE" ]; then
    END_LINE=$(awk "NR > $START_LINE && /^}$/ {print NR-1; exit}" "$FILE")
fi
if [ -z "$END_LINE" ] || [ "$END_LINE" -le "$START_LINE" ]; then
    END_LINE=$((START_LINE + 25))
fi

echo "📋 Substituindo método index() (linhas $START_LINE a $END_LINE)..."

# Criar novo arquivo com a substituição
{
    head -n $((START_LINE - 1)) "$FILE"
    cat /tmp/index_method_corrigido.php
    tail -n +$((END_LINE + 1)) "$FILE"
} | sudo tee /tmp/GroupController_new.php > /dev/null

# Substituir arquivo original
sudo mv /tmp/GroupController_new.php "$FILE"
sudo chown www-data:www-data "$FILE"

echo "✅ Correção aplicada!"
echo ""
echo "🧹 Limpando cache..."
sudo php artisan route:clear
sudo php artisan config:clear

echo ""
echo "✅ Concluído! Teste agora fazendo login no app."
REMOTE_SCRIPT

echo ""
echo "✅ Correção aplicada no servidor!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Teste fazendo login com amigo@gmail.com"
echo "   2. Verifique se os grupos aparecem"
echo "   3. Verifique os logs em /var/www/lacos-backend/storage/logs/laravel.log"
echo ""












