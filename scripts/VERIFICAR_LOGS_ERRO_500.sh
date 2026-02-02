#!/bin/bash

# Script para verificar logs detalhados do erro 500
# Servidor: 10.102.0.103
# Usuário: darley
# Senha: yhvh77

echo "🔍 Verificando logs detalhados do erro 500..."

SERVER="darley@10.102.0.103"

sshpass -p 'yhvh77' ssh "$SERVER" bash << 'ENDSSH'
cd /var/www/lacos-backend

echo "📋 Últimas 100 linhas do log do Laravel..."
tail -n 100 storage/logs/laravel.log | grep -A 20 -B 5 "AppointmentController\|SQLSTATE\|Error\|Exception" | tail -n 50

echo ""
echo "📋 Verificando se há erros recentes relacionados a appointments..."
tail -n 200 storage/logs/laravel.log | grep -i "appointment\|doctor\|teleconsultation" | tail -n 30

ENDSSH

echo "✅ Verificação concluída!"

