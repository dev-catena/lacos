#!/bin/bash
echo "🔍 TESTANDO API DE GRUPOS"
echo "========================"
echo ""

# Primeiro, vamos verificar se há um token de autenticação
# Mas vamos testar diretamente o que a API retorna

echo "1. Verificando arquivos de foto:"
ls -lh storage/app/public/groups/ 2>/dev/null | tail -5
echo ""

echo "2. Verificando link simbólico:"
ls -ld public/storage 2>/dev/null
echo ""

echo "3. Testando acesso HTTP direto:"
curl -I http://10.102.0.103:8000/storage/groups/yyTR90bXKMxgspM4Od0izSvwYXkSc7IVMudb2Jfh.jpg 2>&1 | head -3
echo ""

echo "4. Verificando permissões:"
stat -c "%a %n" storage/app/public/groups/ public/storage/groups/ 2>&1
echo ""

echo "✅ Teste concluído"
