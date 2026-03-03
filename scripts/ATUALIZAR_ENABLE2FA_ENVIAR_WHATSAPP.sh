#!/bin/bash

# Script para atualizar o método enable2FA para enviar código WhatsApp ao ativar

SERVER="192.168.0.20"
USER="darley"
PORT="63022"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"
AUTH_CONTROLLER="$REMOTE_PATH/app/Http/Controllers/Api/AuthController.php"

echo "🔧 Atualizando enable2FA para enviar WhatsApp..."

# Criar script Python para atualizar o método
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
cat > /tmp/update_enable2fa.py << 'PYEOF'
import re
from pathlib import Path

auth_file = Path('$AUTH_CONTROLLER')
ctl = auth_file.read_text(encoding='utf-8')

# Procurar o método enable2FA
enable2fa_pattern = r'(public function enable2FA\(Request \$request\)\s*\{[^}]*?)(\s*\$user->two_factor_phone = \$request->phone;\s*\$user->save\(\);)([^}]*?)(\s*\\\\Log::info\(.*?\);)([^}]*?)(return response\(\)->json\([^}]*?\);)([^}]*?\})'

def replace_enable2fa(match):
    full_method = match.group(0)
    
    # Verificar se já tem envio de WhatsApp
    if 'WhatsAppService' in full_method or 'sendVerificationCode' in full_method:
        print('ℹ️  enable2FA já envia WhatsApp. Pulando.')
        return full_method
    
    # Construir novo método com envio de WhatsApp
    before_save = match.group(1)
    save_line = match.group(2)
    after_save = match.group(3)
    log_line = match.group(4)
    after_log = match.group(5)
    return_line = match.group(6)
    closing = match.group(7)
    
    whatsapp_block = r'''
            // Enviar código de teste via WhatsApp
            $whatsappService = new \App\Services\WhatsAppService();
            $testCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $user->two_factor_code = \Illuminate\Support\Facades\Hash::make($testCode);
            $user->two_factor_expires_at = now()->addMinutes(5);
            $user->save();
            
            $result = $whatsappService->sendVerificationCode($request->phone, $testCode);
            
            if (empty($result['success'])) {
                \Log::warning('Erro ao enviar código WhatsApp ao ativar 2FA', [
                    'user_id' => $user->id,
                    'error' => $result['error'] ?? 'Erro desconhecido',
                ]);
                // Não falha a ativação, apenas registra o erro
            } else {
                \Log::info('Código WhatsApp enviado ao ativar 2FA', [
                    'user_id' => $user->id,
                    'phone' => $request->phone,
                ]);
            }
'''
    
    new_method = before_save + save_line + after_save + log_line + whatsapp_block + after_log + return_line + closing
    
    print('✅ enable2FA atualizado para enviar WhatsApp')
    return new_method

# Tentar substituir
new_ctl = re.sub(enable2fa_pattern, replace_enable2fa, ctl, flags=re.DOTALL)

if new_ctl != ctl:
    auth_file.write_text(new_ctl, encoding='utf-8')
    print('✅ AuthController atualizado')
else:
    # Tentar método mais simples: inserir após save()
    simple_pattern = r'(\$user->two_factor_phone = \$request->phone;\s*\$user->save\(\);)(\s*\\\\Log::info)'
    
    replacement = r'''\1
            
            // Enviar código de teste via WhatsApp
            $whatsappService = new \App\Services\WhatsAppService();
            $testCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $user->two_factor_code = \Illuminate\Support\Facades\Hash::make($testCode);
            $user->two_factor_expires_at = now()->addMinutes(5);
            $user->save();
            
            $result = $whatsappService->sendVerificationCode($request->phone, $testCode);
            
            if (empty($result['success'])) {
                \Log::warning('Erro ao enviar código WhatsApp ao ativar 2FA', [
                    'user_id' => $user->id,
                    'error' => $result['error'] ?? 'Erro desconhecido',
                ]);
            } else {
                \Log::info('Código WhatsApp enviado ao ativar 2FA', [
                    'user_id' => $user->id,
                    'phone' => $request->phone,
                ]);
            }
\2'''
    
    new_ctl = re.sub(simple_pattern, replacement, ctl, flags=re.DOTALL)
    
    if new_ctl != ctl:
        auth_file.write_text(new_ctl, encoding='utf-8')
        print('✅ AuthController atualizado (método simples)')
    else:
        print('❌ Não foi possível atualizar enable2FA')
        exit(1)
PYEOF

cd $REMOTE_PATH
python3 /tmp/update_enable2fa.py
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Método enable2FA atualizado!"
    echo ""
    echo "🔧 Limpando cache do Laravel..."
    sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
        cd $REMOTE_PATH
        echo '$PASSWORD' | sudo -S -u www-data php artisan config:clear
        echo '$PASSWORD' | sudo -S -u www-data php artisan route:clear
        echo '$PASSWORD' | sudo -S -u www-data php artisan cache:clear
    "
    echo "✅ Cache limpo!"
    echo ""
    echo "🎉 Agora o enable2FA enviará um código WhatsApp ao ativar o 2FA!"
else
    echo "❌ Erro ao atualizar enable2FA"
    exit 1
fi

