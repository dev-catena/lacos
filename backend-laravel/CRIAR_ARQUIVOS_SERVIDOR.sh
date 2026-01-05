#!/bin/bash

# Script para criar os arquivos diretamente no servidor
# Execute este script NO SERVIDOR (não localmente)

echo "📝 Criando arquivos de planos no servidor..."

cd /var/www/lacos-backend

# Criar migration de planos
cat > create_plans_table.php << 'MIGRATION_EOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->boolean('is_default')->default(false);
            $table->json('features')->nullable();
            $table->timestamps();
        });

        DB::table('plans')->insert([
            ['name' => 'Básico', 'slug' => 'basico', 'is_default' => true, 'features' => json_encode(['grupoCuidados' => false, 'historico' => false, 'remedios' => false, 'agenda' => false, 'medicos' => false, 'arquivos' => false, 'midias' => false, 'sinaisVitais' => false, 'configuracoes' => false, 'smartwatch' => false, 'sensorQuedas' => false, 'cameras' => false]), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Intermediário', 'slug' => 'intermediario', 'is_default' => false, 'features' => json_encode(['grupoCuidados' => false, 'historico' => false, 'remedios' => false, 'agenda' => false, 'medicos' => false, 'arquivos' => false, 'midias' => false, 'sinaisVitais' => false, 'configuracoes' => false, 'smartwatch' => false, 'sensorQuedas' => false, 'cameras' => false]), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Avançado', 'slug' => 'avancado', 'is_default' => false, 'features' => json_encode(['grupoCuidados' => false, 'historico' => false, 'remedios' => false, 'agenda' => false, 'medicos' => false, 'arquivos' => false, 'midias' => false, 'sinaisVitais' => false, 'configuracoes' => false, 'smartwatch' => false, 'sensorQuedas' => false, 'cameras' => false]), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Pleno', 'slug' => 'pleno', 'is_default' => false, 'features' => json_encode(['grupoCuidados' => false, 'historico' => false, 'remedios' => false, 'agenda' => false, 'medicos' => false, 'arquivos' => false, 'midias' => false, 'sinaisVitais' => false, 'configuracoes' => false, 'smartwatch' => false, 'sensorQuedas' => false, 'cameras' => false]), 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
MIGRATION_EOF

echo "✅ create_plans_table.php criado"

# Criar migration de user_plans
cat > create_user_plans_table.php << 'USER_PLANS_EOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_id')->constrained()->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'is_active']);
        });

        $defaultPlan = DB::table('plans')->where('is_default', true)->first();
        if ($defaultPlan) {
            $users = DB::table('users')->get();
            foreach ($users as $user) {
                DB::table('user_plans')->insert([
                    'user_id' => $user->id,
                    'plan_id' => $defaultPlan->id,
                    'is_active' => true,
                    'started_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_plans');
    }
};
USER_PLANS_EOF

echo "✅ create_user_plans_table.php criado"

# Criar Model Plan
mkdir -p app/Models
cat > app/Models/Plan.php << 'MODEL_EOF'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'is_default',
        'features',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'features' => 'array',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_plans')
                    ->withPivot('is_active', 'started_at', 'expires_at')
                    ->withTimestamps();
    }

    public function activeUsers()
    {
        return $this->belongsToMany(User::class, 'user_plans')
                    ->wherePivot('is_active', true)
                    ->withPivot('started_at', 'expires_at')
                    ->withTimestamps();
    }
}
MODEL_EOF

echo "✅ app/Models/Plan.php criado"

# Criar Controller
mkdir -p app/Http/Controllers/Api
cat > app/Http/Controllers/Api/PlanController.php << 'CONTROLLER_EOF'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PlanController extends Controller
{
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

    public function destroy($id)
    {
        try {
            $plan = Plan::findOrFail($id);

            if ($plan->is_default) {
                return response()->json([
                    'error' => 'Não é possível deletar o plano padrão'
                ], 422);
            }

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

    public function getUserPlan(Request $request)
    {
        try {
            $user = $request->user();

            $userPlan = DB::table('user_plans')
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->first();

            if (!$userPlan) {
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
CONTROLLER_EOF

echo "✅ app/Http/Controllers/Api/PlanController.php criado"

# Ajustar permissões
chown -R www-data:www-data create_plans_table.php create_user_plans_table.php app/Models/Plan.php app/Http/Controllers/Api/PlanController.php

echo ""
echo "✅ Todos os arquivos criados e permissões ajustadas!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Executar migrations:"
echo "      php artisan migrate --path=create_plans_table.php"
echo "      php artisan migrate --path=create_user_plans_table.php"
echo ""
echo "   2. Adicionar rotas no arquivo de rotas da API"

