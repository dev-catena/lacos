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

            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar usuários',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bloquear usuário
     * POST /api/admin/users/{id}/block
     */
    public function block($id)
    {
        try {
            $user = User::findOrFail($id);

            $user->is_blocked = true;
            $user->save();

            // Revogar todos os tokens do usuário
            $user->tokens()->delete();

            return response()->json([
                'message' => 'Usuário bloqueado com sucesso',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_blocked' => true,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao bloquear usuário',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Desbloquear usuário
     * POST /api/admin/users/{id}/unblock
     */
    public function unblock($id)
    {
        try {
            $user = User::findOrFail($id);

            $user->is_blocked = false;
            $user->save();

            return response()->json([
                'message' => 'Usuário desbloqueado com sucesso',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_blocked' => false,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao desbloquear usuário',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obter plano do usuário
     * GET /api/admin/users/{id}/plan
     */
    public function getUserPlan($id)
    {
        try {
            $userPlan = DB::table('user_plans')
                ->where('user_id', $id)
                ->where('is_active', true)
                ->first();

            if (!$userPlan) {
                return response()->json([
                    'plan' => null,
                    'message' => 'Usuário não possui plano ativo'
                ]);
            }

            $plan = DB::table('plans')
                ->where('id', $userPlan->plan_id)
                ->first();

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
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar plano do usuário',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Excluir usuário
     * DELETE /api/admin/users/{id}
     */
    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);

            // Verificar se é o próprio usuário logado (não permitir auto-exclusão)
            $currentUser = auth()->user();
            if ($currentUser && $currentUser->id == $id) {
                return response()->json([
                    'error' => 'Você não pode excluir sua própria conta',
                    'message' => 'Use a opção de deletar conta no seu perfil'
                ], 403);
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

            return response()->json([
                'message' => 'Usuário excluído com sucesso',
                'deleted_user' => [
                    'id' => $id,
                    'name' => $userName,
                    'email' => $userEmail,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Usuário não encontrado',
                'message' => 'O usuário com o ID informado não existe'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao excluir usuário',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

