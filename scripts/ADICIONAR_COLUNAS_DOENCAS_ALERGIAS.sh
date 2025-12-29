#!/bin/bash

echo "🔧 Adicionando colunas chronic_diseases e allergies na tabela users..."
echo ""

cd /var/www/lacos-backend || exit 1

# Verificar se as colunas já existem
CHRONIC_EXISTS=$(mysql -u root -p'yhvh77' lacos -e "SHOW COLUMNS FROM users LIKE 'chronic_diseases';" 2>/dev/null | wc -l)
ALLERGIES_EXISTS=$(mysql -u root -p'yhvh77' lacos -e "SHOW COLUMNS FROM users LIKE 'allergies';" 2>/dev/null | wc -l)

if [ "$CHRONIC_EXISTS" -gt 1 ]; then
    echo "⚠️ Coluna chronic_diseases já existe"
else
    echo "📝 Adicionando coluna chronic_diseases..."
    mysql -u root -p'yhvh77' lacos <<EOF
ALTER TABLE users 
ADD COLUMN chronic_diseases TEXT NULL 
COMMENT 'Doenças crônicas do paciente';
EOF
    if [ $? -eq 0 ]; then
        echo "✅ Coluna chronic_diseases adicionada"
    else
        echo "⚠️ Erro ao adicionar coluna (pode já existir)"
    fi
fi

if [ "$ALLERGIES_EXISTS" -gt 1 ]; then
    echo "⚠️ Coluna allergies já existe"
else
    echo "📝 Adicionando coluna allergies..."
    mysql -u root -p'yhvh77' lacos <<EOF
ALTER TABLE users 
ADD COLUMN allergies TEXT NULL 
COMMENT 'Alergias do paciente';
EOF
    if [ $? -eq 0 ]; then
        echo "✅ Coluna allergies adicionada"
    else
        echo "⚠️ Erro ao adicionar coluna (pode já existir)"
    fi
fi

echo ""
echo "✅ Concluído!"
echo ""

