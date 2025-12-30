#!/bin/bash

cd /var/www/lacos-backend || exit 1

echo "🔍 Verificando permissões e estrutura..."
echo ""

# Verificar se diretório existe
if [ ! -d "storage/app/temp" ]; then
    echo "📁 Criando diretório storage/app/temp..."
    sudo mkdir -p storage/app/temp
fi

# Verificar permissões
echo "📋 Permissões atuais:"
ls -la storage/app/ | grep -E "temp|^d"
echo ""

# Ajustar permissões
echo "🔧 Ajustando permissões..."
sudo chown -R www-data:www-data storage/app/temp
sudo chmod -R 775 storage/app/temp
echo "✅ Permissões ajustadas!"
echo ""

# Verificar espaço em disco
echo "💾 Espaço em disco:"
df -h storage/app/temp
echo ""

# Verificar se o diretório está gravável
echo "🧪 Testando escrita..."
sudo -u www-data touch storage/app/temp/teste.txt 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Diretório é gravável pelo www-data!"
    sudo rm -f storage/app/temp/teste.txt
else
    echo "❌ Diretório NÃO é gravável pelo www-data!"
    echo "   Tentando corrigir..."
    sudo chmod -R 777 storage/app/temp
    sudo -u www-data touch storage/app/temp/teste.txt 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Agora está gravável!"
        sudo rm -f storage/app/temp/teste.txt
    else
        echo "❌ Ainda não está gravável. Verifique manualmente."
    fi
fi

echo ""
echo "📋 Conteúdo do método generateCertificatePDF (verificando se está correto):"
sed -n '/public function generateCertificatePDF/,/^    }/p' app/Services/PDFService.php | grep -E "file_put_contents|file_exists|Log::" | head -10





