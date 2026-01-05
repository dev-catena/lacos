#!/bin/bash

# Script para adicionar consultation_price ao relacionamento doctor.user no AppointmentController
# Execute este script no servidor: sudo bash /tmp/ADICIONAR_CONSULTATION_PRICE_APPOINTMENT.sh

cd /var/www/lacos-backend || exit 1

echo "🔧 Adicionando consultation_price ao relacionamento doctor.user no AppointmentController..."

# Fazer backup
if [ ! -f "app/Http/Controllers/Api/AppointmentController.php.backup" ]; then
    cp app/Http/Controllers/Api/AppointmentController.php app/Http/Controllers/Api/AppointmentController.php.backup
    echo "✅ Backup criado"
fi

# Modificar o método index para incluir doctor.user com consultation_price
if grep -q "with(\['doctor' => function" app/Http/Controllers/Api/AppointmentController.php; then
    echo "⚠️ AppointmentController já parece ter doctor.user configurado"
else
    # Substituir with(['doctor', 'exceptions']) por with(['doctor.user', 'exceptions'])
    sed -i "s/with(\['doctor', 'exceptions'\])/with(['doctor.user' => function(\$query) { \$query->select('id', 'name', 'email', 'consultation_price'); }, 'exceptions'])/" app/Http/Controllers/Api/AppointmentController.php
    echo "✅ Método index atualizado"
fi

# Modificar o método show para incluir doctor.user com consultation_price
if grep -q "with(\['doctor' => function" app/Http/Controllers/Api/AppointmentController.php; then
    echo "⚠️ Método show já parece ter doctor.user configurado"
else
    # Substituir with(['doctor', 'exceptions']) no método show
    sed -i "s/Appointment::with(\['doctor', 'exceptions'\])/Appointment::with(['doctor.user' => function(\$query) { \$query->select('id', 'name', 'email', 'consultation_price'); }, 'exceptions'])/" app/Http/Controllers/Api/AppointmentController.php
    echo "✅ Método show atualizado"
fi

# Modificar load('doctor') para load('doctor.user') nos métodos store e update
if grep -q "load('doctor.user')" app/Http/Controllers/Api/AppointmentController.php; then
    echo "⚠️ Métodos store/update já parecem ter doctor.user configurado"
else
    sed -i "s/load('doctor')/load(['doctor.user' => function(\$query) { \$query->select('id', 'name', 'email', 'consultation_price'); }])/" app/Http/Controllers/Api/AppointmentController.php
    echo "✅ Métodos store/update atualizados"
fi

# Verificar sintaxe PHP
echo ""
echo "🔍 Verificando sintaxe PHP..."
if php -l app/Http/Controllers/Api/AppointmentController.php > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP OK"
else
    echo "❌ Erro de sintaxe PHP. Restaurando backup..."
    cp app/Http/Controllers/Api/AppointmentController.php.backup app/Http/Controllers/Api/AppointmentController.php
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
echo "✅ Processo concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Teste criando uma teleconsulta"
echo "   2. Verifique se o consultation_price aparece em appointment.doctor.user.consultation_price"
echo "   3. O frontend deve conseguir acessar: appointment.doctor?.user?.consultation_price"

