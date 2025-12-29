#!/bin/bash

# Script simples para adicionar verificação no PDFService.php

cd /var/www/lacos-backend || exit 1

echo "🔧 Adicionando verificação no PDFService.php..."
echo ""

SERVICE_FILE="app/Services/PDFService.php"

# Criar backup
BACKUP_FILE="${SERVICE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$SERVICE_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Adicionar verificação após Storage::put() no método generateCertificatePDF
# Procurar pela linha que tem Storage::put e return $path seguidos
# e inserir a verificação entre eles

sed -i '/generateCertificatePDF/,/^    }/{
    /Storage::put.*pdf->output.*);/a\
\
            // Verificar se arquivo foi criado\
            $fullPath = storage_path('\''app/'\'' . $path);\
            if (!file_exists($fullPath)) {\
                Log::error('\''Erro: PDF não foi criado após Storage::put()'\'', [\
                    '\''path'\'' => $path,\
                    '\''fullPath'\'' => $fullPath,\
                    '\''directory_exists'\'' => is_dir(dirname($fullPath)),\
                    '\''directory_writable'\'' => is_writable(dirname($fullPath)),\
                ]);\
                throw new \\Exception('\''Erro ao salvar PDF: arquivo não foi criado em '\'' . $fullPath);\
            }\
\
            Log::info('\''PDF criado com sucesso'\'', [\
                '\''path'\'' => $path,\
                '\''fullPath'\'' => $fullPath,\
                '\''size'\'' => filesize($fullPath),\
            ]);
}' "$SERVICE_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Verificação adicionada!"
    echo ""
    
    # Verificar sintaxe PHP
    echo "🔍 Verificando sintaxe PHP..."
    if php -l "$SERVICE_FILE" > /dev/null 2>&1; then
        echo "✅ Sintaxe PHP válida!"
        echo ""
        echo "✅ Correção aplicada com sucesso!"
        echo ""
        echo "🧪 Teste gerar um atestado novamente"
        echo "   Os logs mostrarão se o PDF está sendo criado"
    else
        echo "❌ Erro de sintaxe PHP!"
        php -l "$SERVICE_FILE"
        echo "🔄 Restaurando backup..."
        cp "$BACKUP_FILE" "$SERVICE_FILE"
        exit 1
    fi
else
    echo "❌ Erro ao aplicar correção"
    exit 1
fi

