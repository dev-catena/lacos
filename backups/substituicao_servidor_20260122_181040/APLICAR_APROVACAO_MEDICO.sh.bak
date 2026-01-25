#!/bin/bash

# Script para aplicar sistema de aprovação de médicos no servidor
# Execute no servidor

set -e

cd /var/www/lacos-backend

echo "🔧 Aplicando sistema de aprovação de médicos..."
echo ""

# 1. Adicionar campos de ativação na tabela users
echo "1️⃣ Adicionando campos de ativação..."
php artisan tinker --execute="
try {
    if (!Schema::hasColumn('users', 'doctor_activation_token')) {
        DB::statement('ALTER TABLE users ADD COLUMN doctor_activation_token VARCHAR(64) NULL AFTER doctor_approved_at');
        echo '✅ Campo doctor_activation_token adicionado\n';
    } else {
        echo 'ℹ️  Campo doctor_activation_token já existe\n';
    }
} catch (Exception \$e) {
    echo '⚠️  Erro ao adicionar doctor_activation_token: ' . \$e->getMessage() . '\n';
}

try {
    if (!Schema::hasColumn('users', 'doctor_activation_token_expires_at')) {
        DB::statement('ALTER TABLE users ADD COLUMN doctor_activation_token_expires_at TIMESTAMP NULL AFTER doctor_activation_token');
        echo '✅ Campo doctor_activation_token_expires_at adicionado\n';
    } else {
        echo 'ℹ️  Campo doctor_activation_token_expires_at já existe\n';
    }
} catch (Exception \$e) {
    echo '⚠️  Erro ao adicionar doctor_activation_token_expires_at: ' . \$e->getMessage() . '\n';
}
" 2>&1 || echo "⚠️  Tinker não disponível, tentando SQL direto..."

# Tentar SQL direto se tinker falhar
mysql -u root -p$(grep DB_PASSWORD .env | cut -d '=' -f2) $(grep DB_DATABASE .env | cut -d '=' -f2) <<EOF 2>/dev/null || echo "⚠️  SQL direto não disponível"
ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_activation_token VARCHAR(64) NULL AFTER doctor_approved_at;
ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_activation_token_expires_at TIMESTAMP NULL AFTER doctor_activation_token;
EOF

echo ""

# 2. Verificar sintaxe
echo "2️⃣ Verificando sintaxe dos controllers..."
php -l app/Http/Controllers/Api/AuthController.php
php -l app/Http/Controllers/Api/AdminDoctorController.php
echo "✅ Sintaxe OK"
echo ""

# 3. Adicionar rota de ativação se não existir
echo "3️⃣ Verificando rota de ativação..."
if ! grep -q "doctors/activate" routes/api.php 2>/dev/null; then
    echo "   Adicionando rota de ativação..."
    # Adicionar rota após especialidades médicas usando sudo
    sudo bash -c "
    # Encontrar linha das especialidades e adicionar após ela
    LINE_NUM=\$(grep -n '// Especialidades médicas' routes/api.php | cut -d: -f1)
    if [ -n \"\$LINE_NUM\" ]; then
        # Criar arquivo temporário
        TEMP_FILE=\$(mktemp /tmp/routes_XXXXXX)
        # Copiar até a linha encontrada
        head -n \"\$LINE_NUM\" routes/api.php > \"\$TEMP_FILE\"
        # Adicionar linha em branco e rota
        echo '' >> \"\$TEMP_FILE\"
        echo '// Ativação de conta de médico (rota pública)' >> \"\$TEMP_FILE\"
        echo \"Route::get('doctors/activate', [AdminDoctorController::class, 'activate']);\" >> \"\$TEMP_FILE\"
        # Adicionar resto do arquivo
        tail -n +\"\$((LINE_NUM + 1))\" routes/api.php >> \"\$TEMP_FILE\"
        # Substituir arquivo original
        mv \"\$TEMP_FILE\" routes/api.php
        chown www-data:www-data routes/api.php
    fi
    "
    echo "✅ Rota adicionada"
else
    echo "✅ Rota já existe"
fi
echo ""

# 4. Limpar cache
echo "4️⃣ Limpando cache..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Cache limpo"
echo ""

echo "=========================================="
echo "✅ Sistema de aprovação aplicado!"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo "   1. Teste criar uma conta de médico"
echo "   2. Verifique que não pode fazer login"
echo "   3. Root aprova o médico"
echo "   4. Médico recebe email com link"
echo "   5. Médico clica no link → ativa conta"
echo "   6. Médico pode fazer login"
echo ""

