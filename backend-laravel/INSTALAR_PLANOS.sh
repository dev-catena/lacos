#!/bin/bash

# Script para instalar a estrutura de planos no backend Laravel

echo "🚀 Instalando estrutura de planos..."

# Verificar se estamos no diretório correto
if [ ! -f "artisan" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do Laravel (onde está o arquivo artisan)"
    exit 1
fi

# Executar migrations
echo "📦 Executando migrations..."
php artisan migrate --path=create_plans_table.php
php artisan migrate --path=create_user_plans_table.php

# Verificar se as migrations foram executadas
if [ $? -eq 0 ]; then
    echo "✅ Migrations executadas com sucesso!"
    echo ""
    echo "📋 Estrutura criada:"
    echo "   - Tabela 'plans' com 4 planos padrão"
    echo "   - Tabela 'user_plans' para relacionamento"
    echo ""
    echo "🎯 Próximos passos:"
    echo "   1. Acesse a aplicação web em http://localhost:3000"
    echo "   2. Configure os planos e funcionalidades"
    echo "   3. Os usuários existentes receberam automaticamente o plano Básico"
else
    echo "❌ Erro ao executar migrations"
    exit 1
fi

