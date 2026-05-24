#!/bin/bash
# Inicia o backend Laravel aceitando conexões de qualquer máquina na rede
# Necessário para login remoto em http://192.168.100.10:8081 funcionar

cd "$(dirname "$0")"
echo "Iniciando backend em 0.0.0.0:8000 (acessível de outras máquinas)"
echo "Web admin em 192.168.100.10:8081 deve conseguir conectar."
php artisan serve --host=0.0.0.0 --port=8000
