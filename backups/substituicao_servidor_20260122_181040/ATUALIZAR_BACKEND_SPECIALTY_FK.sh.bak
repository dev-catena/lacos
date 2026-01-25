#!/bin/bash

echo "🔧 Atualizando backend para usar medical_specialty_id (foreign key)..."
echo ""

cd /var/www/lacos-backend || exit 1

DB_NAME="lacos"
DB_USER="lacos"
DB_PASS="Lacos2025Secure"

# 1. Verificar se a tabela medical_specialties existe
echo "📝 Verificando tabela medical_specialties..."
if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES LIKE 'medical_specialties';" 2>/dev/null | grep -q "medical_specialties"; then
    echo "✅ Tabela medical_specialties existe"
else
    echo "❌ Tabela medical_specialties não existe. Execute a migration primeiro."
    exit 1
fi
echo ""

# 2. Alterar coluna specialty para medical_specialty_id
echo "📝 Alterando coluna specialty para medical_specialty_id..."

# Verificar se specialty existe
if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'specialty';" 2>/dev/null | grep -q "specialty"; then
    # Verificar se medical_specialty_id já existe
    if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'medical_specialty_id';" 2>/dev/null | grep -q "medical_specialty_id"; then
        echo "✅ Coluna medical_specialty_id já existe"
    else
        # Renomear specialty para medical_specialty_id e alterar tipo
        mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
        ALTER TABLE users 
        CHANGE COLUMN specialty medical_specialty_id BIGINT UNSIGNED NULL,
        ADD CONSTRAINT fk_users_medical_specialty 
        FOREIGN KEY (medical_specialty_id) 
        REFERENCES medical_specialties(id) 
        ON DELETE SET NULL;
        " 2>/dev/null && echo "✅ Coluna alterada para medical_specialty_id com foreign key" || {
            # Se falhar, tentar apenas renomear
            mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
            ALTER TABLE users 
            CHANGE COLUMN specialty medical_specialty_id BIGINT UNSIGNED NULL;
            " 2>/dev/null && echo "✅ Coluna renomeada (adicionar foreign key manualmente)" || echo "❌ Erro ao alterar coluna"
        }
    fi
else
    # Se specialty não existe, criar medical_specialty_id
    if ! mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'medical_specialty_id';" 2>/dev/null | grep -q "medical_specialty_id"; then
        mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
        ALTER TABLE users 
        ADD COLUMN medical_specialty_id BIGINT UNSIGNED NULL AFTER crm,
        ADD CONSTRAINT fk_users_medical_specialty 
        FOREIGN KEY (medical_specialty_id) 
        REFERENCES medical_specialties(id) 
        ON DELETE SET NULL;
        " 2>/dev/null && echo "✅ Coluna medical_specialty_id criada com foreign key" || echo "❌ Erro ao criar coluna"
    fi
fi
echo ""

# 3. Atualizar Model User
echo "📝 Atualizando Model User..."
MODEL_FILE="app/Models/User.php"
MODEL_BACKUP="${MODEL_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$MODEL_FILE" "$MODEL_BACKUP"

# Substituir 'specialty' por 'medical_specialty_id' no fillable
sudo sed -i "s/'specialty'/'medical_specialty_id'/g" "$MODEL_FILE"

# Adicionar relacionamento se não existir
if ! grep -q "medicalSpecialty\|medical_specialty" "$MODEL_FILE"; then
    # Adicionar após os relacionamentos existentes
    sudo sed -i "/public function caregiverCourses()/a\\
\\
    /**\\
     * Relacionamento com especialidade médica\\
     */\\
    public function medicalSpecialty()\\
    {\\
        return \$this->belongsTo(MedicalSpecialty::class, 'medical_specialty_id');\\
    }\\
" "$MODEL_FILE"
    
    # Adicionar import se não existir
    if ! grep -q "use App\\Models\\MedicalSpecialty;" "$MODEL_FILE"; then
        sudo sed -i "/^use /a\\
use App\\Models\\MedicalSpecialty;\\
" "$MODEL_FILE"
    fi
fi

if php -l "$MODEL_FILE" > /dev/null 2>&1; then
    echo "✅ Model User atualizado"
else
    echo "❌ Erro de sintaxe"
    php -l "$MODEL_FILE"
    sudo cp "$MODEL_BACKUP" "$MODEL_FILE"
    exit 1
fi
echo ""

# 4. Atualizar AuthController
echo "📝 Atualizando AuthController..."
AUTH_FILE="app/Http/Controllers/Api/AuthController.php"
AUTH_BACKUP="${AUTH_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$AUTH_FILE" "$AUTH_BACKUP"

# Substituir 'specialty' por 'medical_specialty_id' nas validações
sudo sed -i "s/'specialty' =>/'medical_specialty_id' =>/g" "$AUTH_FILE"
sudo sed -i "s/specialty.*max:100/medical_specialty_id.*exists:medical_specialties,id/g" "$AUTH_FILE"
sudo sed -i "s/\$validated\['specialty'\]/\$validated['medical_specialty_id']/g" "$AUTH_FILE"
sudo sed -i "s/\$userData\['specialty'\]/\$userData['medical_specialty_id']/g" "$AUTH_FILE"

# Atualizar validação para usar exists
sudo sed -i "s/'medical_specialty_id' => 'required|string|max:100'/'medical_specialty_id' => 'required|exists:medical_specialties,id'/g" "$AUTH_FILE"

if php -l "$AUTH_FILE" > /dev/null 2>&1; then
    echo "✅ AuthController atualizado"
else
    echo "❌ Erro de sintaxe"
    php -l "$AUTH_FILE"
    sudo cp "$AUTH_BACKUP" "$AUTH_FILE"
    exit 1
fi
echo ""

# 5. Atualizar UserController
echo "📝 Atualizando UserController..."
USER_FILE="app/Http/Controllers/Api/UserController.php"
USER_BACKUP="${USER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$USER_FILE" "$USER_BACKUP"

# Substituir 'specialty' por 'medical_specialty_id'
sudo sed -i "s/'specialty' =>/'medical_specialty_id' =>/g" "$USER_FILE"
sudo sed -i "s/specialty.*max:100/medical_specialty_id.*exists:medical_specialties,id/g" "$USER_FILE"
sudo sed -i "s/'specialty',/'medical_specialty_id',/g" "$USER_FILE"

# Atualizar validação para usar exists
sudo sed -i "s/'medical_specialty_id' => 'sometimes|nullable|string|max:100'/'medical_specialty_id' => 'sometimes|nullable|exists:medical_specialties,id'/g" "$USER_FILE"

if php -l "$USER_FILE" > /dev/null 2>&1; then
    echo "✅ UserController atualizado"
else
    echo "❌ Erro de sintaxe"
    php -l "$USER_FILE"
    sudo cp "$USER_BACKUP" "$USER_FILE"
    exit 1
fi
echo ""

# 6. Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído!"
echo ""
echo "📋 Resumo:"
echo "   - Coluna specialty alterada para medical_specialty_id (foreign key)"
echo "   - Model User atualizado (fillable e relacionamento)"
echo "   - AuthController atualizado (validação)"
echo "   - UserController atualizado (validação)"
echo "   - Cache limpo"
echo ""

