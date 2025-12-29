#!/usr/bin/env python3
import re
import sys

file_path = '/var/www/lacos-backend/app/Http/Controllers/Api/CaregiverController.php'

try:
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Backup
    with open(file_path + '.bak.py', 'w') as f:
        f.write(content)
    
    # Substituir busca em doctors
    pattern1 = r'// Verificar se o usuário é médico\s+\$doctor = DB::table\(\'doctors\'\)\s+->where\(\'user_id\', \$user->id\)\s+->first\(\);'
    replacement1 = '''// Verificar se o usuário é médico (doctor_id nos appointments é o user_id)
            $isDoctor = $user->profile === 'doctor';'''
    
    content = re.sub(pattern1, replacement1, content, flags=re.MULTILINE)
    
    # Corrigir if ($doctor) para if ($isDoctor)
    content = content.replace('if ($doctor) {', 'if ($isDoctor) {')
    
    # Corrigir qualquer uso de $doctor->id para $user->id
    content = content.replace('$doctor->id', '$user->id')
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    print("✅ Correção aplicada com sucesso!")
    sys.exit(0)
    
except Exception as e:
    print(f"❌ Erro: {e}")
    sys.exit(1)


