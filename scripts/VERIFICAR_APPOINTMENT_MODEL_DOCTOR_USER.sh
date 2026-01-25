#!/bin/bash

# Script para verificar e atualizar Appointment Model para ter relacionamento doctorUser

SERVER="10.102.0.103"
USER="darley"
PASSWORD="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Verificando Appointment Model..."
echo "===================================="

sshpass -p "$PASSWORD" ssh "$USER@$SERVER" << ENDSSH
cd $BACKEND_PATH

echo "📋 Verificando se o relacionamento doctorUser existe..."
if echo "$PASSWORD" | sudo -S grep -q "public function doctorUser" app/Models/Appointment.php 2>/dev/null; then
    echo "✅ Relacionamento doctorUser encontrado"
    echo ""
    echo "📋 Linhas do relacionamento:"
    echo "$PASSWORD" | sudo -S grep -A 3 "public function doctorUser" app/Models/Appointment.php 2>/dev/null
else
    echo "❌ Relacionamento doctorUser NÃO encontrado!"
    echo ""
    echo "⚠️  O Model precisa ser atualizado para incluir o relacionamento doctorUser"
    echo ""
    echo "📋 Verificando relacionamentos existentes:"
    echo "$PASSWORD" | sudo -S grep -n "public function doctor" app/Models/Appointment.php 2>/dev/null
fi

echo ""
echo "📋 Verificando se is_teleconsultation está no fillable..."
if echo "$PASSWORD" | sudo -S grep -q "is_teleconsultation" app/Models/Appointment.php 2>/dev/null; then
    echo "✅ is_teleconsultation encontrado no Model"
else
    echo "❌ is_teleconsultation NÃO encontrado no Model!"
fi

ENDSSH


