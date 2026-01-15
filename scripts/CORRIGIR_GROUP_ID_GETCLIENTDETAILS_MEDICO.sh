#!/bin/bash

echo "🔧 Corrigindo getClientDetails para retornar group_id para médicos..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Verificar se o método existe
if ! grep -q "public function getClientDetails" "$CONTROLLER_FILE"; then
    echo "❌ Método getClientDetails não encontrado!"
    exit 1
fi

# Encontrar a linha onde está o $patientData para médicos
PATIENT_DATA_LINE=$(grep -n "\$patientData = \[" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)

if [ -z "$PATIENT_DATA_LINE" ]; then
    echo "❌ Não foi possível encontrar a linha com patientData"
    exit 1
fi

echo "📝 Linha encontrada: $PATIENT_DATA_LINE"
echo ""

# Buscar o group_id da última consulta e adicionar ao patientData
# Primeiro, encontrar onde termina o $patientData (antes do return)
RETURN_LINE=$(sed -n "${PATIENT_DATA_LINE},${PATIENT_DATA_LINE}+20p" "$CONTROLLER_FILE" | grep -n "return response" | head -1 | cut -d: -f1)
RETURN_LINE=$((PATIENT_DATA_LINE + RETURN_LINE - 1))

if [ -z "$RETURN_LINE" ] || [ "$RETURN_LINE" -le "$PATIENT_DATA_LINE" ]; then
    echo "❌ Não foi possível encontrar o return após patientData"
    exit 1
fi

echo "📝 Adicionando busca de group_id antes do patientData..."

# Criar código para buscar group_id
cat > /tmp/group_id_code.txt << 'GROUP_ID_EOF'
                // Buscar group_id do paciente através das consultas
                $patientGroupId = null;
                $patientAppointment = DB::table('appointments')
                    ->where('doctor_id', $user->id)
                    ->whereNotNull('group_id')
                    ->whereIn('group_id', function($query) use ($id) {
                        $query->select('group_id')
                            ->from('group_members')
                            ->where('user_id', $id)
                            ->where('role', 'patient');
                    })
                    ->select('group_id')
                    ->first();
                
                if ($patientAppointment) {
                    $patientGroupId = $patientAppointment->group_id;
                }
GROUP_ID_EOF

# Inserir código antes do $patientData
sudo sed -i "${PATIENT_DATA_LINE}i$(cat /tmp/group_id_code.txt)" "$CONTROLLER_FILE"

# Agora adicionar group_id ao patientData
echo "📝 Adicionando group_id ao patientData..."
sudo sed -i "s/'photo_url' => \$patient->photo,/'photo_url' => \$patient->photo ? asset('storage\/' . \$patient->photo) : null,/" "$CONTROLLER_FILE"
sudo sed -i "s/'photo' => \$patient->photo,/'photo' => \$patient->photo ? asset('storage\/' . \$patient->photo) : null,/" "$CONTROLLER_FILE"

# Adicionar group_id ao array patientData (antes do 'reviews')
sudo sed -i "/'reviews' => \[\],/i\                    'group_id' => \$patientGroupId," "$CONTROLLER_FILE"

echo "✅ Correções aplicadas"
echo ""

# Verificar sintaxe
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe:"
    php -l "$CONTROLLER_FILE"
    echo ""
    echo "🔄 Restaurando backup..."
    sudo cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Correção aplicada com sucesso!"
echo ""
echo "📋 O que foi corrigido:"
echo "   - Adicionada busca de group_id através das consultas"
echo "   - group_id agora é incluído no retorno para médicos"
echo "   - photo_url e photo agora retornam URLs completas"

rm /tmp/group_id_code.txt













