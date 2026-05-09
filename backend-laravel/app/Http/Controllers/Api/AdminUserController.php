<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
     * Trocar senha do usuário (admin)
     * PUT /api/admin/users/{id}/password
     */
    public function changePassword(Request $request, $id)
    {
        try {
            $request->validate([
                'password' => 'required|string|min:6|confirmed',
            ], [
                'password.required' => 'A senha é obrigatória.',
                'password.min' => 'A senha deve ter no mínimo 6 caracteres.',
                'password.confirmed' => 'A confirmação da senha não confere.',
            ]);

            $user = User::findOrFail($id);
            $user->password = Hash::make($request->password);
            $user->save();

            return response()->json([
                'message' => 'Senha alterada com sucesso',
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Usuário não encontrado',
                'message' => 'O usuário com o ID informado não existe'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao alterar senha',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Grupos que cuidam de um usuário Acompanhado/Paciente e membros de cada grupo (web-admin).
     * GET /api/admin/users/{id}/accompanied-care
     */
    public function accompaniedCareContext($id)
    {
        try {
            $subject = User::findOrFail($id);
            $profile = strtolower((string) ($subject->profile ?? ''));
            if (! in_array($profile, ['accompanied', 'patient'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Este perfil não é Acompanhado/Paciente.',
                ], 422);
            }

            $accompaniedRoles = GroupMember::accompaniedPersonRoles();
            $groupIds = GroupMember::query()
                ->where('user_id', $subject->id)
                ->where('is_active', true)
                ->whereIn('role', $accompaniedRoles)
                ->pluck('group_id')
                ->unique()
                ->filter()
                ->values();

            if ($groupIds->isEmpty()) {
                $groupIds = GroupMember::query()
                    ->where('user_id', $subject->id)
                    ->where('is_active', true)
                    ->pluck('group_id')
                    ->unique()
                    ->filter()
                    ->values();
            }

            $groups = [];
            foreach ($groupIds as $gid) {
                $group = Group::with('creator')->find($gid);
                if (! $group) {
                    continue;
                }

                $membersRows = GroupMember::query()
                    ->where('group_id', $gid)
                    ->where('is_active', true)
                    ->with(['user:id,name,email,profile'])
                    ->orderBy('role')
                    ->orderBy('id')
                    ->get();

                $members = $membersRows->map(function (GroupMember $m) {
                    return [
                        'member_id' => $m->id,
                        'user_id' => $m->user_id,
                        'name' => $m->user ? $m->user->name : null,
                        'email' => $m->user ? $m->user->email : null,
                        'profile' => $m->user ? $m->user->profile : null,
                        'role' => $m->role,
                        'role_label' => $this->mapGroupMemberRoleLabel($m->role),
                    ];
                })->values()->all();

                $groups[] = [
                    'id' => $group->id,
                    'name' => $group->name,
                    'code' => $group->code ?? null,
                    'accompanied_name' => $group->accompanied_name ?? null,
                    'admin_name' => $group->creator ? $group->creator->name : null,
                    'admin_email' => $group->creator ? $group->creator->email : null,
                    'members' => $members,
                ];
            }

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'email' => $subject->email,
                    'profile' => $subject->profile,
                ],
                'groups' => $groups,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Usuário não encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar grupos do acompanhado',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function mapGroupMemberRoleLabel(?string $role): string
    {
        return match (strtolower((string) $role)) {
            'admin' => 'Administrador',
            'caregiver' => 'Cuidador/Amigo',
            'patient' => 'Paciente',
            'accompanied' => 'Acompanhado',
            'priority_contact' => 'Contato prioritário',
            'doctor' => 'Médico',
            'professional_caregiver' => 'Cuidador profissional',
            default => $role ? (string) $role : 'Membro',
        };
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

