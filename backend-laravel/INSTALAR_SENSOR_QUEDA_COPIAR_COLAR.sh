#!/bin/bash

# ============================================================================
# SCRIPT PARA INSTALAR SENSOR DE QUEDA - COPIAR E COLAR NO SERVIDOR
# Execute: bash <(cat << 'EOF'
# ...cole todo o conteúdo abaixo...
# EOF
# )
# ============================================================================

cd /var/www/lacos-backend || exit 1

echo "🚀 Instalando sistema de sensor de queda..."
echo ""

# Criar arquivos necessários
echo "📦 Criando arquivos..."

# 1. Migration
cat > create_fall_sensor_data_table.php << 'MIGRATION_EOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fall_sensor_data', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('group_id');
            $table->unsignedBigInteger('user_id');
            $table->string('sensor_mac', 17)->nullable();
            $table->enum('posture', [
                'standing',
                'sitting',
                'lying_ventral',
                'lying_dorsal',
                'lying_lateral_right',
                'lying_lateral_left',
                'fall'
            ])->default('standing');
            $table->string('posture_pt', 50)->nullable();
            $table->decimal('acceleration_x', 10, 6)->nullable();
            $table->decimal('acceleration_y', 10, 6)->nullable();
            $table->decimal('acceleration_z', 10, 6)->nullable();
            $table->decimal('gyro_x', 10, 6)->nullable();
            $table->decimal('gyro_y', 10, 6)->nullable();
            $table->decimal('gyro_z', 10, 6)->nullable();
            $table->decimal('magnitude', 10, 6)->nullable();
            $table->boolean('is_fall_detected')->default(false);
            $table->decimal('confidence', 5, 2)->nullable();
            $table->timestamp('sensor_timestamp')->nullable();
            $table->timestamps();

            $table->foreign('group_id')->references('id')->on('groups')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->index('group_id');
            $table->index('user_id');
            $table->index('posture');
            $table->index('is_fall_detected');
            $table->index('sensor_timestamp');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fall_sensor_data');
    }
};
MIGRATION_EOF

# 2. Model
mkdir -p app/Models
cat > app/Models/FallSensorData.php << 'MODEL_EOF'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FallSensorData extends Model
{
    use HasFactory;

    protected $table = 'fall_sensor_data';

    protected $fillable = [
        'group_id',
        'user_id',
        'sensor_mac',
        'posture',
        'posture_pt',
        'acceleration_x',
        'acceleration_y',
        'acceleration_z',
        'gyro_x',
        'gyro_y',
        'gyro_z',
        'magnitude',
        'is_fall_detected',
        'confidence',
        'sensor_timestamp',
    ];

    protected $casts = [
        'acceleration_x' => 'decimal:6',
        'acceleration_y' => 'decimal:6',
        'acceleration_z' => 'decimal:6',
        'gyro_x' => 'decimal:6',
        'gyro_y' => 'decimal:6',
        'gyro_z' => 'decimal:6',
        'magnitude' => 'decimal:6',
        'is_fall_detected' => 'boolean',
        'confidence' => 'decimal:2',
        'sensor_timestamp' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public static function getPostureNames()
    {
        return [
            'standing' => 'Em Pé',
            'sitting' => 'Sentado',
            'lying_ventral' => 'Deitado - Decúbito Ventral',
            'lying_dorsal' => 'Deitado - Decúbito Dorsal',
            'lying_lateral_right' => 'Deitado - Decúbito Lateral Direito',
            'lying_lateral_left' => 'Deitado - Decúbito Lateral Esquerdo',
            'fall' => 'Queda Detectada',
        ];
    }

    public function getPostureNameAttribute()
    {
        $names = self::getPostureNames();
        return $names[$this->posture] ?? $this->posture;
    }
}
MODEL_EOF

# 3. Controller
mkdir -p app/Http/Controllers/Api
cat > app/Http/Controllers/Api/FallSensorController.php << 'CONTROLLER_EOF'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FallSensorData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class FallSensorController extends Controller
{
    public function store(Request $request, $groupId)
    {
        try {
            $user = Auth::user();

            $validator = Validator::make($request->all(), [
                'sensor_mac' => 'nullable|string|max:17',
                'posture' => 'required|in:standing,sitting,lying_ventral,lying_dorsal,lying_lateral_right,lying_lateral_left,fall',
                'acceleration_x' => 'nullable|numeric',
                'acceleration_y' => 'nullable|numeric',
                'acceleration_z' => 'nullable|numeric',
                'gyro_x' => 'nullable|numeric',
                'gyro_y' => 'nullable|numeric',
                'gyro_z' => 'nullable|numeric',
                'magnitude' => 'nullable|numeric',
                'is_fall_detected' => 'nullable|boolean',
                'confidence' => 'nullable|numeric|min:0|max:100',
                'sensor_timestamp' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();
            
            $postureNames = FallSensorData::getPostureNames();
            $posturePt = $postureNames[$validated['posture']] ?? $validated['posture'];

            $sensorData = FallSensorData::create([
                'group_id' => $groupId,
                'user_id' => $user->id,
                'sensor_mac' => $validated['sensor_mac'] ?? null,
                'posture' => $validated['posture'],
                'posture_pt' => $posturePt,
                'acceleration_x' => $validated['acceleration_x'] ?? null,
                'acceleration_y' => $validated['acceleration_y'] ?? null,
                'acceleration_z' => $validated['acceleration_z'] ?? null,
                'gyro_x' => $validated['gyro_x'] ?? null,
                'gyro_y' => $validated['gyro_y'] ?? null,
                'gyro_z' => $validated['gyro_z'] ?? null,
                'magnitude' => $validated['magnitude'] ?? null,
                'is_fall_detected' => $validated['is_fall_detected'] ?? false,
                'confidence' => $validated['confidence'] ?? null,
                'sensor_timestamp' => $validated['sensor_timestamp'] ?? now(),
            ]);

            Log::info('FallSensorController::store - Dados salvos:', [
                'id' => $sensorData->id,
                'group_id' => $groupId,
                'user_id' => $user->id,
                'posture' => $validated['posture'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Dados do sensor salvos com sucesso',
                'data' => $sensorData
            ], 201);

        } catch (\Exception $e) {
            Log::error('FallSensorController::store - Erro:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao salvar dados do sensor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request, $groupId)
    {
        try {
            $user = Auth::user();
            
            $limit = $request->query('limit', 50);
            $offset = $request->query('offset', 0);
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $posture = $request->query('posture');
            $onlyFalls = $request->query('only_falls', false);

            $query = FallSensorData::where('group_id', $groupId)
                ->orderBy('created_at', 'desc');

            if ($startDate) {
                $query->where('created_at', '>=', $startDate);
            }

            if ($endDate) {
                $query->where('created_at', '<=', $endDate);
            }

            if ($posture) {
                $query->where('posture', $posture);
            }

            if ($onlyFalls) {
                $query->where('is_fall_detected', true);
            }

            $total = $query->count();
            $data = $query->skip($offset)->take($limit)->get();

            return response()->json([
                'success' => true,
                'data' => $data,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]);

        } catch (\Exception $e) {
            Log::error('FallSensorController::index - Erro:', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar histórico',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getLatest(Request $request, $groupId)
    {
        try {
            $latest = FallSensorData::where('group_id', $groupId)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$latest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nenhum dado encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $latest
            ]);

        } catch (\Exception $e) {
            Log::error('FallSensorController::getLatest - Erro:', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar última postura',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getFallAlerts(Request $request, $groupId)
    {
        try {
            $hours = $request->query('hours', 24);

            $alerts = FallSensorData::where('group_id', $groupId)
                ->where('is_fall_detected', true)
                ->where('created_at', '>=', now()->subHours($hours))
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $alerts,
                'count' => $alerts->count()
            ]);

        } catch (\Exception $e) {
            Log::error('FallSensorController::getFallAlerts - Erro:', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar alertas de queda',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
CONTROLLER_EOF

echo "✅ Arquivos criados"
echo ""

# Verificar sintaxe
echo "🔍 Verificando sintaxe PHP..."
php -l app/Models/FallSensorData.php > /dev/null 2>&1 && echo "✅ Model OK" || echo "❌ Erro no Model"
php -l app/Http/Controllers/Api/FallSensorController.php > /dev/null 2>&1 && echo "✅ Controller OK" || echo "❌ Erro no Controller"
php -l create_fall_sensor_data_table.php > /dev/null 2>&1 && echo "✅ Migration OK" || echo "❌ Erro na Migration"

echo ""
echo "🗄️  Executando migration..."

# Mover migration para database/migrations
mkdir -p database/migrations
TIMESTAMP=$(date +%Y_%m_%d_%H%M%S)
MIGRATION_FILE="database/migrations/${TIMESTAMP}_create_fall_sensor_data_table.php"
cp create_fall_sensor_data_table.php "$MIGRATION_FILE"

# Tentar executar migration
php artisan migrate --path="$MIGRATION_FILE" --force 2>&1 | tee /tmp/migration_output.log

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo ""
    echo "⚠️  Erro ao executar migration. Tentando com sudo -u www-data..."
    sudo -u www-data php artisan migrate --path="$MIGRATION_FILE" --force 2>&1
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Migration falhou. Criando tabela via SQL direto..."
        echo ""
        echo "Execute manualmente no MySQL:"
        echo "sudo mysql -u root laravel"
        echo ""
        echo "Depois execute:"
        echo "CREATE TABLE IF NOT EXISTS fall_sensor_data ("
        echo "    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,"
        echo "    group_id BIGINT UNSIGNED NOT NULL,"
        echo "    user_id BIGINT UNSIGNED NOT NULL,"
        echo "    sensor_mac VARCHAR(17) NULL,"
        echo "    posture ENUM('standing','sitting','lying_ventral','lying_dorsal','lying_lateral_right','lying_lateral_left','fall') DEFAULT 'standing',"
        echo "    posture_pt VARCHAR(50) NULL,"
        echo "    acceleration_x DECIMAL(10,6) NULL,"
        echo "    acceleration_y DECIMAL(10,6) NULL,"
        echo "    acceleration_z DECIMAL(10,6) NULL,"
        echo "    gyro_x DECIMAL(10,6) NULL,"
        echo "    gyro_y DECIMAL(10,6) NULL,"
        echo "    gyro_z DECIMAL(10,6) NULL,"
        echo "    magnitude DECIMAL(10,6) NULL,"
        echo "    is_fall_detected BOOLEAN DEFAULT FALSE,"
        echo "    confidence DECIMAL(5,2) NULL,"
        echo "    sensor_timestamp TIMESTAMP NULL,"
        echo "    created_at TIMESTAMP NULL,"
        echo "    updated_at TIMESTAMP NULL,"
        echo "    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,"
        echo "    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,"
        echo "    INDEX idx_group_id (group_id),"
        echo "    INDEX idx_user_id (user_id),"
        echo "    INDEX idx_posture (posture),"
        echo "    INDEX idx_is_fall_detected (is_fall_detected),"
        echo "    INDEX idx_sensor_timestamp (sensor_timestamp),"
        echo "    INDEX idx_created_at (created_at)"
        echo ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
        echo ""
    else
        echo "✅ Migration executada com sucesso!"
    fi
else
    echo "✅ Migration executada com sucesso!"
fi

echo ""
echo "🔍 Verificando tabela..."
php artisan tinker --execute="
try {
    \$count = DB::table('fall_sensor_data')->count();
    echo '✅ Tabela fall_sensor_data criada! (Registros: ' . \$count . ')';
} catch (\Exception \$e) {
    echo '❌ Erro: ' . \$e->getMessage();
}
" 2>&1

echo ""
echo "📋 Verificando rotas..."

ROUTES_FILE=""
if [ -f "routes/api.php" ]; then
    ROUTES_FILE="routes/api.php"
elif [ -f "routes_api_corrigido.php" ]; then
    ROUTES_FILE="routes_api_corrigido.php"
fi

if [ -n "$ROUTES_FILE" ]; then
    if grep -q "FallSensorController" "$ROUTES_FILE"; then
        echo "✅ Rotas já adicionadas em: $ROUTES_FILE"
    else
        echo "⚠️  Adicione as rotas manualmente em: $ROUTES_FILE"
        echo ""
        echo "No topo (com os outros use):"
        echo "use App\\Http\\Controllers\\Api\\FallSensorController;"
        echo ""
        echo "Dentro do grupo auth:sanctum:"
        echo "Route::post('/groups/{groupId}/fall-sensor/data', [FallSensorController::class, 'store']);"
        echo "Route::get('/groups/{groupId}/fall-sensor/history', [FallSensorController::class, 'index']);"
        echo "Route::get('/groups/{groupId}/fall-sensor/latest', [FallSensorController::class, 'getLatest']);"
        echo "Route::get('/groups/{groupId}/fall-sensor/alerts', [FallSensorController::class, 'getFallAlerts']);"
    fi
fi

echo ""
echo "✅ Instalação concluída!"
echo ""

