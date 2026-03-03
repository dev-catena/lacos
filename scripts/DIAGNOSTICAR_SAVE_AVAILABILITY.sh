#!/bin/bash

# Script para diagnosticar problema com saveAvailability

set -e

SERVER="darley@192.168.0.20"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Diagnosticando problema com saveAvailability"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Solicitar senha
read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""
export SUDO_PASS

echo "1️⃣ Verificando se método saveAvailability existe no DoctorController..."
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S grep -n 'public function saveAvailability' $BACKEND_PATH/app/Http/Controllers/Api/DoctorController.php" || {
    echo "❌ Método saveAvailability NÃO encontrado no DoctorController"
    echo "💡 Execute: ./ENVIAR_E_INSTALAR_AVAILABILITY.sh"
    exit 1
}
echo "✅ Método encontrado"
echo ""

echo "2️⃣ Verificando se rota POST existe em routes/api.php..."
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S grep -n 'Route::post.*doctors.*availability' $BACKEND_PATH/routes/api.php" || {
    echo "❌ Rota POST NÃO encontrada"
    echo "💡 Adicione manualmente em routes/api.php:"
    echo "   Route::post('doctors/{doctorId}/availability', [DoctorController::class, 'saveAvailability']);"
    exit 1
}
echo "✅ Rota POST encontrada"
echo ""

echo "3️⃣ Verificando se tabelas do banco existem..."
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S mysql -u root -p$(echo '$SUDO_PASS' | sudo -S grep DB_PASSWORD $BACKEND_PATH/.env | cut -d '=' -f2) -e 'USE lacos; SHOW TABLES LIKE \"doctor_availability%\";' 2>/dev/null || echo 'Erro ao conectar ao banco'"
echo ""

echo "4️⃣ Verificando logs recentes do Laravel..."
echo "Últimas 20 linhas do log:"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -20 $BACKEND_PATH/storage/logs/laravel.log 2>/dev/null | grep -i 'availability\|doctor\|error' || echo 'Nenhum log relacionado encontrado'"
echo ""

echo "5️⃣ Testando endpoint diretamente..."
echo "💡 Para testar, execute no servidor:"
echo "   curl -X POST http://localhost/api/doctors/1/availability \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer SEU_TOKEN' \\"
echo "     -d '{\"availableDays\":[\"2024-12-28\"],\"daySchedules\":{\"2024-12-28\":[\"08:00\",\"09:00\"]}}'"
echo ""

echo "6️⃣ Verificando permissões dos arquivos..."
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S ls -la $BACKEND_PATH/app/Http/Controllers/Api/DoctorController.php | head -1"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "✅ Diagnóstico concluído"
echo ""
echo "💡 Se o método e a rota existem, verifique:"
echo "   1. Se o token de autenticação está sendo enviado"
echo "   2. Se há erros nos logs do Laravel"
echo "   3. Se as tabelas do banco existem"
echo "   4. Se há permissões corretas no banco de dados"
echo ""





