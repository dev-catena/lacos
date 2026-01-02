#!/bin/bash
# Script para executar os testes facilmente

set -e

# Ativar ambiente virtual
if [ ! -d "venv" ]; then
    echo "❌ Ambiente virtual não encontrado. Execute ./setup.sh primeiro."
    exit 1
fi

source venv/bin/activate

# Executar testes com parâmetros fornecidos
python3 test_supplier_wizard.py "$@"

