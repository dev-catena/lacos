#!/bin/bash

# Script para corrigir o problema de "use AppHttpControllers..." aparecendo antes do JSON
# no AdminUserController

set -e

SERVER="193.203.182.22"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
CONTROLLER_PATH="app/Http/Controllers/Api/AdminUserController.php"
BACKEND_DIR="/var/www/lacos-backend"

echo "🔧 Corrigindo AdminUserController para remover output antes do JSON..."
echo ""

# Criar versão corrigida do controller
cat > /tmp/AdminUserController_CORRIGIDO.php << 'ADMINUSERCONTROLLER_EOF'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    /**
     * Listar todos os usuários
     * GET /api/admin/users
     */
    public function index()
    {
        // Limpar qualquer output buffer anterior
        if (ob_get_level()) {
            ob_clean();
        }
        
        try {
            $users = User::leftJoin('user_plans', function($join) {
                $join->on('users.id', '=', 'user_plans.user_id')
                     ->where('user_plans.is_active', '=', true);
            })
            ->leftJoin('plans', 'user_plans.plan_id', '=', 'plans.id')
            ->select(
                'users.*',
                'plans.name as plan_name',
                'plans.id as plan_id'
            )
            ->orderBy('users.created_at', 'desc')
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'profile' => $user->profile,
                    'is_blocked' => (bool) ($user->is_blocked ?? false),
                    'created_at' => $user->created_at,
                    'plan' => $user->plan_name ? [
                        'id' => $user->plan_id,
                        'name' => $user->plan_name,
                    ] : null,
                ];
            });

            // Garantir que não há output antes do JSON
            if (ob_get_level()) {
                ob_clean();
            }
            
            return response()->json($users, 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\Exception $e) {
            // Limpar output em caso de erro também
            if (ob_get_level()) {
                ob_clean();
            }
            
            return response()->json([
                'error' => 'Erro ao buscar usuários',
                'message' => $e->getMessage()
            ], 500, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }

    /**
     * Bloquear usuário
     * POST /api/admin/users/{id}/block
     */
    public function block($id)
    {
        if (ob_get_level()) {
            ob_clean();
        }
        
        try {
            $user = User::findOrFail($id);

            $user->is_blocked = true;
            $user->save();

            // Revogar todos os tokens do usuário
            $user->tokens()->delete();

            if (ob_get_level()) {
                ob_clean();
            }

            return response()->json([
                'message' => 'Usuário bloqueado com sucesso',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_blocked' => true,
                ]
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\Exception $e) {
            if (ob_get_level()) {
                ob_clean();
            }
            
            return response()->json([
                'error' => 'Erro ao bloquear usuário',
                'message' => $e->getMessage()
            ], 500, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }

    /**
     * Desbloquear usuário
     * POST /api/admin/users/{id}/unblock
     */
    public function unblock($id)
    {
        if (ob_get_level()) {
            ob_clean();
        }
        
        try {
            $user = User::findOrFail($id);

            $user->is_blocked = false;
            $user->save();

            if (ob_get_level()) {
                ob_clean();
            }

            return response()->json([
                'message' => 'Usuário desbloqueado com sucesso',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_blocked' => false,
                ]
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\Exception $e) {
            if (ob_get_level()) {
                ob_clean();
            }
            
            return response()->json([
                'error' => 'Erro ao desbloquear usuário',
                'message' => $e->getMessage()
            ], 500, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }

    /**
     * Obter plano do usuário
     * GET /api/admin/users/{id}/plan
     */
    public function getUserPlan($id)
    {
        if (ob_get_level()) {
            ob_clean();
        }
        
        try {
            $userPlan = DB::table('user_plans')
                ->where('user_id', $id)
                ->where('is_active', true)
                ->first();

            if (!$userPlan) {
                if (ob_get_level()) {
                    ob_clean();
                }
                
                return response()->json([
                    'plan' => null,
                    'message' => 'Usuário não possui plano ativo'
                ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }

            $plan = DB::table('plans')
                ->where('id', $userPlan->plan_id)
                ->first();

            if (ob_get_level()) {
                ob_clean();
            }

            return response()->json([
                'plan' => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'features' => json_decode($plan->features, true),
                ],
                'user_plan' => [
                    'started_at' => $userPlan->started_at,
                    'expires_at' => $userPlan->expires_at,
                ]
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\Exception $e) {
            if (ob_get_level()) {
                ob_clean();
            }
            
            return response()->json([
                'error' => 'Erro ao buscar plano do usuário',
                'message' => $e->getMessage()
            ], 500, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }

    /**
     * Excluir usuário
     * DELETE /api/admin/users/{id}
     */
    public function destroy($id)
    {
        if (ob_get_level()) {
            ob_clean();
        }
        
        try {
            $user = User::findOrFail($id);

            // Verificar se é o próprio usuário logado (não permitir auto-exclusão)
            $currentUser = auth()->user();
            if ($currentUser && $currentUser->id == $id) {
                if (ob_get_level()) {
                    ob_clean();
                }
                
                return response()->json([
                    'error' => 'Você não pode excluir sua própria conta',
                    'message' => 'Use a opção de deletar conta no seu perfil'
                ], 403, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }

            // Revogar todos os tokens do usuário antes de excluir
            $user->tokens()->delete();

            // Excluir relacionamentos (se necessário)
            // Exemplo: user_plans, grupos, etc.
            DB::table('user_plans')->where('user_id', $id)->delete();

            // Excluir o usuário
            $userEmail = $user->email;
            $userName = $user->name;
            $user->delete();

            if (ob_get_level()) {
                ob_clean();
            }

            return response()->json([
                'message' => 'Usuário excluído com sucesso',
                'deleted_user' => [
                    'id' => $id,
                    'name' => $userName,
                    'email' => $userEmail,
                ]
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            if (ob_get_level()) {
                ob_clean();
            }
            
            return response()->json([
                'error' => 'Usuário não encontrado',
                'message' => 'O usuário com o ID informado não existe'
            ], 404, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (\Exception $e) {
            if (ob_get_level()) {
                ob_clean();
            }
            
            return response()->json([
                'error' => 'Erro ao excluir usuário',
                'message' => $e->getMessage()
            ], 500, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }
}
ADMINUSERCONTROLLER_EOF

echo "📤 Enviando controller corrigido para o servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no /tmp/AdminUserController_CORRIGIDO.php "$USER@$SERVER:/tmp/AdminUserController_CORRIGIDO.php"

echo ""
echo "🔧 Aplicando correção no servidor..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << EOF
    export SUDO_PASS='$PASSWORD'
    cd $BACKEND_DIR
    
    # Fazer backup do controller original
    if [ -f $CONTROLLER_PATH ]; then
        echo "\$SUDO_PASS" | sudo -S cp $CONTROLLER_PATH ${CONTROLLER_PATH}.bak.\$(date +%Y%m%d_%H%M%S)
        echo "✅ Backup criado"
    fi
    
    # Substituir o controller
    echo "\$SUDO_PASS" | sudo -S mv /tmp/AdminUserController_CORRIGIDO.php $CONTROLLER_PATH
    echo "\$SUDO_PASS" | sudo -S chown www-data:www-data $CONTROLLER_PATH
    echo "\$SUDO_PASS" | sudo -S chmod 644 $CONTROLLER_PATH
    
    echo "✅ Controller substituído"
    
    # Limpar cache do Laravel
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan route:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan config:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan cache:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan optimize:clear
    
    echo "✅ Cache limpo"
EOF

echo ""
echo "✅ Correção aplicada com sucesso!"
echo ""
echo "📝 O AdminUserController foi corrigido para:"
echo "   - Limpar output buffer antes de retornar JSON"
echo "   - Garantir que não há texto antes do JSON"
echo "   - Usar flags JSON_UNESCAPED_UNICODE e JSON_UNESCAPED_SLASHES"
echo ""
echo "🔄 Teste acessando: http://admin.lacosapp.com/usuarios"













