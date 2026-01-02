#!/bin/bash
# Script para configurar ambiente virtual e instalar dependências

set -e

echo "🔧 Configurando ambiente de testes..."

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
fi

# Ativar ambiente virtual
echo "✅ Ativando ambiente virtual..."
source venv/bin/activate

# Instalar dependências
echo "📥 Instalando dependências..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo ""
echo "✅ Ambiente configurado com sucesso!"
echo ""
echo "Para executar os testes:"
echo "  source venv/bin/activate"
echo "  python3 test_supplier_wizard.py [API_URL] [EMAIL] [PASSWORD]"
echo ""
echo "Ou use o script run_tests.sh:"
echo "  ./run_tests.sh"

