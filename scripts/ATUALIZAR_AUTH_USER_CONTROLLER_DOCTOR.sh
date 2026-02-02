#!/bin/bash

echo "🔧 Atualizando AuthController e UserController para médico..."
echo ""

cd /var/www/lacos-backend || exit 1

# 1. Atualizar Model User
echo "📝 Atualizando Model User..."
MODEL_FILE="app/Models/User.php"
MODEL_BACKUP="${MODEL_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$MODEL_FILE" "$MODEL_BACKUP"
sudo cp /tmp/User_MODEL_COM_CRM.php "$MODEL_FILE"
sudo chown www-data:www-data "$MODEL_FILE"

if php -l "$MODEL_FILE" > /dev/null 2>&1; then
    echo "✅ Model User atualizado"
else
    echo "❌ Erro de sintaxe"
    sudo cp "$MODEL_BACKUP" "$MODEL_FILE"
    exit 1
fi
echo ""

# 2. Atualizar AuthController
echo "📝 Atualizando AuthController..."
AUTH_FILE="app/Http/Controllers/Api/AuthController.php"
AUTH_BACKUP="${AUTH_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$AUTH_FILE" "$AUTH_BACKUP"

# Adicionar validação de médico após professional_caregiver
sudo sed -i '/if ($request->profile === '\''professional_caregiver'\'') {/,/}/ {
    /}/ {
        a\
\
    // Validação específica para médico\
    if ($request->profile === '\''doctor'\'') {\
        $rules = array_merge($rules, [\
            '\''gender'\'' => '\''required|string|in:Masculino,Feminino'\'',\
            '\''city'\'' => '\''required|string|max:100'\'',\
            '\''neighborhood'\'' => '\''required|string|max:100'\'',\
            '\''crm'\'' => '\''required|string|max:20'\'',\
            '\''specialty'\'' => '\''required|string|max:100'\'',\
            '\''availability'\'' => '\''required|string|max:500'\'',\
            '\''latitude'\'' => '\''nullable|numeric|between:-90,90'\'',\
            '\''longitude'\'' => '\''nullable|numeric|between:-180,180'\'',\
            '\''is_available'\'' => '\''nullable|boolean'\'',\
        ]);\
    }
    }
}' "$AUTH_FILE"

# Adicionar campos no create do usuário
sudo sed -i '/if ($validated\[.profile.\] === .professional_caregiver.) {/,/}/ {
    /}/ {
        a\
\
    // Campos específicos de médico\
    if ($validated['\''profile'\''] === '\''doctor'\'') {\
        $userData['\''crm'\''] = $validated['\''crm'\''] ?? null;\
        $userData['\''specialty'\''] = $validated['\''specialty'\''] ?? null;\
    }
    }
}' "$AUTH_FILE"

if php -l "$AUTH_FILE" > /dev/null 2>&1; then
    echo "✅ AuthController atualizado"
else
    echo "❌ Erro de sintaxe no AuthController"
    php -l "$AUTH_FILE"
    sudo cp "$AUTH_BACKUP" "$AUTH_FILE"
    exit 1
fi
echo ""

# 3. Atualizar UserController
echo "📝 Atualizando UserController..."
USER_FILE="app/Http/Controllers/Api/UserController.php"
USER_BACKUP="${USER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$USER_FILE" "$USER_BACKUP"

# Adicionar validação de crm e specialty
if ! grep -q "'crm'" "$USER_FILE"; then
    sudo sed -i "/'last_name' => 'sometimes|nullable|string|max:255',/a\            'crm' => 'sometimes|nullable|string|max:20',\n            'specialty' => 'sometimes|nullable|string|max:100'," "$USER_FILE"
    sudo sed -i "/'last_name',/a\            'crm',\n            'specialty'," "$USER_FILE"
fi

if php -l "$USER_FILE" > /dev/null 2>&1; then
    echo "✅ UserController atualizado"
else
    echo "❌ Erro de sintaxe no UserController"
    php -l "$USER_FILE"
    sudo cp "$USER_BACKUP" "$USER_FILE"
    exit 1
fi
echo ""

# 4. Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído!"

