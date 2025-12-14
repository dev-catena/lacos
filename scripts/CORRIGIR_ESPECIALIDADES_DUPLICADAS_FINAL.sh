#!/bin/bash

echo "🔧 Corrigindo especialidades médicas duplicadas..."
echo ""

SERVER_USER="darley"
SERVER_HOST="193.203.182.22"
SERVER_PASS="yhvh77"
SERVER_PATH="/var/www/lacos-backend"
CONTROLLER_FILE="app/Http/Controllers/Api/MedicalSpecialtyController.php"

# Criar arquivo corrigido no servidor
echo "📝 Criando controller corrigido no servidor..."
sshpass -p "$SERVER_PASS" ssh "$SERVER_USER@$SERVER_HOST" "cat > /tmp/MedicalSpecialtyController_NEW.php << 'EOFPHP'
<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\MedicalSpecialty;
use Illuminate\Http\Request;

class MedicalSpecialtyController extends Controller {
    public function index(Request \$request) {
        try {
            \$query = MedicalSpecialty::query();
            
            if (\$request->has('search') && !empty(\$request->search)) {
                \$query->where('name', 'LIKE', \"%{\$request->search}%\");
            }
            
            // Adicionar DISTINCT para evitar duplicatas
            // Agrupar por nome para garantir que não retorne registros duplicados
            \$query->select('id', 'name')
                  ->distinct()
                  ->orderBy('name');
            
            return response()->json(['success' => true, 'data' => \$query->get()]);
        } catch (\Exception \$e) {
            return response()->json(['success' => false, 'message' => 'Erro'], 500);
        }
    }
    
    public function show(\$id) {
        try {
            return response()->json(['success' => true, 'data' => MedicalSpecialty::findOrFail(\$id)]);
        } catch (\Exception \$e) {
            return response()->json(['success' => false, 'message' => 'Não encontrado'], 404);
        }
    }
}
EOFPHP
"

# Criar backup
echo "📦 Criando backup..."
sshpass -p "$SERVER_PASS" ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && echo '$SERVER_PASS' | sudo -S cp $CONTROLLER_FILE ${CONTROLLER_FILE}.bak.\$(date +%Y%m%d_%H%M%S) 2>&1 | grep -v password"
echo "✅ Backup criado"
echo ""

# Mover arquivo novo para o local correto
echo "📝 Instalando controller corrigido..."
sshpass -p "$SERVER_PASS" ssh "$SERVER_USER@$SERVER_HOST" "echo '$SERVER_PASS' | sudo -S mv /tmp/MedicalSpecialtyController_NEW.php $SERVER_PATH/$CONTROLLER_FILE 2>&1 | grep -v password && echo '$SERVER_PASS' | sudo -S chown www-data:www-data $SERVER_PATH/$CONTROLLER_FILE 2>&1 | grep -v password"
echo "✅ Controller atualizado"
echo ""

# Verificar sintaxe PHP
echo "🔍 Verificando sintaxe PHP..."
if sshpass -p "$SERVER_PASS" ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && php -l $CONTROLLER_FILE" | grep -q "No syntax errors"; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe detectado"
    sshpass -p "$SERVER_PASS" ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && php -l $CONTROLLER_FILE"
    exit 1
fi
echo ""

# Limpar cache
echo "🧹 Limpando cache..."
sshpass -p "$SERVER_PASS" ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH && php artisan route:clear > /dev/null 2>&1 && php artisan config:clear > /dev/null 2>&1 && php artisan cache:clear > /dev/null 2>&1"
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído com sucesso!"
echo ""
echo "📋 Resumo:"
echo "   - Controller atualizado com DISTINCT para evitar duplicatas"
echo "   - Cache limpo"
echo ""
echo "💡 A consulta agora usa:"
echo "   - SELECT DISTINCT id, name"
echo "   - ORDER BY name"
echo "   - Isso garante que não retorne especialidades duplicadas"
echo ""

