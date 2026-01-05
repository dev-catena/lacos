<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GroupActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GroupActivityController extends Controller
{
    /**
     * Listar atividades recentes de todos os grupos do usuário
     * 
     * GET /api/activities/recent?limit=10
     */
    public function recent(Request $request)
    {
        try {
            $user = Auth::user();
            $limit = $request->query('limit', 10);
            
            // Buscar grupos do usuário através da tabela pivot group_user
            // Tentar diferentes formas de buscar grupos dependendo da estrutura
            $userGroups = collect();
            
            // Método 1: Se houver relacionamento direto
            if (method_exists($user, 'groups')) {
                try {
                    $userGroups = $user->groups()->pluck('groups.id');
                } catch (\Exception $e) {
                    \Log::warning('Erro ao buscar grupos via relacionamento: ' . $e->getMessage());
                }
            }
            
            // Método 2: Buscar via tabela pivot diretamente
            if ($userGroups->isEmpty()) {
                try {
                    $userGroups = \DB::table('group_user')
                        ->where('user_id', $user->id)
                        ->pluck('group_id');
                } catch (\Exception $e) {
                    \Log::warning('Erro ao buscar grupos via tabela pivot: ' . $e->getMessage());
                }
            }
            
            // Método 3: Se o usuário criou grupos (is_creator)
            if ($userGroups->isEmpty()) {
                try {
                    $userGroups = \DB::table('groups')
                        ->where('created_by', $user->id)
                        ->pluck('id');
                } catch (\Exception $e) {
                    \Log::warning('Erro ao buscar grupos criados pelo usuário: ' . $e->getMessage());
                }
            }
            
            if ($userGroups->isEmpty()) {
                \Log::info('Usuário ' . $user->id . ' (' . $user->name . ') não possui grupos associados');
                return response()->json([]);
            }
            
            \Log::info('Usuário ' . $user->id . ' (' . $user->name . ') possui ' . $userGroups->count() . ' grupo(s): ' . $userGroups->implode(', '));
            
            // Buscar atividades recentes dos grupos do usuário
            $activities = GroupActivity::with(['group'])
                ->whereIn('group_id', $userGroups)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function($activity) use ($userGroups) {
                    // Validar se a atividade realmente pertence a um grupo do usuário
                    if (!in_array($activity->group_id, $userGroups->toArray())) {
                        \Log::warning('Atividade ' . $activity->id . ' não pertence aos grupos do usuário. Group ID: ' . $activity->group_id);
                        return null;
                    }
                    
                    // Garantir que group_id esteja sempre presente
                    return [
                        'id' => $activity->id,
                        'group_id' => $activity->group_id,
                        'user_id' => $activity->user_id,
                        'action_type' => $activity->action_type,
                        'description' => $activity->description,
                        'metadata' => $activity->metadata,
                        'created_at' => $activity->created_at,
                        'updated_at' => $activity->updated_at,
                        'group' => $activity->group ? [
                            'id' => $activity->group->id,
                            'name' => $activity->group->name,
                        ] : null,
                    ];
                })
                ->filter(function($activity) {
                    return $activity !== null; // Remover atividades inválidas
                })
                ->values(); // Reindexar array
            
            \Log::info('Encontradas ' . $activities->count() . ' atividades válidas para o usuário ' . $user->id);
            
            // Log detalhado das atividades retornadas
            foreach ($activities as $activity) {
                \Log::info('Atividade retornada: ID=' . $activity['id'] . ', Tipo=' . $activity['action_type'] . ', Grupo=' . ($activity['group']['name'] ?? 'N/A') . ', Descrição=' . $activity['description']);
            }
            
            return response()->json($activities);
        } catch (\Exception $e) {
            \Log::error('Erro ao buscar atividades recentes: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Erro ao buscar atividades',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Listar atividades de um grupo específico
     * 
     * GET /api/groups/{groupId}/activities?limit=20
     */
    public function index(Request $request, $groupId)
    {
        try {
            $user = Auth::user();
            $limit = $request->query('limit', 20);
            
            // Verificar se usuário tem acesso ao grupo
            $group = $user->groups()->find($groupId);
            
            if (!$group) {
                return response()->json([
                    'message' => 'Grupo não encontrado ou você não tem acesso'
                ], 403);
            }
            
            // Buscar atividades do grupo
            $activities = GroupActivity::with(['group', 'user'])
                ->where('group_id', $groupId)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();
            
            return response()->json($activities);
        } catch (\Exception $e) {
            \Log::error('Erro ao buscar atividades do grupo: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erro ao buscar atividades',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

