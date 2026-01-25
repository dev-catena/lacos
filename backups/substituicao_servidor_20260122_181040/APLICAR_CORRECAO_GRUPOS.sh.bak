#!/bin/bash

# Script para aplicar correção no método index() do GroupController
# Execute este script no servidor com: sudo bash APLICAR_CORRECAO_GRUPOS.sh

cd /var/www/lacos-backend

# Fazer backup
echo "📝 Fazendo backup..."
cp app/Http/Controllers/Api/GroupController.php app/Http/Controllers/Api/GroupController.php.bak.$(date +%Y%m%d_%H%M%S)

# Ler o arquivo atual
FILE="app/Http/Controllers/Api/GroupController.php"

# Encontrar início do método index()
START_LINE=$(grep -n "public function index" "$FILE" | cut -d: -f1)

# Encontrar o final do método (próximo método)
END_LINE=$(awk "NR > $START_LINE && /^    public function/ {print NR-1; exit}" "$FILE")
if [ -z "$END_LINE" ] || [ "$END_LINE" -le "$START_LINE" ]; then
    END_LINE=$((START_LINE + 25))
fi

echo "📋 Método index() encontrado nas linhas $START_LINE a $END_LINE"

# Criar novo método index()
cat > /tmp/index_method_corrigido.php << 'NEW_METHOD'
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

# Criar arquivo temporário com a substituição
{
    head -n $((START_LINE - 1)) "$FILE"
    cat /tmp/index_method_corrigido.php
    tail -n +$((END_LINE + 1)) "$FILE"
} > /tmp/GroupController_temp.php

# Substituir arquivo original
mv /tmp/GroupController_temp.php "$FILE"
chown www-data:www-data "$FILE"

echo "✅ Correção aplicada!"
echo ""
echo "🧹 Limpando cache..."
php artisan route:clear
php artisan config:clear

echo ""
echo "✅ Concluído! Teste agora fazendo login no app."












