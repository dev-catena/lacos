<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PlanController extends Controller
{
    /**
     * Listar todos os planos
     * GET /api/plans
     */
    public function index()
    {
        try {
            $plans = Plan::orderBy('is_default', 'desc')
                         ->orderBy('name')
                         ->get();

            return response()->json($plans);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar planos',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obter um plano específico
     * GET /api/plans/{id}
     */
    public function show($id)
    {
        try {
            $plan = Plan::findOrFail($id);
            return response()->json($plan);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Plano não encontrado',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Criar novo plano
     * POST /api/plans
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'slug' => 'required|string|max:255|unique:plans,slug',
                'is_default' => 'boolean',
                'features' => 'required|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Se este plano for marcado como padrão, desmarcar os outros
            if ($request->is_default) {
                Plan::where('is_default', true)->update(['is_default' => false]);
            }

            $plan = Plan::create([
                'name' => $request->name,
                'slug' => $request->slug,
                'is_default' => $request->is_default ?? false,
                'features' => $request->features,
            ]);

            return response()->json($plan, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao criar plano',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Atualizar plano
     * PUT /api/plans/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $plan = Plan::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'slug' => 'sometimes|string|max:255|unique:plans,slug,' . $id,
                'is_default' => 'boolean',
                'features' => 'sometimes|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Se este plano for marcado como padrão, desmarcar os outros
            if ($request->has('is_default') && $request->is_default) {
                Plan::where('is_default', true)
                    ->where('id', '!=', $id)
                    ->update(['is_default' => false]);
            }

            $plan->update($request->only(['name', 'slug', 'is_default', 'features']));

            return response()->json($plan);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao atualizar plano',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deletar plano
     * DELETE /api/plans/{id}
     */
    public function destroy($id)
    {
        try {
            $plan = Plan::findOrFail($id);

            // Não permitir deletar o plano padrão
            if ($plan->is_default) {
                return response()->json([
                    'error' => 'Não é possível deletar o plano padrão'
                ], 422);
            }

            // Verificar se há usuários usando este plano
            $usersCount = DB::table('user_plans')
                ->where('plan_id', $id)
                ->where('is_active', true)
                ->count();

            if ($usersCount > 0) {
                return response()->json([
                    'error' => 'Não é possível deletar um plano que está sendo usado por usuários',
                    'users_count' => $usersCount
                ], 422);
            }

            $plan->delete();

            return response()->json([
                'message' => 'Plano deletado com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao deletar plano',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obter plano do usuário autenticado
     * GET /api/user/plan
     */
    public function getUserPlan(Request $request)
    {
        try {
            $user = $request->user();

            $userPlan = DB::table('user_plans')
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->first();

            if (!$userPlan) {
                // Se não tem plano, atribuir o plano padrão
                $defaultPlan = Plan::where('is_default', true)->first();
                if ($defaultPlan) {
                    DB::table('user_plans')->insert([
                        'user_id' => $user->id,
                        'plan_id' => $defaultPlan->id,
                        'is_active' => true,
                        'started_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $userPlan = (object) [
                        'user_id' => $user->id,
                        'plan_id' => $defaultPlan->id,
                        'is_active' => true,
                    ];
                } else {
                    return response()->json([
                        'error' => 'Nenhum plano padrão encontrado'
                    ], 404);
                }
            }

            $plan = Plan::find($userPlan->plan_id);

            // Garantir que features seja um array (não string JSON)
            if ($plan && $plan->features) {
                // Se features já é array (via cast), manter; se for string, fazer decode
                if (is_string($plan->features)) {
                    $plan->features = json_decode($plan->features, true);
                }
            }

            \Log::info('PlanController::getUserPlan', [
                'user_id' => $user->id,
                'plan_id' => $plan->id ?? null,
                'plan_name' => $plan->name ?? null,
                'features' => $plan->features ?? null,
                'buscarCuidadores' => $plan->features['buscarCuidadores'] ?? null,
                'sensorQuedas' => $plan->features['sensorQuedas'] ?? null,
            ]);

            return response()->json([
                'plan' => $plan,
                'user_plan' => $userPlan,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar plano do usuário',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

