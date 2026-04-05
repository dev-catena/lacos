#!/bin/bash

# Script para executar as migrations manualmente no servidor
# Execute este script APÓS copiar os arquivos para o servidor

echo "🚀 Instalando estrutura de planos..."

# Verificar se estamos no diretório correto
if [ ! -f "artisan" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do Laravel (onde está o arquivo artisan)"
    exit 1
fi

# Verificar se os arquivos existem
if [ ! -f "create_plans_table.php" ]; then
    echo "❌ Erro: Arquivo create_plans_table.php não encontrado"
    echo "   Copie o arquivo para este diretório primeiro"
    exit 1
fi

if [ ! -f "create_user_plans_table.php" ]; then
    echo "❌ Erro: Arquivo create_user_plans_table.php não encontrado"
    echo "   Copie o arquivo para este diretório primeiro"
    exit 1
fi

# Executar migrations
echo "📦 Executando migration de planos..."
php artisan migrate --path=create_plans_table.php

if [ $? -ne 0 ]; then
    echo "❌ Erro ao executar migration de planos"
    exit 1
fi

echo "📦 Executando migration de user_plans..."
php artisan migrate --path=create_user_plans_table.php

if [ $? -ne 0 ]; then
    echo "❌ Erro ao executar migration de user_plans"
    exit 1
fi

echo ""
echo "✅ Migrations executadas com sucesso!"
echo ""
echo "📋 Estrutura criada:"
echo "   - Tabela 'plans' com 4 planos padrão"
echo "   - Tabela 'user_plans' para relacionamento"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Verifique se as rotas foram adicionadas ao arquivo de rotas"
echo "   2. Acesse a aplicação web em http://localhost:3000"
echo "   3. Configure os planos e funcionalidades"

