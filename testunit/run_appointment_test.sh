#!/bin/bash
# Script helper para executar o teste funcional de agendamento

cd "$(dirname "$0")"

# Verificar se o ambiente virtual existe
if [ ! -d "venv" ]; then
    echo "⚠️  Ambiente virtual não encontrado. Execute ./setup.sh primeiro."
    exit 1
fi

# Ativar ambiente virtual
source venv/bin/activate

# Executar o teste
python3 test_appointment_flow.py "$@"

