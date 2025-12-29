#!/bin/bash

echo "🔧 Atualizando backend para campos específicos de médico (CRM e Especialidade)..."
echo ""

cd /var/www/lacos-backend || exit 1

DB_NAME="lacos"
DB_USER="lacos"
DB_PASS="Lacos2025Secure"

# 1. Adicionar colunas CRM e specialty no banco de dados
echo "📝 Adicionando colunas CRM e specialty na tabela users..."

# Verificar se crm existe
if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'crm';" 2>/dev/null | grep -q "crm"; then
    echo "✅ Coluna crm já existe"
else
    echo "➕ Adicionando coluna crm..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users ADD COLUMN crm VARCHAR(20) NULL AFTER formation_details;" 2>/dev/null && echo "✅ crm adicionada" || echo "❌ Erro ao adicionar crm"
fi

# Verificar se specialty existe
if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'specialty';" 2>/dev/null | grep -q "specialty"; then
    echo "✅ Coluna specialty já existe"
else
    echo "➕ Adicionando coluna specialty..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users ADD COLUMN specialty VARCHAR(100) NULL AFTER crm;" 2>/dev/null && echo "✅ specialty adicionada" || echo "❌ Erro ao adicionar specialty"
fi
echo ""

# 2. Atualizar Model User
echo "📝 Atualizando Model User..."
MODEL_FILE="app/Models/User.php"
MODEL_BACKUP="${MODEL_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$MODEL_FILE" "$MODEL_BACKUP"

# Verificar se crm e specialty estão no fillable
if grep -q "'crm'" "$MODEL_FILE" && grep -q "'specialty'" "$MODEL_FILE"; then
    echo "✅ Campos crm e specialty já estão no fillable"
else
    # Adicionar crm e specialty ao fillable (após formation_details)
    sudo sed -i "/'formation_details',/a\        'crm',\n        'specialty'," "$MODEL_FILE"
    echo "✅ Campos crm e specialty adicionados ao fillable"
fi

# Verificar sintaxe
if php -l "$MODEL_FILE" > /dev/null 2>&1; then
    echo "✅ Model User atualizado"
else
    echo "❌ Erro de sintaxe no Model User"
    php -l "$MODEL_FILE"
    sudo cp "$MODEL_BACKUP" "$MODEL_FILE"
    exit 1
fi
echo ""

# 3. Atualizar AuthController
echo "📝 Atualizando AuthController..."
AUTH_CONTROLLER="app/Http/Controllers/Api/AuthController.php"
AUTH_BACKUP="${AUTH_CONTROLLER}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$AUTH_CONTROLLER" "$AUTH_BACKUP"
echo "✅ Backup criado: $AUTH_BACKUP"

# Criar arquivo temporário com as atualizações
cat > /tmp/auth_controller_update.php << 'ENDOFFILE'
// Adicionar validação para médico após a validação de professional_caregiver
// Procurar por: if ($request->profile === 'professional_caregiver') {
// Adicionar após: }
if ($request->profile === 'doctor') {
    $rules = array_merge($rules, [
        'gender' => 'required|string|in:Masculino,Feminino',
        'city' => 'required|string|max:100',
        'neighborhood' => 'required|string|max:100',
        'crm' => 'required|string|max:20',
        'specialty' => 'required|string|max:100',
        'availability' => 'required|string|max:500',
        'latitude' => 'nullable|numeric|between:-90,90',
        'longitude' => 'nullable|numeric|between:-180,180',
        'is_available' => 'nullable|boolean',
    ]);
}
ENDOFFILE

# Usar sed para adicionar validação de médico
# Primeiro, encontrar onde está a validação de professional_caregiver
if grep -q "if (\$request->profile === 'professional_caregiver')" "$AUTH_CONTROLLER"; then
    # Encontrar o final do bloco if de professional_caregiver e adicionar validação de doctor
    # Isso é complexo, vamos fazer manualmente com um script PHP
    php -r "
    \$file = file_get_contents('$AUTH_CONTROLLER');
    // Procurar pelo padrão: if (\$request->profile === 'professional_caregiver') { ... }
    // E adicionar validação de doctor após o fechamento do bloco
    \$pattern = '/(if \(\$request->profile === \'professional_caregiver\'\) \{.*?\n\s*\})/s';
    \$replacement = '\$1' . \"\n\n    // Validação específica para médico\n    if (\$request->profile === 'doctor') {\n        \$rules = array_merge(\$rules, [\n            'gender' => 'required|string|in:Masculino,Feminino',\n            'city' => 'required|string|max:100',\n            'neighborhood' => 'required|string|max:100',\n            'crm' => 'required|string|max:20',\n            'specialty' => 'required|string|max:100',\n            'availability' => 'required|string|max:500',\n            'latitude' => 'nullable|numeric|between:-90,90',\n            'longitude' => 'nullable|numeric|between:-180,180',\n            'is_available' => 'nullable|boolean',\n        ]);\n    }\";
    \$file = preg_replace(\$pattern, \$replacement, \$file);
    file_put_contents('$AUTH_CONTROLLER', \$file);
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Validação de médico adicionada ao AuthController"
    else
        echo "⚠️  Não foi possível adicionar automaticamente. Verifique manualmente."
    fi
else
    echo "⚠️  Não foi encontrada validação de professional_caregiver. Adicione manualmente."
fi

# Verificar sintaxe
if php -l "$AUTH_CONTROLLER" > /dev/null 2>&1; then
    echo "✅ AuthController atualizado"
else
    echo "❌ Erro de sintaxe no AuthController"
    php -l "$AUTH_CONTROLLER"
    sudo cp "$AUTH_BACKUP" "$AUTH_CONTROLLER"
    exit 1
fi
echo ""

# 4. Atualizar UserController
echo "📝 Atualizando UserController..."
USER_CONTROLLER="app/Http/Controllers/Api/UserController.php"
USER_BACKUP="${USER_CONTROLLER}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$USER_CONTROLLER" "$USER_BACKUP"

# Adicionar validação para crm e specialty
if grep -q "'crm'" "$USER_CONTROLLER" && grep -q "'specialty'" "$USER_CONTROLLER"; then
    echo "✅ Campos crm e specialty já estão validados no UserController"
else
    # Adicionar validação após last_name
    sudo sed -i "/'last_name' => 'sometimes|nullable|string|max:255',/a\            'crm' => 'sometimes|nullable|string|max:20',\n            'specialty' => 'sometimes|nullable|string|max:100'," "$USER_CONTROLLER"
    # Adicionar ao $request->only
    sudo sed -i "/'last_name',/a\            'crm',\n            'specialty'," "$USER_CONTROLLER"
    echo "✅ Campos crm e specialty adicionados ao UserController"
fi

# Verificar sintaxe
if php -l "$USER_CONTROLLER" > /dev/null 2>&1; then
    echo "✅ UserController atualizado"
else
    echo "❌ Erro de sintaxe no UserController"
    php -l "$USER_CONTROLLER"
    sudo cp "$USER_BACKUP" "$USER_CONTROLLER"
    exit 1
fi
echo ""

# 5. Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído!"
echo ""
echo "📋 Resumo:"
echo "   - Colunas crm e specialty adicionadas ao banco de dados"
echo "   - Model User atualizado (fillable)"
echo "   - AuthController atualizado (validação)"
echo "   - UserController atualizado (validação)"
echo "   - Cache limpo"
echo ""

