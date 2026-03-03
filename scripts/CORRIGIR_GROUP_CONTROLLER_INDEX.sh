#!/bin/bash

# Script para corrigir o método index() do GroupController para incluir todos os grupos

SERVER_IP="192.168.0.20"
SERVER_USER="darley"
SERVER_PASSWORD="yhvh77"
PORT="63022"

echo "🔧 Corrigindo método index() do GroupController..."
echo ""

# Criar arquivo com o método corrigido
cat > /tmp/GroupController_index_corrigido.php << 'PHP_METHOD'
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
PHP_METHOD

echo "📤 Copiando método corrigido para o servidor..."
sshpass -p "$SERVER_PASSWORD" scp -P $PORT -o StrictHostKeyChecking=no \
    /tmp/GroupController_index_corrigido.php \
    $SERVER_USER@$SERVER_IP:/tmp/GroupController_index_corrigido.php

echo ""
echo "✅ Método copiado!"
echo ""
echo "📋 Próximos passos (execute no servidor):"
echo ""
echo "1. Fazer backup do GroupController:"
echo "   ssh -p $PORT $SERVER_USER@$SERVER_IP"
echo "   sudo cp /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php.bak.\$(date +%Y%m%d_%H%M%S)"
echo ""
echo "2. Aplicar a correção manualmente:"
echo "   cd /var/www/lacos-backend"
echo "   sudo nano app/Http/Controllers/Api/GroupController.php"
echo "   Substitua o método index() pelo conteúdo de /tmp/GroupController_index_corrigido.php"
echo ""
echo "   OU use este comando sed (substitua o método index completo):"
echo "   (Veja o conteúdo do arquivo em /tmp/GroupController_index_corrigido.php)"
echo ""
echo "3. Limpar cache:"
echo "   sudo php artisan route:clear"
echo "   sudo php artisan config:clear"
echo ""












