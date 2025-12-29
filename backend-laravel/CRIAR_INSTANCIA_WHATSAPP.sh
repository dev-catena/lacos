#!/bin/bash

# Script para criar instância WhatsApp na Evolution API
# Este script cria a instância e mostra o QR Code

set -e

# Configurações (ajuste se necessário)
API_URL="${WHATSAPP_API_URL:-http://localhost:8080}"
API_KEY="${WHATSAPP_API_KEY}"
INSTANCE_NAME="${WHATSAPP_INSTANCE_NAME:-lacos-2fa}"
INTEGRATION="${WHATSAPP_INTEGRATION:-}"
PAIRING_NUMBER="${WHATSAPP_PAIRING_NUMBER:-}" # ex: 5531999999999 (somente números)

# Verificar se API_KEY foi fornecida
if [ -z "$API_KEY" ]; then
    echo "❌ API_KEY não definida!"
    echo ""
    echo "Defina a variável:"
    echo "   export WHATSAPP_API_KEY=sua_api_key_aqui"
    echo ""
    echo "Ou passe como argumento:"
    echo "   $0 sua_api_key_aqui"
    echo ""
    exit 1
fi

# Se passou API_KEY como argumento, usar
if [ -n "$1" ]; then
    API_KEY="$1"
fi

echo "💬 Criando instância WhatsApp..."
echo "   URL: $API_URL"
echo "   Instance: $INSTANCE_NAME"
if [ -n "$INTEGRATION" ]; then
    echo "   Integration: $INTEGRATION"
else
    echo "   Integration: (auto)"
fi
if [ -n "$PAIRING_NUMBER" ]; then
    echo "   Pairing (número): $PAIRING_NUMBER"
fi
echo ""

# Verificar se Evolution API está respondendo
echo "🔍 Verificando se Evolution API está respondendo..."
if curl -s --max-time 5 "$API_URL" > /dev/null 2>&1; then
    echo "✅ Evolution API está respondendo"
else
    echo "❌ Evolution API não está respondendo em $API_URL"
    echo ""
    echo "Verifique:"
    echo "   1. Container está rodando: docker ps | grep evolution"
    echo "   2. Porta está acessível: curl http://localhost:8080"
    echo "   3. Logs do container: docker logs evolution-api-lacos"
    exit 1
fi

echo ""

# Criar instância (Evolution API v2 exige informar "integration")
echo "📱 Criando instância WhatsApp..."

create_instance() {
  local integration="$1"
  curl -s --max-time 30 -X POST "$API_URL/instance/create" \
    -H "apikey: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"instanceName\": \"$INSTANCE_NAME\", \"token\": \"token-secreto\", \"qrcode\": true, \"integration\": \"$integration\"}"
}

try_integrations() {
  local integrations=("$@")
  local resp=""
  for integ in "${integrations[@]}"; do
    echo "   - Tentando integration=$integ" >&2
    resp="$(create_instance "$integ")" || true
    # Sucesso típico: contém instanceName ou created/success sem erro 400
    if echo "$resp" | grep -q "\"$INSTANCE_NAME\"" && ! echo "$resp" | grep -qi "\"status\"[[:space:]]*:[[:space:]]*400"; then
      echo "✅ Instância criada com integration=$integ" >&2
      echo "$resp" # IMPORTANTE: retornar apenas JSON no stdout
      return 0
    fi
    # Se der invalid integration, tenta próxima
    if echo "$resp" | grep -qi "Invalid integration"; then
      continue
    fi
    # Se já existe, vamos seguir com connect depois
    if echo "$resp" | grep -qi "already in use"; then
      echo "ℹ️  Instância já existe (name already in use). Vamos usar a existente." >&2
      echo "$resp"
      return 0
    fi
    # Outros erros: parar e mostrar resposta
    echo "$resp"
    return 0
  done
  echo "$resp"
  return 0
}

if [ -n "$INTEGRATION" ]; then
  RESPONSE="$(create_instance "$INTEGRATION")"
else
  # Lista de valores comuns (varia conforme build/versão)
  RESPONSE="$(try_integrations "WHATSAPP-BAILEYS" "BAILEYS" "whatsapp-baileys" "WHATSAPP" "WHATSAPP-WEB")"
fi

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar instância!"
    echo "   Verifique se a API_KEY está correta"
    echo "   Verifique logs: docker logs evolution-api-lacos"
    exit 1
fi

echo "📥 Resposta:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Verificar se foi criada com sucesso (ou já existe)
if echo "$RESPONSE" | grep -q "instanceName\|created\|success" || echo "$RESPONSE" | grep -qi "already in use"; then
    echo "✅ Instância criada com sucesso!"
    echo ""
    
    # Obter QR Code (em algumas versões o endpoint retorna apenas {"count":0} no início)
    echo "📱 Obtendo QR Code para conectar WhatsApp..."
    echo ""

    get_qr() {
      # ⚠️ Dependendo da versão/build da Evolution API, o "connect" pode variar.
      # Para evitar ficar preso em {"count":0}, tentamos alguns formatos:
      # - GET /instance/connect/:name (QR)
      # - GET /instance/connect/:name?number=... (pairing)
      # - POST /instance/connect/:name (com/sem body)

      local resp=""
      local best=""

      # 1) Tentar QR padrão (sem ?number) — funciona em muitas builds
      resp="$(curl -s --max-time 30 "$API_URL/instance/connect/$INSTANCE_NAME" -H "apikey: $API_KEY" 2>/dev/null || true)"
      best="$resp"
      if echo "$resp" | grep -Eqi '"pairingCode"|"code"|qrcode|base64'; then
        echo "$resp"
        return 0
      fi

      # 2) Se usuário quer pairing, tentar GET com ?number=
      if [ -n "$PAIRING_NUMBER" ]; then
        resp="$(curl -s --max-time 30 "$API_URL/instance/connect/$INSTANCE_NAME?number=$PAIRING_NUMBER" -H "apikey: $API_KEY" 2>/dev/null || true)"
        # Preferir essa resposta se ela for "melhor" que a anterior (ex: traz count, message etc.)
        if [ -n "$resp" ] && ! echo "$resp" | grep -qi "Cannot POST /instance/connect"; then
          best="$resp"
        fi
        if echo "$resp" | grep -Eqi '"pairingCode"|"code"|qrcode|base64'; then
          echo "$resp"
          return 0
        fi
      fi

      # 3) Fallback: algumas versões usam POST
      if [ -n "$PAIRING_NUMBER" ]; then
        resp="$(curl -s --max-time 30 -X POST "$API_URL/instance/connect/$INSTANCE_NAME" \
          -H "apikey: $API_KEY" \
          -H "Content-Type: application/json" \
          -d "{\"number\":\"$PAIRING_NUMBER\"}" 2>/dev/null || true)"
        # Se a build não suporta POST aqui, não deixar isso sobrescrever a saída (senão mascara {"count":0})
        if echo "$resp" | grep -qi "Cannot POST /instance/connect"; then
          resp="$best"
        elif [ -n "$resp" ]; then
          best="$resp"
        fi
        if echo "$resp" | grep -Eqi '"pairingCode"|"code"|qrcode|base64'; then
          echo "$resp"
          return 0
        fi
      else
        resp="$(curl -s --max-time 30 -X POST "$API_URL/instance/connect/$INSTANCE_NAME" \
          -H "apikey: $API_KEY" 2>/dev/null || true)"
        if echo "$resp" | grep -qi "Cannot POST /instance/connect"; then
          resp="$best"
        elif [ -n "$resp" ]; then
          best="$resp"
        fi
        if echo "$resp" | grep -Eqi '"pairingCode"|"code"|qrcode|base64'; then
          echo "$resp"
          return 0
        fi
      fi

      echo "${best:-$resp}"
    }

    QR_RESPONSE=""
    for i in $(seq 1 25); do
      QR_RESPONSE="$(get_qr)" || true

      # Se a resposta contém QR ("code") ou pairingCode, paramos
      if echo "$QR_RESPONSE" | grep -Eqi '"pairingCode"|"code"|qrcode|base64'; then
        break
      fi

      # Caso comum: {"count":0}
      echo "   - QR ainda não disponível (tentativa $i/25). Aguardando..." >&2
      sleep 2
    done

    echo "📥 Resposta QR Code:"
    echo "$QR_RESPONSE" | jq . 2>/dev/null || echo "$QR_RESPONSE"
    echo ""

    if echo "$QR_RESPONSE" | grep -qi "\"pairingCode\""; then
      echo "✅ Pairing code gerado!"
      echo "📱 No WhatsApp do celular:"
      echo "   Configurações → Aparelhos conectados → Conectar um aparelho → Vincular com número de telefone"
      echo "   Digite o código exibido na resposta acima."
      echo ""
    fi

    echo "📝 Se você não viu o QR acima (base64/URL), rode manualmente em loop:"
    if [ -n "$PAIRING_NUMBER" ]; then
      echo "   for i in {1..30}; do curl -s \"$API_URL/instance/connect/$INSTANCE_NAME?number=$PAIRING_NUMBER\" -H \"apikey: $API_KEY\"; echo; sleep 2; done"
      echo ""
      echo "   # Fallback (algumas versões usam POST):"
      echo "   for i in {1..30}; do curl -s -X POST \"$API_URL/instance/connect/$INSTANCE_NAME\" -H \"apikey: $API_KEY\" -H \"Content-Type: application/json\" -d '{\"number\":\"$PAIRING_NUMBER\"}'; echo; sleep 2; done"
    else
      echo "   for i in {1..30}; do curl -s $API_URL/instance/connect/$INSTANCE_NAME -H \"apikey: $API_KEY\"; echo; sleep 2; done"
      echo ""
      echo "   # Fallback (algumas versões usam POST):"
      echo "   for i in {1..30}; do curl -s -X POST \"$API_URL/instance/connect/$INSTANCE_NAME\" -H \"apikey: $API_KEY\"; echo; sleep 2; done"
    fi
    echo ""
    if echo "$QR_RESPONSE" | grep -q '{"count":0}' 2>/dev/null || echo "$QR_RESPONSE" | grep -q '"count"[[:space:]]*:[[:space:]]*0' 2>/dev/null; then
      echo "⚠️  Ainda retornou {\"count\":0} após as tentativas."
      echo "   Próximos passos rápidos (no servidor):"
      echo "   1) Ver logs: docker logs -f evolution-api-lacos | egrep -i \"qr|pair|connect|baileys|warn|error\""
      echo "   2) Listar instâncias:"
      echo "      curl -s \"$API_URL/instance/fetchInstances\" -H \"apikey: $API_KEY\" | jq 'map({name,connectionStatus,number,integration})'"
      echo "   3) Descobrir endpoints disponíveis (Swagger/Docs), se existir:"
      echo "      curl -s \"$API_URL/docs\" | head"
      echo "      curl -s \"$API_URL/swagger-json\" | jq '.paths | keys[] | select(test(\"instance\"))' 2>/dev/null | head"
      echo ""
      echo "   Se a instância estiver 'travada', pode ser necessário apagar e recriar a instância/sessão (endpoint varia por versão)."
      echo ""
    fi
    echo "📱 Para escanear:"
    echo "   1. Abra o WhatsApp no celular"
    echo "   2. Vá em Configurações > Aparelhos conectados"
    echo "   3. Toque em 'Conectar um aparelho'"
    echo "   4. Escaneie o QR Code exibido"
else
    echo "⚠️  Instância pode não ter sido criada"
    echo "   Verifique a resposta acima"
    echo ""
    echo "   Para verificar instâncias existentes:"
    echo "   curl $API_URL/instance/fetchInstances -H \"apikey: $API_KEY\""
fi

echo ""
echo "📝 Próximos passos:"
echo "   1. Escanear QR Code com WhatsApp"
echo "   2. Aguardar conexão (pode levar alguns segundos)"
echo "   3. Verificar status:"
echo "      curl $API_URL/instance/fetchInstances -H \"apikey: $API_KEY\""
echo ""

