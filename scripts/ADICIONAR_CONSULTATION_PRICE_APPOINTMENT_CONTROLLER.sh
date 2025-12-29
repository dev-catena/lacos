#!/bin/bash

# Script para adicionar consultation_price ao relacionamento doctorUser no AppointmentController
# Este script modifica o AppointmentController para incluir consultation_price quando retorna appointments

cd /var/www/lacos-backend || exit 1

echo "🔧 Adicionando consultation_price ao relacionamento doctorUser no AppointmentController..."

# Fazer backup
if [ ! -f "app/Http/Controllers/Api/AppointmentController.php.backup" ]; then
    cp app/Http/Controllers/Api/AppointmentController.php app/Http/Controllers/Api/AppointmentController.php.backup
    echo "✅ Backup criado"
fi

# Verificar se já foi modificado
if grep -q "doctorUser.*consultation_price\|with.*doctorUser.*consultation_price" app/Http/Controllers/Api/AppointmentController.php 2>/dev/null; then
    echo "⚠️ AppointmentController já parece ter consultation_price no relacionamento"
else
    # Adicionar consultation_price ao relacionamento doctorUser
    # Procurar por 'with([' e adicionar consultation_price se não estiver
    if grep -q "with(\['doctor'" app/Http/Controllers/Api/AppointmentController.php; then
        # Se já tem with(['doctor', ...]), adicionar consultation_price ao select
        sed -i "s/with(\['doctor'/with(['doctor' => function(\$query) { \$query->select('id', 'user_id'); }, 'doctor.user' => function(\$query) { \$query->select('id', 'name', 'email', 'consultation_price'); }/" app/Http/Controllers/Api/AppointmentController.php
        echo "✅ Relacionamento doctor.user atualizado com consultation_price"
    else
        # Adicionar relacionamento com consultation_price
        if grep -q "Appointment::with" app/Http/Controllers/Api/AppointmentController.php; then
            # Adicionar ao with existente
            sed -i "s/Appointment::with(\['doctor'/Appointment::with(['doctor' => function(\$query) { \$query->select('id', 'user_id'); }, 'doctor.user' => function(\$query) { \$query->select('id', 'name', 'email', 'consultation_price'); }/" app/Http/Controllers/Api/AppointmentController.php
        else
            # Adicionar novo with
            sed -i "s/\$query = Appointment::with(\['doctor'/\$query = Appointment::with(['doctor' => function(\$query) { \$query->select('id', 'user_id'); }, 'doctor.user' => function(\$query) { \$query->select('id', 'name', 'email', 'consultation_price'); }/" app/Http/Controllers/Api/AppointmentController.php
        fi
        echo "✅ Relacionamento adicionado com consultation_price"
    fi
fi

# Verificar sintaxe PHP
if php -l app/Http/Controllers/Api/AppointmentController.php > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP OK"
else
    echo "❌ Erro de sintaxe PHP. Restaurando backup..."
    cp app/Http/Controllers/Api/AppointmentController.php.backup app/Http/Controllers/Api/AppointmentController.php
    exit 1
fi

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Teste criando uma teleconsulta"
echo "   2. Verifique se o consultation_price aparece no appointment.doctorUser"
echo "   3. Se não funcionar, pode ser necessário ajustar o relacionamento no Model Doctor"

