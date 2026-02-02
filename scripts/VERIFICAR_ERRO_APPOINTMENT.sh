#!/bin/bash

# Script para verificar erro no AppointmentController
# Servidor: 10.102.0.103
# Usuário: darley
# Senha: yhvh77

echo "🔍 Verificando erro no AppointmentController..."

SERVER="darley@10.102.0.103"

sshpass -p 'yhvh77' ssh "$SERVER" bash << 'ENDSSH'
cd /var/www/lacos-backend

echo "📋 Verificando se a coluna is_teleconsultation existe na tabela appointments..."
mysql -u root -p'root123' lacos -e "DESCRIBE appointments;" | grep -i teleconsultation || echo "❌ Coluna is_teleconsultation NÃO existe"

echo ""
echo "📋 Verificando logs do Laravel..."
tail -n 50 storage/logs/laravel.log | grep -A 10 -B 10 "AppointmentController\|Appointment\|doctorUser" || echo "⚠️ Nenhum log recente encontrado"

echo ""
echo "📋 Verificando sintaxe do AppointmentController..."
php -l app/Http/Controllers/Api/AppointmentController.php

echo ""
echo "📋 Verificando sintaxe do Appointment Model..."
php -l app/Models/Appointment.php

ENDSSH

echo "✅ Verificação concluída!"

