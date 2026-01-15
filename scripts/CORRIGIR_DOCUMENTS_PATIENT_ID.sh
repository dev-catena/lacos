#!/bin/bash

echo "🔧 Corrigindo DocumentController para buscar documentos por patient_id para médicos..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/DocumentController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Verificar se o método index existe
if ! grep -q "public function index" "$CONTROLLER_FILE"; then
    echo "❌ Método index não encontrado!"
    exit 1
fi

# Encontrar a linha onde está "// Filtrar por tipo"
TYPE_FILTER_LINE=$(grep -n "// Filtrar por tipo" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)

if [ -z "$TYPE_FILTER_LINE" ]; then
    echo "❌ Não foi possível encontrar a linha com filtro por tipo"
    exit 1
fi

# Encontrar a linha onde começa "// Carregar relacionamentos"
RELATIONSHIPS_LINE=$(grep -n "// Carregar relacionamentos" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)

if [ -z "$RELATIONSHIPS_LINE" ]; then
    echo "❌ Não foi possível encontrar a linha de relacionamentos"
    exit 1
fi

echo "📝 Linhas encontradas: tipo=$TYPE_FILTER_LINE, relacionamentos=$RELATIONSHIPS_LINE"
echo ""

# Criar código para adicionar filtro por patient_id para médicos
cat > /tmp/patient_id_filter.txt << 'PATIENT_ID_EOF'

            // Filtrar por patient_id (para médicos)
            if ($request->has('patient_id')) {
                $patientId = $request->input('patient_id');
                $user = Auth::user();
                
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Usuário não autenticado',
                    ], 401);
                }
                
                // Verificar se o usuário é médico
                if ($user->profile === 'doctor') {
                    // Buscar todos os grupos onde o paciente é membro
                    $patientGroupIds = DB::table('group_members')
                        ->where('user_id', $patientId)
                        ->where('role', 'patient')
                        ->pluck('group_id')
                        ->toArray();
                    
                    if (!empty($patientGroupIds)) {
                        // Buscar documentos de todos os grupos onde o paciente é membro
                        $query->whereIn('group_id', $patientGroupIds);
                    } else {
                        // Se o paciente não está em nenhum grupo, retornar vazio
                        $query->whereRaw('1 = 0');
                    }
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Apenas médicos podem buscar documentos por patient_id',
                    ], 403);
                }
            }
PATIENT_ID_EOF

# Inserir código antes da linha de relacionamentos
echo "📝 Inserindo código antes da linha $RELATIONSHIPS_LINE..."
sudo sed -i "${RELATIONSHIPS_LINE}i$(cat /tmp/patient_id_filter.txt)" "$CONTROLLER_FILE"

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
echo "   - Adicionado filtro por patient_id no método index do DocumentController"
echo "   - Médicos podem buscar documentos de um paciente usando ?patient_id={id}"
echo "   - Busca documentos de todos os grupos onde o paciente é membro"

rm /tmp/patient_id_filter.txt
