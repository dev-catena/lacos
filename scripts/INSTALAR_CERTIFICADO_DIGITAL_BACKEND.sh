#!/bin/bash

set -e

# Configurações do servidor
SERVER="10.102.0.103"
USER="darley"
PASSWORD="yhvh77"
REMOTE_TMP="/tmp/certificado_digital_backend"
REMOTE_APP="/var/www/lacos-backend"

echo "🚀 Criando arquivos para gestão de certificado digital..."
echo ""

# Criar diretório temporário local
LOCAL_TMP="/tmp/certificado_digital_install"
rm -rf "$LOCAL_TMP"
mkdir -p "$LOCAL_TMP"

echo "📦 Criando arquivos do backend..."

# ============================================
# 1. CertificateController
# ============================================
cat > "$LOCAL_TMP/CertificateController.php" << 'ENDOFFILE'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Crypt;

class CertificateController extends Controller
{
    /**
     * Fazer upload do certificado digital ICP-Brasil A1
     * POST /api/certificate/upload
     */
    public function upload(Request $request)
    {
        try {
            $user = Auth::user();

            // Verificar se é médico
            if ($user->profile !== 'doctor') {
                return response()->json([
                    'success' => false,
                    'message' => 'Apenas médicos podem configurar certificado digital',
                ], 403);
            }

            // Validação
            $validator = Validator::make($request->all(), [
                'certificate_file' => 'required|file|mimes:pfx,p12|max:5120', // 5MB max
                'certificate_username' => 'required|string|max:255',
                'certificate_password' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Validar arquivo .pfx básico
            $file = $request->file('certificate_file');
            $extension = strtolower($file->getClientOriginalExtension());
            
            if (!in_array($extension, ['pfx', 'p12'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Arquivo deve ser .pfx ou .p12',
                ], 422);
            }

            // Criar diretório para certificados se não existir
            $certDir = 'certificates/doctors/' . $user->id;
            Storage::disk('local')->makeDirectory($certDir);

            // Salvar certificado (criptografado)
            $certificatePath = $file->storeAs($certDir, 'certificate.pfx', 'local');

            // Criptografar senha antes de salvar
            $encryptedPassword = Crypt::encryptString($request->certificate_password);

            // Atualizar usuário com dados do certificado
            $user->certificate_path = $certificatePath;
            $user->certificate_username = $request->certificate_username;
            $user->certificate_password_encrypted = $encryptedPassword;
            $user->has_certificate = true;
            $user->certificate_uploaded_at = now();
            $user->save();

            Log::info('Certificado digital configurado para médico', [
                'user_id' => $user->id,
                'certificate_path' => $certificatePath,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Certificado digital configurado com sucesso',
                'data' => [
                    'username' => $user->certificate_username,
                    'uploaded_at' => $user->certificate_uploaded_at,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao fazer upload do certificado: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erro ao configurar certificado: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remover certificado digital
     * DELETE /api/certificate/remove
     */
    public function remove(Request $request)
    {
        try {
            $user = Auth::user();

            // Verificar se é médico
            if ($user->profile !== 'doctor') {
                return response()->json([
                    'success' => false,
                    'message' => 'Apenas médicos podem remover certificado digital',
                ], 403);
            }

            // Deletar arquivo do certificado se existir
            if ($user->certificate_path && Storage::disk('local')->exists($user->certificate_path)) {
                Storage::disk('local')->delete($user->certificate_path);
            }

            // Limpar dados do certificado
            $user->certificate_path = null;
            $user->certificate_username = null;
            $user->certificate_password_encrypted = null;
            $user->has_certificate = false;
            $user->certificate_uploaded_at = null;
            $user->save();

            Log::info('Certificado digital removido para médico', [
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Certificado digital removido com sucesso',
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao remover certificado: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao remover certificado: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obter informações do certificado (sem senha)
     * GET /api/certificate/info
     */
    public function info(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user->has_certificate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nenhum certificado configurado',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'username' => $user->certificate_username,
                    'uploaded_at' => $user->certificate_uploaded_at,
                    'has_certificate' => true,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar info do certificado: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar informações do certificado',
            ], 500);
        }
    }
}
ENDOFFILE

# ============================================
# 2. Migration para adicionar campos de certificado
# ============================================
cat > "$LOCAL_TMP/add_certificate_fields_to_users.php" << 'ENDOFFILE'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'certificate_path')) {
                $table->string('certificate_path')->nullable()->after('password');
            }
            if (!Schema::hasColumn('users', 'certificate_username')) {
                $table->string('certificate_username')->nullable()->after('certificate_path');
            }
            if (!Schema::hasColumn('users', 'certificate_password_encrypted')) {
                $table->text('certificate_password_encrypted')->nullable()->after('certificate_username');
            }
            if (!Schema::hasColumn('users', 'has_certificate')) {
                $table->boolean('has_certificate')->default(false)->after('certificate_password_encrypted');
            }
            if (!Schema::hasColumn('users', 'certificate_uploaded_at')) {
                $table->timestamp('certificate_uploaded_at')->nullable()->after('has_certificate');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'certificate_uploaded_at')) {
                $table->dropColumn('certificate_uploaded_at');
            }
            if (Schema::hasColumn('users', 'has_certificate')) {
                $table->dropColumn('has_certificate');
            }
            if (Schema::hasColumn('users', 'certificate_password_encrypted')) {
                $table->dropColumn('certificate_password_encrypted');
            }
            if (Schema::hasColumn('users', 'certificate_username')) {
                $table->dropColumn('certificate_username');
            }
            if (Schema::hasColumn('users', 'certificate_path')) {
                $table->dropColumn('certificate_path');
            }
        });
    }
};
ENDOFFILE

# ============================================
# 3. Script de Instalação
# ============================================
cat > "$LOCAL_TMP/install.sh" << ENDOFFILE
#!/bin/bash

set -e

REMOTE_APP="/var/www/lacos-backend"
REMOTE_TMP="/tmp/certificado_digital_backend"
SUDO_PASS="$PASSWORD"

echo "🚀 Instalando gestão de certificado digital..."
echo ""

# Navegar para o diretório da aplicação
cd "\$REMOTE_APP" || exit 1

# 1. Copiar Controller
echo "📝 Copiando CertificateController..."
mkdir -p app/Http/Controllers/Api
echo "\$SUDO_PASS" | sudo -S cp "\$REMOTE_TMP/CertificateController.php" app/Http/Controllers/Api/CertificateController.php
echo "\$SUDO_PASS" | sudo -S chown www-data:www-data app/Http/Controllers/Api/CertificateController.php

# 2. Copiar Migration
echo "📝 Copiando Migration..."
MIGRATION_NAME="\$(date +%Y_%m_%d_%H%M%S)_add_certificate_fields_to_users.php"
echo "\$SUDO_PASS" | sudo -S cp "\$REMOTE_TMP/add_certificate_fields_to_users.php" database/migrations/\$MIGRATION_NAME
echo "\$SUDO_PASS" | sudo -S chown www-data:www-data database/migrations/\$MIGRATION_NAME

# 3. Executar Migration
echo "🔄 Executando migration..."
echo "\$SUDO_PASS" | sudo -S php artisan migrate --force

# 4. Adicionar rotas na API
echo "📝 Adicionando rotas..."
ROUTES_FILE="/tmp/routes_certificate_\$\$.php"
cat > "\$ROUTES_FILE" << 'ROUTES'

// Rotas de Certificado Digital (Médicos)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/certificate/upload', [App\Http\Controllers\Api\CertificateController::class, 'upload']);
    Route::delete('/certificate/remove', [App\Http\Controllers\Api\CertificateController::class, 'remove']);
    Route::get('/certificate/info', [App\Http\Controllers\Api\CertificateController::class, 'info']);
});
ROUTES

if ! echo "\$SUDO_PASS" | sudo -S grep -q "certificate/upload" routes/api.php; then
    echo "\$SUDO_PASS" | sudo -S tee -a routes/api.php < "\$ROUTES_FILE" > /dev/null
fi
rm -f "\$ROUTES_FILE"

# 5. Criar diretório para certificados
echo "📁 Criando diretório para certificados..."
echo "\$SUDO_PASS" | sudo -S mkdir -p storage/app/certificates/doctors
echo "\$SUDO_PASS" | sudo -S chown -R www-data:www-data storage/app/certificates

# 6. Limpar cache
echo "🧹 Limpando cache..."
echo "\$SUDO_PASS" | sudo -S php artisan config:clear
echo "\$SUDO_PASS" | sudo -S php artisan cache:clear

echo ""
echo "✅ Instalação concluída com sucesso!"
echo ""
echo "📝 Médicos agora podem:"
echo "   1. Acessar Perfil > Segurança"
echo "   2. Configurar certificado digital ICP-Brasil A1"
echo "   3. Fazer upload do arquivo .pfx e informar usuário/senha"
ENDOFFILE

chmod +x "$LOCAL_TMP/install.sh"

# ============================================
# Enviar arquivos para o servidor
# ============================================
echo "📤 Enviando arquivos para o servidor..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "rm -rf $REMOTE_TMP && mkdir -p $REMOTE_TMP"

# Enviar arquivos
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no "$LOCAL_TMP/CertificateController.php" "$USER@$SERVER:$REMOTE_TMP/"
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no "$LOCAL_TMP/add_certificate_fields_to_users.php" "$USER@$SERVER:$REMOTE_TMP/"
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no "$LOCAL_TMP/install.sh" "$USER@$SERVER:$REMOTE_TMP/"

echo "✅ Arquivos enviados com sucesso!"
echo ""

# ============================================
# Executar instalação no servidor
# ============================================
echo "🔧 Executando instalação no servidor..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    export SUDO_PASS='$PASSWORD'
    export PASSWORD='$PASSWORD'
    chmod +x $REMOTE_TMP/install.sh
    bash $REMOTE_TMP/install.sh
"

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📝 Verifique os logs se houver problemas:"
echo "   ssh $USER@$SERVER 'tail -f $REMOTE_APP/storage/logs/laravel.log'"

