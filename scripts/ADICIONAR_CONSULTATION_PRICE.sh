#!/bin/bash

# Script para adicionar campo consultation_price no backend
# Servidor: 193.203.182.22
# Usuário: darley
# Senha: yhvh77

echo "🔧 Adicionando campo consultation_price no backend..."
echo ""

SERVER="darley@193.203.182.22"
BACKEND_PATH="/var/www/lacos-backend"

sshpass -p 'yhvh77' ssh "$SERVER" bash << 'ENDSSH'
cd /var/www/lacos-backend

echo "📋 Fazendo backup dos arquivos..."
sudo cp app/Models/User.php app/Models/User.php.bak.$(date +%Y%m%d_%H%M%S)
sudo cp app/Http/Controllers/Api/UserController.php app/Http/Controllers/Api/UserController.php.bak.$(date +%Y%m%d_%H%M%S)

echo ""
echo "1️⃣ Atualizando Model User (app/Models/User.php)..."

# Verificar se consultation_price já está no fillable
if grep -A 50 "protected \$fillable" app/Models/User.php | grep -q "consultation_price"; then
    echo "   ⚠️ consultation_price já está no fillable"
else
    # Adicionar consultation_price ao fillable (após hourly_rate)
    if grep -q "'hourly_rate'," app/Models/User.php; then
        sudo sed -i "/'hourly_rate',/a\        'consultation_price'," app/Models/User.php
    elif grep -q '"hourly_rate",' app/Models/User.php; then
        sudo sed -i '/"hourly_rate",/a\        "consultation_price",' app/Models/User.php
    fi
    echo "   ✅ consultation_price adicionado ao fillable"
fi

# Verificar se consultation_price já está no casts
if grep -A 20 "protected \$casts" app/Models/User.php | grep -q "consultation_price"; then
    echo "   ⚠️ consultation_price já está no casts"
else
    # Adicionar consultation_price ao casts (após hourly_rate)
    if grep -q "'hourly_rate' => 'decimal:2'," app/Models/User.php; then
        sudo sed -i "/'hourly_rate' => 'decimal:2',/a\        'consultation_price' => 'decimal:2'," app/Models/User.php
    elif grep -q '"hourly_rate" => "decimal:2",' app/Models/User.php; then
        sudo sed -i '/"hourly_rate" => "decimal:2",/a\        "consultation_price" => "decimal:2",' app/Models/User.php
    fi
    echo "   ✅ consultation_price adicionado ao casts"
fi

echo ""
echo "2️⃣ Atualizando UserController (app/Http/Controllers/Api/UserController.php)..."

# Verificar se a validação já existe
if grep -q "consultation_price" app/Http/Controllers/Api/UserController.php; then
    echo "   ⚠️ Validação de consultation_price já existe"
else
    # Adicionar validação após medical_specialty_id
    if grep -q "'medical_specialty_id' => 'sometimes|nullable|exists:medical_specialties,id'," app/Http/Controllers/Api/UserController.php; then
        sudo sed -i "/'medical_specialty_id' => 'sometimes|nullable|exists:medical_specialties,id',/a\            'consultation_price' => 'sometimes|nullable|numeric|min:0'," app/Http/Controllers/Api/UserController.php
    elif grep -q '"medical_specialty_id" => "sometimes|nullable|exists:medical_specialties,id",' app/Http/Controllers/Api/UserController.php; then
        sudo sed -i '/"medical_specialty_id" => "sometimes|nullable|exists:medical_specialties,id",/a\            "consultation_price" => "sometimes|nullable|numeric|min:0",' app/Http/Controllers/Api/UserController.php
    fi
    echo "   ✅ Validação de consultation_price adicionada"
fi

# Adicionar consultation_price na lista de campos do only()
# Primeiro, verificar se já está na lista
if grep -A 30 "\$request->only" app/Http/Controllers/Api/UserController.php | grep -q "consultation_price"; then
    echo "   ⚠️ consultation_price já está na lista de campos do only()"
else
    # Adicionar após medical_specialty_id na lista do only()
    if grep -q "'medical_specialty_id'," app/Http/Controllers/Api/UserController.php; then
        sudo sed -i "/'medical_specialty_id',/a\            'consultation_price'," app/Http/Controllers/Api/UserController.php
    elif grep -q '"medical_specialty_id",' app/Http/Controllers/Api/UserController.php; then
        sudo sed -i '/"medical_specialty_id",/a\            "consultation_price",' app/Http/Controllers/Api/UserController.php
    fi
    echo "   ✅ consultation_price adicionado à lista de campos do only()"
fi

echo ""
echo "3️⃣ Criando migration para adicionar coluna consultation_price..."

# Criar migration
MIGRATION_NAME="add_consultation_price_to_users_table"
MIGRATION_FILE="database/migrations/$(date +%Y_%m_%d_%H%M%S)_${MIGRATION_NAME}.php"

sudo cat > /tmp/migration_consultation_price.php << 'MIGRATION'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'consultation_price')) {
                $table->decimal('consultation_price', 10, 2)->nullable()->after('hourly_rate');
            }
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'consultation_price')) {
                $table->dropColumn('consultation_price');
            }
        });
    }
};
MIGRATION

sudo mv /tmp/migration_consultation_price.php "$MIGRATION_FILE"
sudo chown www-data:www-data "$MIGRATION_FILE"
echo "   ✅ Migration criada: $MIGRATION_FILE"

echo ""
echo "4️⃣ Executando migration..."

# Verificar se a coluna já existe antes de executar
if echo 'yhvh77' | sudo -S mysql -u root lacos -e "DESCRIBE users;" 2>/dev/null | grep -q "consultation_price"; then
    echo "   ⚠️ Coluna consultation_price já existe no banco de dados"
else
    php artisan migrate --force
    echo "   ✅ Migration executada"
fi

echo ""
echo "5️⃣ Limpando cache..."

php artisan optimize:clear
echo "   ✅ Cache limpo"

echo ""
echo "6️⃣ Verificando alterações..."

echo ""
echo "📋 Verificando Model User:"
if grep -A 5 "'consultation_price'" app/Models/User.php | head -3; then
    echo "   ✅ consultation_price encontrado no Model"
else
    echo "   ❌ consultation_price NÃO encontrado no Model"
fi

echo ""
echo "📋 Verificando UserController:"
if grep "consultation_price" app/Http/Controllers/Api/UserController.php; then
    echo "   ✅ consultation_price encontrado no UserController"
else
    echo "   ❌ consultation_price NÃO encontrado no UserController"
fi

echo ""
echo "📋 Verificando banco de dados:"
if echo 'yhvh77' | sudo -S mysql -u root lacos -e "DESCRIBE users;" 2>/dev/null | grep "consultation_price"; then
    echo "   ✅ Coluna consultation_price existe no banco"
else
    echo "   ❌ Coluna consultation_price NÃO existe no banco"
fi

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Teste salvando o valor da consulta no perfil do médico"
echo "   2. Verifique se o valor está sendo persistido"
echo "   3. O valor deve aparecer quando você abrir a tela de dados profissionais novamente"

ENDSSH

echo ""
echo "✅ Script executado com sucesso!"

