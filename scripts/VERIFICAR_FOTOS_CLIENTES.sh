#!/bin/bash

echo "🔍 Verificando fotos dos clientes no banco de dados..."
echo ""

cd /var/www/lacos-backend || exit 1

# Tentar diferentes formas de obter credenciais do banco
if [ -f .env ]; then
    DB_DATABASE=$(grep "^DB_DATABASE=" .env | cut -d '=' -f2)
    DB_USER=$(grep "^DB_USERNAME=" .env | cut -d '=' -f2)
    DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2)
    
    echo "📋 Consultando banco de dados: $DB_DATABASE"
    echo ""
    
    mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_DATABASE" -e "
    SELECT 
        id, 
        name, 
        CASE 
            WHEN photo IS NULL OR photo = '' THEN 'SEM FOTO' 
            ELSE photo 
        END as photo
    FROM users 
    WHERE name IN ('Biza Vo', 'Cuidador bom');
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Consulta realizada com sucesso"
    else
        echo "❌ Erro ao consultar banco de dados"
        echo "💡 Tente executar manualmente:"
        echo "   mysql -u root -p -e \"SELECT id, name, photo FROM users WHERE name IN ('Biza Vo', 'Cuidador bom');\" nome_do_banco"
    fi
else
    echo "❌ Arquivo .env não encontrado"
    echo "💡 Execute manualmente:"
    echo "   mysql -u root -p -e \"SELECT id, name, photo FROM users WHERE name IN ('Biza Vo', 'Cuidador bom');\" nome_do_banco"
fi

echo ""

