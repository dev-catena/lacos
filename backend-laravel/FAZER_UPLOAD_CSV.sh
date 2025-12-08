#!/bin/bash

# Script para fazer upload do CSV de farmácias populares

echo "📤 Fazendo upload do arquivo CSV..."

# Copiar para o diretório home primeiro (sem precisar de permissão sudo)
scp farmacias_credenciadas.csv darley@193.203.182.22:~/

# Mover para o diretório correto no servidor
sshpass -p "yhvh77" ssh darley@193.203.182.22 << 'EOF'
echo "yhvh77" | sudo -S mv ~/farmacias_credenciadas.csv /var/www/lacos-backend/farmacias_populares.csv
echo "yhvh77" | sudo -S chown www-data:www-data /var/www/lacos-backend/farmacias_populares.csv
echo "yhvh77" | sudo -S chmod 644 /var/www/lacos-backend/farmacias_populares.csv

# Verificar arquivo
echo "✅ Arquivo copiado!"
ls -lh /var/www/lacos-backend/farmacias_populares.csv
head -3 /var/www/lacos-backend/farmacias_populares.csv
EOF

echo "✅ Upload concluído!"






