# 🚀 Passo a Passo - Instalação no Servidor

## Execute estes comandos no servidor (um por vez):

### 1. Navegar até o diretório do Laravel
```bash
cd /var/www/lacos-backend
```

### 2. Verificar estrutura
```bash
ls -la app/Http/Controllers/Api/ | head -5
ls -la *.php 2>/dev/null | head -3
```

### 3. Criar arquivo de migration de planos
```bash
cat > create_plans_table.php << 'EOF'
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
EOF
```

### 4. Criar arquivo de migration de user_plans
```bash
cat > create_user_plans_table.php << 'EOF'
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
EOF
```

### 5. Executar migrations
```bash
php artisan migrate --path=create_plans_table.php
php artisan migrate --path=create_user_plans_table.php
```

### 6. Verificar se funcionou
```bash
php artisan tinker --execute="echo 'Planos: ' . App\Models\Plan::count();"
```

---

## ⚠️ IMPORTANTE: Você também precisa:

1. **Copiar o Model Plan.php** para `app/Models/Plan.php` (ou raiz se não usar Models)
2. **Copiar o PlanController.php** para `app/Http/Controllers/Api/PlanController.php`
3. **Adicionar as rotas** no arquivo de rotas da API

**A forma mais fácil é usar SCP da sua máquina local:**

```bash
# Na sua máquina local (não no servidor):
cd ~/lacos/backend-laravel
scp Plan.php darley@193.203.182.22:/var/www/lacos-backend/app/Models/
scp PlanController.php darley@193.203.182.22:/var/www/lacos-backend/app/Http/Controllers/Api/
```

Depois, edite o arquivo de rotas e adicione as rotas de planos.

