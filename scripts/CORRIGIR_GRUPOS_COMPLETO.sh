#!/bin/bash

# Script para corrigir o método index() do GroupController
# Este script busca grupos tanto via group_members quanto via created_by
# Execute com: sudo bash CORRIGIR_GRUPOS_COMPLETO.sh

set -e

cd /var/www/lacos-backend

echo "🔧 Corrigindo método index() do GroupController..."
echo ""

# Fazer backup
echo "📝 Fazendo backup do GroupController..."
BACKUP_FILE="app/Http/Controllers/Api/GroupController.php.bak.$(date +%Y%m%d_%H%M%S)"
cp app/Http/Controllers/Api/GroupController.php "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Arquivo a ser modificado
FILE="app/Http/Controllers/Api/GroupController.php"

# Encontrar início do método index()
START_LINE=$(grep -n "public function index" "$FILE" | cut -d: -f1)

if [ -z "$START_LINE" ]; then
    echo "❌ Erro: Método index() não encontrado!"
    exit 1
fi

echo "📋 Método index() encontrado na linha $START_LINE"

# Encontrar o final do método (próximo método público ou fechamento de classe)
END_LINE=$(awk "NR > $START_LINE && /^    public function/ {print NR-1; exit}" "$FILE")

if [ -z "$END_LINE" ] || [ "$END_LINE" -le "$START_LINE" ]; then
    # Tentar encontrar fechamento de classe
    END_LINE=$(awk "NR > $START_LINE && /^}$/ {print NR-1; exit}" "$FILE")
fi

if [ -z "$END_LINE" ] || [ "$END_LINE" -le "$START_LINE" ]; then
    # Fallback: assumir 25 linhas
    END_LINE=$((START_LINE + 25))
    echo "⚠️  Não foi possível determinar o fim do método, usando $END_LINE linhas"
fi

echo "📋 Substituindo linhas $START_LINE a $END_LINE"
echo ""

# Criar novo método index() corrigido
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
    # Linhas antes do método
    head -n $((START_LINE - 1)) "$FILE"
    # Novo método
    cat /tmp/index_method_corrigido.php
    # Linhas depois do método
    tail -n +$((END_LINE + 1)) "$FILE"
} > /tmp/GroupController_temp.php

# Verificar se o arquivo foi criado corretamente
if [ ! -s /tmp/GroupController_temp.php ]; then
    echo "❌ Erro: Arquivo temporário não foi criado corretamente!"
    exit 1
fi

# Substituir arquivo original
mv /tmp/GroupController_temp.php "$FILE"
chown www-data:www-data "$FILE"

echo "✅ Método index() corrigido com sucesso!"
echo ""

# Limpar cache
echo "🧹 Limpando cache do Laravel..."
php artisan route:clear
php artisan config:clear
php artisan cache:clear

echo ""
echo "✅ Correção aplicada com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Teste fazendo login no app com amigo@gmail.com"
echo "   2. Verifique se os grupos aparecem"
echo "   3. Verifique os logs em: storage/logs/laravel.log"
echo ""












