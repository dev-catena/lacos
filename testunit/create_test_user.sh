#!/bin/bash
# Script helper para criar conta de teste

cd "$(dirname "$0")"

# Ativar ambiente virtual se existir
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Executar script Python
python3 create_test_user.py "$@"

