#!/bin/bash

# Script para instalar funcionalidade de Farmácias Populares

echo "📦 Instalando Farmácias Populares..."

# Copiar arquivos para o servidor
echo "📤 Enviando arquivos para o servidor..."

sshpass -p "yhvh77" scp create_popular_pharmacies_table.php darley@10.102.0.103:~/
sshpass -p "yhvh77" scp PopularPharmacy.php darley@10.102.0.103:~/
sshpass -p "yhvh77" scp PopularPharmacyController.php darley@10.102.0.103:~/
sshpass -p "yhvh77" scp api_routes_corrected.php darley@10.102.0.103:~/

# Mover arquivos no servidor
echo "📁 Movendo arquivos no servidor..."

sshpass -p "yhvh77" ssh darley@10.102.0.103 << 'SSHEOF'
echo "yhvh77" | sudo -S mv ~/create_popular_pharmacies_table.php /var/www/lacos-backend/database/migrations/$(date +%Y_%m_%d_%H%M%S)_create_popular_pharmacies_table.php
echo "yhvh77" | sudo -S mv ~/PopularPharmacy.php /var/www/lacos-backend/app/Models/PopularPharmacy.php
echo "yhvh77" | sudo -S mv ~/PopularPharmacyController.php /var/www/lacos-backend/app/Http/Controllers/Api/PopularPharmacyController.php
echo "yhvh77" | sudo -S mv ~/api_routes_corrected.php /var/www/lacos-backend/routes/api.php
echo "yhvh77" | sudo -S chown -R www-data:www-data /var/www/lacos-backend/app/Models/PopularPharmacy.php
echo "yhvh77" | sudo -S chown -R www-data:www-data /var/www/lacos-backend/app/Http/Controllers/Api/PopularPharmacyController.php
echo "yhvh77" | sudo -S chown -R www-data:www-data /var/www/lacos-backend/routes/api.php

cd /var/www/lacos-backend
php artisan migrate --force
php artisan config:clear
php artisan cache:clear
php artisan route:clear

echo "✅ Instalação concluída!"
SSHEOF

echo "✅ Processo concluído!"
