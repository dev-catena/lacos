#!/bin/bash

echo "=== Testando API de Medicamentos ==="
echo ""

# Primeiro, precisamos de um token de autenticação
# Vou tentar fazer uma requisição para ver o que retorna

echo "1. Testando endpoint /api/medications sem autenticação (pode falhar, mas vamos ver o erro):"
echo ""

curl -X GET "http://localhost/api/medications?group_id=1" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  2>&1 | head -50

echo ""
echo ""
echo "=== Para testar com autenticação, você precisa:"
echo "1. Fazer login e pegar o token"
echo "2. Usar o token no header: Authorization: Bearer {token}"
echo ""
echo "Ou podemos verificar diretamente no código do backend o que está sendo retornado."





