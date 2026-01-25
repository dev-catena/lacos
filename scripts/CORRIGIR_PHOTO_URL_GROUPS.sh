#!/bin/bash

echo "🔧 Corrigindo photo_url de grupos para usar asset() em vez de url()..."
echo ""

cd /var/www/lacos-backend || exit 1

# Arquivos a corrigir
MODEL_FILE="app/Models/Group.php"
CONTROLLER_FILE="app/Http/Controllers/Api/GroupController.php"

# Fazer backups
BACKUP_MODEL="${MODEL_FILE}.bak.$(date +%Y%m%d_%H%M%S)"
BACKUP_CONTROLLER="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$MODEL_FILE" "$BACKUP_MODEL"
sudo cp "$CONTROLLER_FILE" "$BACKUP_CONTROLLER"

echo "✅ Backups criados:"
echo "   - $BACKUP_MODEL"
echo "   - $BACKUP_CONTROLLER"
echo ""

# Corrigir modelo Group.php
echo "📝 Corrigindo modelo Group.php..."
if grep -q "return url('storage/" "$MODEL_FILE"; then
    sudo sed -i "s/return url('storage\//return asset('storage\//g" "$MODEL_FILE"
    echo "✅ Modelo Group.php corrigido"
else
    echo "⚠️ Não encontrou url('storage/ no modelo"
fi
echo ""

# Corrigir GroupController.php - todas as ocorrências
echo "📝 Corrigindo GroupController.php..."
if grep -q "url('storage/" "$CONTROLLER_FILE" || grep -q 'url("storage/' "$CONTROLLER_FILE"; then
    # Substituir url('storage/ por asset('storage/
    sudo sed -i "s/url('storage\//asset('storage\//g" "$CONTROLLER_FILE"
    # Substituir url("storage/ por asset("storage/
    sudo sed -i 's/url("storage\//asset("storage\//g' "$CONTROLLER_FILE"
    echo "✅ GroupController.php corrigido"
else
    echo "⚠️ Não encontrou url('storage/ ou url(\"storage/ no controller"
fi
echo ""

# Verificar se há outras ocorrências
echo "🔍 Verificando outras ocorrências..."
REMAINING=$(grep -n "url('storage/" "$CONTROLLER_FILE" "$MODEL_FILE" 2>/dev/null | wc -l)
if [ "$REMAINING" -gt 0 ]; then
    echo "⚠️ Ainda há $REMAINING ocorrência(s) de url('storage/ nos arquivos"
    grep -n "url('storage/" "$CONTROLLER_FILE" "$MODEL_FILE" 2>/dev/null
else
    echo "✅ Todas as ocorrências foram corrigidas"
fi
echo ""

echo "🎉 Correção concluída!"
echo ""
echo "📋 Resumo das mudanças:"
echo "   - Modelo Group: url() → asset()"
echo "   - GroupController: url() → asset()"
echo ""
echo "🔄 Reinicie o servidor Laravel se necessário:"
echo "   sudo systemctl restart php8.2-fpm"
echo "   sudo systemctl restart nginx"

