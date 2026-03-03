#!/bin/bash

# Script para substituir referências ao IP antigo (193.203.182.22) por 192.168.0.20

echo "🔄 Substituindo referências ao servidor..."
echo "   De: 193.203.182.22"
echo "   Para: 192.168.0.20"
echo ""

# Contar arquivos que serão modificados
COUNT=$(grep -r "193\.203\.182\.22" --include="*.js" --include="*.jsx" --include="*.php" --include="*.sh" --include="*.md" --include="*.py" . 2>/dev/null | grep -v node_modules | grep -v vendor | grep -v ".git" | wc -l)

echo "📊 Encontrados aproximadamente $COUNT arquivos com referências"
echo ""

# Fazer backup
BACKUP_DIR="backups/substituicao_servidor_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "💾 Criando backup em: $BACKUP_DIR"
echo ""

# Substituir em arquivos JavaScript/JSX
echo "📝 Substituindo em arquivos .js e .jsx..."
find . -type f \( -name "*.js" -o -name "*.jsx" \) ! -path "*/node_modules/*" ! -path "*/.git/*" -exec sed -i.bak "s/193\.203\.182\.22/192.168.0.20/g" {} \; 2>/dev/null
echo "   ✅ Arquivos .js/.jsx atualizados"

# Substituir em arquivos PHP
echo "📝 Substituindo em arquivos .php..."
find . -type f -name "*.php" ! -path "*/vendor/*" ! -path "*/.git/*" -exec sed -i.bak "s/193\.203\.182\.22/192.168.0.20/g" {} \; 2>/dev/null
echo "   ✅ Arquivos .php atualizados"

# Substituir em arquivos Shell
echo "📝 Substituindo em arquivos .sh..."
find . -type f -name "*.sh" ! -path "*/.git/*" -exec sed -i.bak "s/193\.203\.182\.22/192.168.0.20/g" {} \; 2>/dev/null
echo "   ✅ Arquivos .sh atualizados"

# Substituir em arquivos Markdown
echo "📝 Substituindo em arquivos .md..."
find . -type f -name "*.md" ! -path "*/.git/*" -exec sed -i.bak "s/193\.203\.182\.22/192.168.0.20/g" {} \; 2>/dev/null
echo "   ✅ Arquivos .md atualizados"

# Substituir em arquivos Python
echo "📝 Substituindo em arquivos .py..."
find . -type f -name "*.py" ! -path "*/.git/*" ! -path "*/venv/*" -exec sed -i.bak "s/193\.203\.182\.22/192.168.0.20/g" {} \; 2>/dev/null
echo "   ✅ Arquivos .py atualizados"

# Mover backups
echo ""
echo "📦 Movendo backups para: $BACKUP_DIR"
find . -name "*.bak" -exec mv {} "$BACKUP_DIR/" \; 2>/dev/null
echo "   ✅ Backups movidos"

# Verificar se ainda há referências
REMAINING=$(grep -r "193\.203\.182\.22" --include="*.js" --include="*.jsx" --include="*.php" --include="*.sh" --include="*.md" --include="*.py" . 2>/dev/null | grep -v node_modules | grep -v vendor | grep -v ".git" | grep -v "$BACKUP_DIR" | wc -l)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$REMAINING" -eq 0 ]; then
    echo "✅ Substituição concluída! Nenhuma referência restante."
else
    echo "⚠️  Ainda restam $REMAINING referências (podem ser em comentários ou strings específicas)"
    echo "   Verifique manualmente se necessário"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"










