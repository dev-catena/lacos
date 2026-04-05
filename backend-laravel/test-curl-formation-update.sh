#!/bin/bash
# =============================================================================
# Teste CURL - Endpoint PUT /api/users/{id} - Detalhes de Formação
# =============================================================================
# Isola se o problema é FRONTEND ou BACKEND.
# Se este teste passar, o backend está OK e o problema está no frontend.
#
# Uso:
#   ./test-curl-formation-update.sh                    # usa localhost:8000
#   ./test-curl-formation-update.sh http://192.168.0.20:8000
#   TOKEN=xxx USER_ID=5 ./test-curl-formation-update.sh  # token/user manual
# =============================================================================

BASE="${1:-http://127.0.0.1:8000}"
API="$BASE/api"

# Valor de teste para formation_description (único para verificar persistência)
VALOR_TESTE="Teste CURL $(date +%H:%M:%S) - detalhes formacao"

echo ""
echo "=============================================="
echo "  TESTE CURL - Detalhes de Formação (UPDATE)"
echo "=============================================="
echo "Base URL: $BASE"
echo "Endpoint: PUT $API/users/{id}"
echo "Campo testado: formation_description"
echo "Valor enviado: $VALOR_TESTE"
echo "=============================================="
echo ""

# Obter TOKEN e USER_ID (se não foram passados)
if [ -z "$TOKEN" ] || [ -z "$USER_ID" ]; then
  echo "Obtendo token e user_id de um cuidador profissional..."
  cd "$(dirname "$0")"
  
  TOKEN=$(php artisan tinker --execute="
\$u = App\Models\User::where('profile','professional_caregiver')->first();
if (!\$u) { echo 'ERRO'; exit(1); }
echo \$u->createToken('test-curl')->plainTextToken;
" 2>/dev/null | tail -1)
  
  USER_ID=$(php artisan tinker --execute="
\$u = App\Models\User::where('profile','professional_caregiver')->first();
if (!\$u) { echo '0'; exit(1); }
echo \$u->id;
" 2>/dev/null | tail -1)
  
  if [ -z "$TOKEN" ] || [ "$TOKEN" = "ERRO" ] || [ -z "$USER_ID" ] || [ "$USER_ID" = "0" ]; then
    echo ""
    echo "ERRO: Nenhum cuidador profissional encontrado no banco."
    echo "Crie um usuário com profile=professional_caregiver ou passe manualmente:"
    echo "  TOKEN=seu_token USER_ID=id ./test-curl-formation-update.sh $BASE"
    echo ""
    exit 1
  fi
  echo "  User ID: $USER_ID"
  echo "  Token: ${TOKEN:0:20}..."
  echo ""
fi

# -----------------------------------------------------------------------------
# PASSO 1: GET antes (valor atual)
# -----------------------------------------------------------------------------
echo "1. GET /api/user - Valor ATUAL de formation_description"
echo "   ----------------------------------------"
RESP_ANTES=$(curl -s -w "\n%{http_code}" "$API/user" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

HTTP_ANTES=$(echo "$RESP_ANTES" | tail -1)
BODY_ANTES=$(echo "$RESP_ANTES" | sed '$d')

if [ "$HTTP_ANTES" != "200" ]; then
  echo "   FALHOU - HTTP $HTTP_ANTES"
  echo "   Resposta: ${BODY_ANTES:0:300}"
  exit 1
fi

VALOR_ANTES=$(echo "$BODY_ANTES" | grep -o '"formation_description":"[^"]*"' | head -1 | sed 's/"formation_description":"//;s/"$//')
echo "   HTTP 200 OK"
echo "   Valor atual: ${VALOR_ANTES:-(vazio)}"
echo ""

# -----------------------------------------------------------------------------
# PASSO 2: PUT - Atualizar formation_description
# -----------------------------------------------------------------------------
echo "2. PUT /api/users/$USER_ID - Enviando novo formation_description"
echo "   ----------------------------------------"
RESP_PUT=$(curl -s -w "\n%{http_code}" -X PUT "$API/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  -d "{\"formation_description\":\"$VALOR_TESTE\"}")

HTTP_PUT=$(echo "$RESP_PUT" | tail -1)
BODY_PUT=$(echo "$RESP_PUT" | sed '$d')

if [ "$HTTP_PUT" != "200" ]; then
  echo "   FALHOU - HTTP $HTTP_PUT"
  echo "   Resposta: $BODY_PUT"
  exit 1
fi

echo "   HTTP 200 OK"

# Verificar se formation_description está na resposta do PUT
if echo "$BODY_PUT" | grep -q '"formation_description"'; then
  VALOR_PUT=$(echo "$BODY_PUT" | grep -o '"formation_description":"[^"]*"' | head -1 | sed 's/"formation_description":"//;s/"$//')
  echo "   formation_description na resposta: SIM"
  echo "   Valor retornado: $VALOR_PUT"
else
  echo "   AVISO: formation_description NAO esta na resposta do PUT"
  echo "   Resposta (primeiros 400 chars): ${BODY_PUT:0:400}"
fi
echo ""

# -----------------------------------------------------------------------------
# PASSO 3: GET depois - Verificar se PERSISTIU no banco
# -----------------------------------------------------------------------------
echo "3. GET /api/user - Verificar se PERSISTIU"
echo "   ----------------------------------------"
RESP_DEPOIS=$(curl -s -w "\n%{http_code}" "$API/user" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

HTTP_DEPOIS=$(echo "$RESP_DEPOIS" | tail -1)
BODY_DEPOIS=$(echo "$RESP_DEPOIS" | sed '$d')

if [ "$HTTP_DEPOIS" != "200" ]; then
  echo "   FALHOU - HTTP $HTTP_DEPOIS"
  exit 1
fi

VALOR_DEPOIS=$(echo "$BODY_DEPOIS" | grep -o '"formation_description":"[^"]*"' | head -1 | sed 's/"formation_description":"//;s/"$//')
echo "   HTTP 200 OK"
echo "   Valor no banco: ${VALOR_DEPOIS:-(vazio)}"
echo ""

# -----------------------------------------------------------------------------
# RESULTADO FINAL
# -----------------------------------------------------------------------------
echo "=============================================="
if [ "$VALOR_DEPOIS" = "$VALOR_TESTE" ]; then
  echo "  RESULTADO: BACKEND OK"
  echo "   O endpoint PUT /api/users/{id} está salvando"
  echo "   formation_description corretamente."
  echo ""
  echo "   Se o app não mostra: problema no FRONTEND."
  echo "=============================================="
  exit 0
else
  echo "  RESULTADO: BACKEND COM PROBLEMA"
  echo "   Esperado: $VALOR_TESTE"
  echo "   Obtido:   ${VALOR_DEPOIS:-(vazio)}"
  echo ""
  echo "   Verifique:"
  echo "   - Coluna formation_description existe? (migration)"
  echo "   - Campo no fillable do Model User?"
  echo "   - Logs: storage/logs/laravel.log"
  echo "=============================================="
  exit 1
fi
