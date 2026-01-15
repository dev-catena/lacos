#!/bin/bash

echo "🔧 Modificando AuthController para suportar CPF para médicos e email para outros perfis..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/AuthController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Verificar se o arquivo existe
if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "❌ Arquivo AuthController.php não encontrado!"
    echo "📝 Tentando usar AuthController_CORRIGIDO.php como base..."
    if [ -f "app/Http/Controllers/Api/AuthController_CORRIGIDO.php" ]; then
        sudo cp "app/Http/Controllers/Api/AuthController_CORRIGIDO.php" "$CONTROLLER_FILE"
        echo "✅ Arquivo copiado de AuthController_CORRIGIDO.php"
    else
        echo "❌ Nenhum AuthController encontrado!"
        exit 1
    fi
fi

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Função para validar CPF
cat > /tmp/validate_cpf.php << 'VALIDATE_CPF'
<?php
function validateCPF($cpf) {
    $cpf = preg_replace('/[^0-9]/', '', $cpf);
    
    if (strlen($cpf) != 11) {
        return false;
    }
    
    if (preg_match('/(\d)\1{10}/', $cpf)) {
        return false;
    }
    
    for ($t = 9; $t < 11; $t++) {
        for ($d = 0, $c = 0; $c < $t; $c++) {
            $d += $cpf[$c] * (($t + 1) - $c);
        }
        $d = ((10 * $d) % 11) % 10;
        if ($cpf[$c] != $d) {
            return false;
        }
    }
    
    return true;
}
VALIDATE_CPF

echo "✅ Script de validação CPF criado"
echo ""
echo "📝 Agora você precisa modificar manualmente o AuthController.php"
echo ""
echo "As mudanças necessárias são:"
echo "1. No método register():"
echo "   - Se profile='doctor': CPF obrigatório, email opcional"
echo "   - Se profile != 'doctor': Email obrigatório"
echo "   - Validar CPF único para médicos"
echo ""
echo "2. No método login():"
echo "   - Aceitar 'login' (cpf ou email) ao invés de apenas 'email'"
echo "   - Detectar se é CPF ou email"
echo "   - Se múltiplos perfis: retornar array de perfis"
echo "   - Se único perfil: fazer login normalmente"
echo ""
echo "📄 Veja o guia completo em: guias/MUDANCA_AUTENTICACAO_CPF_EMAIL.md"













