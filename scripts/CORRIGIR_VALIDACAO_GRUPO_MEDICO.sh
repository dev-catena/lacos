#!/bin/bash

echo "🔧 Corrigindo validação de acesso ao grupo para médicos..."
echo ""
echo "Médicos não fazem parte dos grupos de pacientes."
echo "A relação é através de consultas (appointments)."
echo ""

# Arquivo onde o PrescriptionController deve estar
CONTROLLER_FILE="backend-laravel/app/Http/Controllers/Api/PrescriptionController.php"

# Verificar se o arquivo existe
if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "⚠️ Arquivo PrescriptionController.php não encontrado!"
    echo "📝 O controller pode estar em outro local ou ainda não foi criado."
    echo ""
    echo "🔍 Procurando arquivos relacionados..."
    find . -name "*Prescription*" -type f 2>/dev/null | head -5
    echo ""
    echo "💡 Se o controller ainda não existe, você precisa primeiro executar INSTALAR_TELEMEDICINA_BACKEND.sh"
    exit 1
fi

# Backup
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"
cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Corrigir generateSignedCertificate - substituir validação de grupo
echo "🔧 Corrigindo método generateSignedCertificate..."

# Substituir a validação que verifica se o usuário pertence ao grupo
# Por uma validação que verifica se é médico e tem consulta com o grupo
sed -i '/\/\/ Verificar se o usuário pertence ao grupo/,/^            }$/c\
            // Verificar acesso ao grupo\
            $user = Auth::user();\
            $isDoctor = $user->profile === '\''doctor'\'';\
            \
            if ($isDoctor) {\
                // Para médicos: verificar se tem consulta com o grupo/paciente\
                $hasAppointment = DB::table('\''appointments'\'')\
                    ->where('\''doctor_id'\'', $user->id)\
                    ->where('\''group_id'\'', $validated['\''group_id'\''])\
                    ->exists();\
                \
                if (!$hasAppointment && ($validated['\''appointment_id'\''] ?? null)) {\
                    // Verificar se a consulta específica pertence ao médico\
                    $appointment = DB::table('\''appointments'\'')\
                        ->where('\''id'\'', $validated['\''appointment_id'\''])\
                        ->where('\''doctor_id'\'', $user->id)\
                        ->first();\
                    \
                    if (!$appointment) {\
                        return response()->json([\
                            '\''success'\'' => false,\
                            '\''message'\'' => '\''Você não tem permissão para gerar documentos para esta consulta.'\''\
                        ], 403);\
                    }\
                } elseif (!$hasAppointment) {\
                    return response()->json([\
                        '\''success'\'' => false,\
                        '\''message'\'' => '\''Você não tem consultas agendadas com este paciente/grupo.'\''\
                    ], 403);\
                }\
            } else {\
                // Para não-médicos (cuidadores): verificar se pertence ao grupo\
                $group = $user->groups()->find($validated['\''group_id'\'']);\
                if (!$group) {\
                    return response()->json([\
                        '\''success'\'' => false,\
                        '\''message'\'' => '\''Você não tem acesso a este grupo'\''\
                    ], 403);\
                }\
            }' "$CONTROLLER_FILE"

# Corrigir generateSignedRecipe - mesma lógica
echo "🔧 Corrigindo método generateSignedRecipe..."
sed -i '/\/\/ Verificar se o usuário pertence ao grupo/,/^            }$/c\
            // Verificar acesso ao grupo\
            $user = Auth::user();\
            $isDoctor = $user->profile === '\''doctor'\'';\
            \
            if ($isDoctor) {\
                // Para médicos: verificar se tem consulta com o grupo/paciente\
                $hasAppointment = DB::table('\''appointments'\'')\
                    ->where('\''doctor_id'\'', $user->id)\
                    ->where('\''group_id'\'', $validated['\''group_id'\''])\
                    ->exists();\
                \
                if (!$hasAppointment && ($validated['\''appointment_id'\''] ?? null)) {\
                    // Verificar se a consulta específica pertence ao médico\
                    $appointment = DB::table('\''appointments'\'')\
                        ->where('\''id'\'', $validated['\''appointment_id'\''])\
                        ->where('\''doctor_id'\'', $user->id)\
                        ->first();\
                    \
                    if (!$appointment) {\
                        return response()->json([\
                            '\''success'\'' => false,\
                            '\''message'\'' => '\''Você não tem permissão para gerar documentos para esta consulta.'\''\
                        ], 403);\
                    }\
                } elseif (!$hasAppointment) {\
                    return response()->json([\
                        '\''success'\'' => false,\
                        '\''message'\'' => '\''Você não tem consultas agendadas com este paciente/grupo.'\''\
                    ], 403);\
                }\
            } else {\
                // Para não-médicos (cuidadores): verificar se pertence ao grupo\
                $group = $user->groups()->find($validated['\''group_id'\'']);\
                if (!$group) {\
                    return response()->json([\
                        '\''success'\'' => false,\
                        '\''message'\'' => '\''Você não tem acesso a este grupo'\''\
                    ], 403);\
                }\
            }' "$CONTROLLER_FILE"

# Adicionar use DB no topo do arquivo se não existir
if ! grep -q "use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE"; then
    # Adicionar após os outros use statements
    sed -i '/^use Illuminate\\Support\\Facades\\/a\use Illuminate\\Support\\Facades\\DB;' "$CONTROLLER_FILE"
fi

# Verificar sintaxe PHP
echo ""
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida!"
else
    echo "❌ Erro de sintaxe PHP encontrado!"
    echo "🔄 Restaurando backup..."
    cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi

echo ""
echo "✅ Correção aplicada com sucesso!"
echo ""
echo "📋 O que foi alterado:"
echo "  - Médicos agora verificam acesso através de consultas (appointments)"
echo "  - Cuidadores/pacientes continuam verificando acesso através de grupos"
echo "  - Adicionada validação específica para consultas individuais"
echo ""
echo "🚀 Próximos passos:"
echo "  1. Testar geração de atestado/receita como médico"
echo "  2. Verificar logs em caso de erro"
echo ""


