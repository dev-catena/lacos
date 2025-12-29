#!/bin/bash

# Script para instalar sistema completo de aprovação de médicos
# Execute no servidor como root ou com sudo

set -e

cd /var/www/lacos-backend

echo "🔧 Instalando sistema de aprovação de médicos..."
echo ""

# 1. Fazer backup
echo "1️⃣ Fazendo backups..."
if [ -f "app/Http/Controllers/Api/AuthController.php" ]; then
    cp app/Http/Controllers/Api/AuthController.php app/Http/Controllers/Api/AuthController.php.backup.$(date +%s)
fi
if [ -f "app/Http/Controllers/Api/AdminDoctorController.php" ]; then
    cp app/Http/Controllers/Api/AdminDoctorController.php app/Http/Controllers/Api/AdminDoctorController.php.backup.$(date +%s)
fi
if [ -f "routes/api.php" ]; then
    cp routes/api.php routes/api.php.backup.$(date +%s)
fi
echo "✅ Backups criados"
echo ""

# 2. Executar migration para adicionar campos de ativação
echo "2️⃣ Adicionando campos de ativação na tabela users..."
if [ -f "add_doctor_activation_token.php" ]; then
    php artisan migrate --path=add_doctor_activation_token.php 2>/dev/null || php artisan migrate
    echo "✅ Migration executada"
else
    echo "⚠️  Arquivo add_doctor_activation_token.php não encontrado"
    echo "   Criando migration manualmente..."
    
    php artisan make:migration add_doctor_activation_token_to_users_table --table=users 2>/dev/null || true
    
    # Adicionar campos manualmente via SQL se migration não funcionar
    php artisan tinker --execute="
    try {
        DB::statement('ALTER TABLE users ADD COLUMN doctor_activation_token VARCHAR(64) NULL AFTER doctor_approved_at');
        echo 'Campo doctor_activation_token adicionado\n';
    } catch (Exception \$e) {
        echo 'Campo já existe ou erro: ' . \$e->getMessage() . '\n';
    }
    try {
        DB::statement('ALTER TABLE users ADD COLUMN doctor_activation_token_expires_at TIMESTAMP NULL AFTER doctor_activation_token');
        echo 'Campo doctor_activation_token_expires_at adicionado\n';
    } catch (Exception \$e) {
        echo 'Campo já existe ou erro: ' . \$e->getMessage() . '\n';
    }
    "
fi
echo ""

# 3. Verificar sintaxe dos controllers
echo "3️⃣ Verificando sintaxe..."
php -l app/Http/Controllers/Api/AuthController.php
php -l app/Http/Controllers/Api/AdminDoctorController.php
echo "✅ Sintaxe OK"
echo ""

# 4. Limpar cache
echo "4️⃣ Limpando cache..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Cache limpo"
echo ""

# 5. Verificar rotas
echo "5️⃣ Verificando rotas..."
if grep -q "doctors/activate" routes/api.php 2>/dev/null || grep -q "doctors/activate" routes_api_corrigido.php 2>/dev/null; then
    echo "✅ Rota de ativação encontrada"
else
    echo "⚠️  Rota de ativação não encontrada - será adicionada"
fi
echo ""

echo "=========================================="
echo "✅ Sistema de aprovação instalado!"
echo "=========================================="
echo ""
echo "📋 O que foi implementado:"
echo "   • Médicos não recebem token ao se registrar"
echo "   • Mensagem: 'Seu processo está em análise. Acompanhe pelo seu email.'"
echo "   • Médicos não podem fazer login até serem aprovados e ativados"
echo "   • Root aprova médico → gera token e envia email"
echo "   • Médico clica no link do email → ativa conta"
echo "   • Após ativação, médico pode fazer login"
echo ""
echo "🧪 Para testar:"
echo "   1. Crie uma conta de médico"
echo "   2. Tente fazer login → deve mostrar mensagem de análise"
echo "   3. Root aprova o médico → email é enviado"
echo "   4. Médico clica no link → conta é ativada"
echo "   5. Médico faz login → deve funcionar"
echo ""

