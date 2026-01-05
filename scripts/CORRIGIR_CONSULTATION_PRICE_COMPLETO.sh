#!/bin/bash

# Script completo para adicionar consultation_price ao relacionamento doctor.user
# Execute: sudo bash /tmp/CORRIGIR_CONSULTATION_PRICE_COMPLETO.sh

cd /var/www/lacos-backend || exit 1

echo "🔧 Corrigindo consultation_price no relacionamento doctor.user..."

# 1. Verificar e modificar Model Doctor (se existir)
if [ -f "app/Models/Doctor.php" ]; then
    echo ""
    echo "1️⃣ Verificando Model Doctor..."
    
    if ! grep -q "function user()" app/Models/Doctor.php; then
        echo "   📝 Adicionando relacionamento user() ao Model Doctor..."
        
        # Fazer backup
        if [ ! -f "app/Models/Doctor.php.backup" ]; then
            cp app/Models/Doctor.php app/Models/Doctor.php.backup
        fi
        
        # Adicionar relacionamento antes do último }
        sed -i '/^}$/i\
    public function user()\
    {\
        return $this->belongsTo(User::class, '\''user_id'\'');\
    }' app/Models/Doctor.php
        
        echo "   ✅ Relacionamento user() adicionado"
    else
        echo "   ✅ Relacionamento user() já existe"
    fi
else
    echo "   ⚠️ Model Doctor não encontrado (pode estar em outro local)"
fi

# 2. Modificar AppointmentController
echo ""
echo "2️⃣ Modificando AppointmentController..."

if [ ! -f "app/Http/Controllers/Api/AppointmentController.php.backup" ]; then
    cp app/Http/Controllers/Api/AppointmentController.php app/Http/Controllers/Api/AppointmentController.php.backup
    echo "   ✅ Backup criado"
fi

# Modificar método index
if ! grep -q "doctor.user.*consultation_price" app/Http/Controllers/Api/AppointmentController.php; then
    # Substituir with(['doctor', 'exceptions'])
    sed -i "s/with(\['doctor', 'exceptions'\])/with(['doctor.user' => function(\$query) { \$query->select('id', 'name', 'email', 'consultation_price'); }, 'exceptions'])/" app/Http/Controllers/Api/AppointmentController.php
    echo "   ✅ Método index atualizado"
else
    echo "   ⚠️ Método index já parece estar configurado"
fi

# Modificar método show
if ! grep -q "Appointment::with.*doctor.user.*consultation_price" app/Http/Controllers/Api/AppointmentController.php; then
    sed -i "s/Appointment::with(\['doctor', 'exceptions'\])/Appointment::with(['doctor.user' => function(\$query) { \$query->select('id', 'name', 'email', 'consultation_price'); }, 'exceptions'])/" app/Http/Controllers/Api/AppointmentController.php
    echo "   ✅ Método show atualizado"
else
    echo "   ⚠️ Método show já parece estar configurado"
fi

# Modificar load('doctor') nos métodos store e update
if ! grep -q "load.*doctor.user.*consultation_price" app/Http/Controllers/Api/AppointmentController.php; then
    sed -i "s/load('doctor')/load(['doctor.user' => function(\$query) { \$query->select('id', 'name', 'email', 'consultation_price'); }])/" app/Http/Controllers/Api/AppointmentController.php
    echo "   ✅ Métodos store/update atualizados"
else
    echo "   ⚠️ Métodos store/update já parecem estar configurados"
fi

# 3. Verificar sintaxe
echo ""
echo "3️⃣ Verificando sintaxe PHP..."
if php -l app/Http/Controllers/Api/AppointmentController.php > /dev/null 2>&1; then
    echo "   ✅ AppointmentController: OK"
else
    echo "   ❌ Erro no AppointmentController. Restaurando backup..."
    cp app/Http/Controllers/Api/AppointmentController.php.backup app/Http/Controllers/Api/AppointmentController.php
    exit 1
fi

if [ -f "app/Models/Doctor.php" ]; then
    if php -l app/Models/Doctor.php > /dev/null 2>&1; then
        echo "   ✅ Doctor Model: OK"
    else
        echo "   ❌ Erro no Doctor Model. Restaurando backup..."
        if [ -f "app/Models/Doctor.php.backup" ]; then
            cp app/Models/Doctor.php.backup app/Models/Doctor.php
        fi
        exit 1
    fi
fi

# 4. Limpar cache
echo ""
echo "4️⃣ Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "   ✅ Cache limpo"

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Teste criando uma teleconsulta"
echo "   2. Verifique os logs do frontend - deve aparecer:"
echo "      appointment.doctor.user.consultation_price"
echo "   3. O valor deve aparecer na tela de pagamento"

