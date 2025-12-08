#!/bin/bash

# Script para geocodificar farmácias de Minas Gerais em lotes
# Uso: ./geocodificar_farmacias_mg.sh

echo "═══════════════════════════════════════════════════════════"
echo "🌍 GEOCODIFICAÇÃO DE FARMÁCIAS - MINAS GERAIS"
echo "═══════════════════════════════════════════════════════════"
echo ""

cd /var/www/lacos-backend

# Verificar quantas farmácias de MG precisam ser geocodificadas
TOTAL=$(php artisan tinker --execute="echo App\Models\PopularPharmacy::where('state', 'MG')->where(function(\$q) { \$q->whereNull('latitude')->orWhereNull('longitude'); })->where('is_active', true)->count();" 2>&1 | grep -E '^[0-9]+$' | head -1)

if [ -z "$TOTAL" ] || [ "$TOTAL" = "0" ]; then
    echo "✅ Todas as farmácias de MG já têm coordenadas!"
    exit 0
fi

echo "📊 Farmácias de MG sem coordenadas: $TOTAL"
echo ""

# Processar em lotes de 100
LOTE=100
LOTE_ATUAL=1
TOTAL_LOTES=$(( ($TOTAL + $LOTE - 1) / $LOTE ))

echo "🔄 Processando em lotes de $LOTE farmácias..."
echo "📦 Total de lotes: $TOTAL_LOTES"
echo ""

while [ $LOTE_ATUAL -le $TOTAL_LOTES ]; do
    echo "═══════════════════════════════════════════════════════════"
    echo "📦 LOTE $LOTE_ATUAL de $TOTAL_LOTES"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    
    php geocodificar_farmacias.php MG $LOTE
    
    echo ""
    echo "⏸️  Aguardando 5 segundos antes do próximo lote..."
    sleep 5
    
    LOTE_ATUAL=$((LOTE_ATUAL + 1))
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ PROCESSAMENTO CONCLUÍDO!"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Mostrar estatísticas finais
php artisan tinker --execute="
\$total = App\Models\PopularPharmacy::where('state', 'MG')->where('is_active', true)->count();
\$comCoords = App\Models\PopularPharmacy::where('state', 'MG')->whereNotNull('latitude')->whereNotNull('longitude')->where('is_active', true)->count();
\$semCoords = \$total - \$comCoords;
\$percent = \$total > 0 ? round((\$comCoords / \$total) * 100, 1) : 0;
echo \"📊 Estatísticas finais de MG:\n\";
echo \"   Total: {\$total}\n\";
echo \"   Com coordenadas: {\$comCoords} ({\$percent}%)\n\";
echo \"   Sem coordenadas: {\$semCoords}\n\";
" 2>&1 | grep -A 5 "Estatísticas"






