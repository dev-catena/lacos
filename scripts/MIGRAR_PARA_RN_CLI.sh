#!/bin/bash

# Script para migrar de Expo para React Native CLI puro

set -e

echo "🚀 MIGRAÇÃO PARA REACT NATIVE CLI"
echo "=================================="
echo ""
echo "Este script vai:"
echo "  1. Criar novo projeto React Native CLI"
echo "  2. Copiar código do projeto atual"
echo "  3. Instalar dependências"
echo "  4. Preparar para desenvolvimento local"
echo ""

read -p "Continuar? (s/n) [s]: " CONTINUAR
CONTINUAR=${CONTINUAR:-s}

if [ "$CONTINUAR" != "s" ]; then
    echo "Cancelado."
    exit 0
fi

PROJETO_ATUAL="/home/darley/lacos"
NOVO_PROJETO="/home/darley/lacos-rn-cli"

echo ""
echo "📂 Projeto atual: $PROJETO_ATUAL"
echo "📂 Novo projeto: $NOVO_PROJETO"
echo ""

# 1. Verificar se React Native CLI está instalado
echo "1️⃣ Verificando React Native CLI..."
if ! command -v react-native &> /dev/null; then
    echo "   Instalando React Native CLI..."
    npm install -g react-native-cli
fi
echo "✅ React Native CLI OK"
echo ""

# 2. Criar novo projeto
echo "2️⃣ Criando novo projeto React Native CLI..."
if [ -d "$NOVO_PROJETO" ]; then
    read -p "   Diretório já existe. Sobrescrever? (s/n) [n]: " SOBRESCREVER
    SOBRESCREVER=${SOBRESCREVER:-n}
    if [ "$SOBRESCREVER" = "s" ]; then
        rm -rf "$NOVO_PROJETO"
    else
        echo "   Cancelado."
        exit 0
    fi
fi

npx react-native@latest init LacosApp --directory "$NOVO_PROJETO" --skip-install
echo "✅ Projeto criado"
echo ""

# 3. Copiar código
echo "3️⃣ Copiando código do projeto atual..."
if [ -d "$PROJETO_ATUAL/src" ]; then
    cp -r "$PROJETO_ATUAL/src" "$NOVO_PROJETO/src"
    echo "✅ Código copiado"
else
    echo "⚠️  Diretório src não encontrado"
fi

# Copiar assets
if [ -d "$PROJETO_ATUAL/assets" ]; then
    cp -r "$PROJETO_ATUAL/assets" "$NOVO_PROJETO/assets"
    echo "✅ Assets copiados"
fi

# Copiar outros arquivos importantes
if [ -f "$PROJETO_ATUAL/app.json" ]; then
    cp "$PROJETO_ATUAL/app.json" "$NOVO_PROJETO/app.json.backup"
fi
echo ""

# 4. Instalar dependências
echo "4️⃣ Instalando dependências..."
cd "$NOVO_PROJETO"
npm install
echo "✅ Dependências instaladas"
echo ""

# 5. Instruções
echo "═══════════════════════════════════════════════════════════"
echo "✅ MIGRAÇÃO CONCLUÍDA!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Ajustar dependências no package.json"
echo "   cd $NOVO_PROJETO"
echo "   nano package.json"
echo ""
echo "2. Ajustar imports do Expo para React Native"
echo "   - Remover imports do Expo que não existem no RN CLI"
echo "   - Usar componentes nativos do React Native"
echo ""
echo "3. Rodar no Android:"
echo "   cd $NOVO_PROJETO"
echo "   npx react-native run-android"
echo ""
echo "4. Rodar no iOS:"
echo "   npx react-native run-ios"
echo ""
echo "5. Iniciar Metro (local, sem problemas de rede):"
echo "   npx react-native start"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

