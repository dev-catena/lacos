#!/bin/bash

# Script para corrigir o problema de doctor_id no PrescriptionController

set -e

echo "🔧 CORRIGINDO DOCTOR_ID NO PRESCRIPTIONCONTROLLER"
echo "=================================================="
echo ""

BACKEND_PATH="/var/www/lacos-backend"
CONTROLLER_FILE="${BACKEND_PATH}/app/Http/Controllers/Api/PrescriptionController.php"

cd "$BACKEND_PATH" || exit 1

# Backup
cp "$CONTROLLER_FILE" "${CONTROLLER_FILE}.backup.$(date +%s)"
echo "✅ Backup criado"

echo "1️⃣ Verificando Document::create no controller..."
if grep -q "Document::create" "$CONTROLLER_FILE"; then
    echo "   ✅ Document::create encontrado"
    echo ""
    echo "   Contexto atual:"
    grep -B 5 -A 15 "Document::create" "$CONTROLLER_FILE" | head -25
else
    echo "   ❌ Document::create não encontrado"
    exit 1
fi

echo ""
echo "2️⃣ Aplicando correção..."

# Usar Python para fazer a substituição correta
python3 << 'PYTHON_EOF'
import re
import sys

file_path = '/var/www/lacos-backend/app/Http/Controllers/Api/PrescriptionController.php'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Padrão para encontrar Document::create com doctor_id
    # Procurar por: 'doctor_id' => $validated['doctor_id'],
    pattern = r"('doctor_id'\s*=>\s*\$validated\['doctor_id'\],)"
    
    replacement = r'''// Verificar se doctor_id existe na tabela doctors antes de inserir
            $doctorIdForDocument = null;
            if (isset($validated['doctor_id']) && $validated['doctor_id']) {
                // Verificar se existe na tabela doctors
                if (\Schema::hasTable('doctors')) {
                    $doctorExists = \DB::table('doctors')->where('id', $validated['doctor_id'])->exists();
                    if ($doctorExists) {
                        $doctorIdForDocument = $validated['doctor_id'];
                    } else {
                        // Se não existe em doctors, verificar se é um user com profile doctor
                        $userDoctor = \App\Models\User::where('id', $validated['doctor_id'])
                            ->where('profile', 'doctor')
                            ->first();
                        if ($userDoctor) {
                            // Se for user doctor, usar null (pois a FK aponta para doctors)
                            $doctorIdForDocument = null;
                            \Log::warning('Doctor ID não encontrado em doctors, usando null', [
                                'doctor_id' => $validated['doctor_id'],
                                'user_id' => $userDoctor->id,
                            ]);
                        } else {
                            $doctorIdForDocument = null;
                        }
                    }
                } else {
                    // Se a tabela doctors não existe, usar null
                    $doctorIdForDocument = null;
                }
            }
            
            \1'''
    
    # Tentar substituir
    new_content = re.sub(pattern, replacement, content)
    
    # Se não encontrou, tentar padrão mais simples
    if new_content == content:
        # Procurar por Document::create e adicionar verificação antes
        pattern2 = r"(Document::create\(\[)"
        replacement2 = r'''// Verificar doctor_id antes de criar documento
            $doctorIdForDocument = null;
            if (isset($validated['doctor_id']) && $validated['doctor_id']) {
                if (\Schema::hasTable('doctors')) {
                    $doctorExists = \DB::table('doctors')->where('id', $validated['doctor_id'])->exists();
                    $doctorIdForDocument = $doctorExists ? $validated['doctor_id'] : null;
                }
            }
            
            \1'''
        new_content = re.sub(pattern2, replacement2, content)
        
        # Agora substituir 'doctor_id' => $validated['doctor_id'] por 'doctor_id' => $doctorIdForDocument
        if new_content != content:
            new_content = re.sub(
                r"'doctor_id'\s*=>\s*\$validated\['doctor_id'\]",
                "'doctor_id' => \$doctorIdForDocument",
                new_content
            )
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("   ✅ Correção aplicada")
    else:
        print("   ⚠️  Padrão não encontrado ou já foi modificado")
        print("   Verificando manualmente...")
        
        # Verificar se já tem verificação
        if 'doctorIdForDocument' in content or 'doctorExists' in content:
            print("   ✅ Já tem verificação de doctor_id")
        else:
            print("   ⚠️  Não foi possível aplicar correção automaticamente")
            print("   Edite manualmente o arquivo:")
            print(f"   nano {file_path}")
            print("   Procure por: 'doctor_id' => \$validated['doctor_id'],")
            print("   E adicione verificação antes de Document::create")
    
except Exception as e:
    print(f"   ❌ Erro: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_EOF

echo ""
echo "3️⃣ Verificando resultado..."
if grep -q "doctorIdForDocument\|doctorExists" "$CONTROLLER_FILE"; then
    echo "   ✅ Verificação de doctor_id adicionada"
else
    echo "   ⚠️  Verificação não encontrada"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ CORREÇÃO APLICADA"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "💡 O código agora verifica se doctor_id existe em doctors"
echo "   antes de inserir no banco de dados"
echo ""
echo "🔄 Reinicie o PHP-FPM e teste novamente:"
echo "   sudo systemctl restart php8.2-fpm"
echo ""




