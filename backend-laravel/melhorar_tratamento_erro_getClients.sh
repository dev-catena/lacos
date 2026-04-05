#!/bin/bash

echo "🔧 Melhorando tratamento de erros no método getClients..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# 1. Fazer backup
echo "📦 Criando backup..."
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# 2. Verificar se método existe
if ! grep -q "public function getClients" "$CONTROLLER_FILE"; then
    echo "❌ Método getClients não encontrado!"
    exit 1
fi

# 3. Verificar se precisa adicionar use Schema
if ! grep -q "use Illuminate\\Support\\Facades\\Schema;" "$CONTROLLER_FILE"; then
    echo "📝 Adicionando use Schema..."
    sudo sed -i "/^use Illuminate\\Support\\Facades\\Log;/a use Illuminate\\Support\\Facades\\Schema;" "$CONTROLLER_FILE"
    echo "✅ Use Schema adicionado"
fi

# 4. Substituir o bloco catch para melhor tratamento de erros
echo "📝 Melhorando tratamento de erros..."

# Criar versão melhorada do catch
cat > /tmp/improved_catch.txt << 'CATCH_EOF'
        } catch (\Illuminate\Database\QueryException $e) {
            // Erro de banco de dados
            Log::error('Erro de banco de dados em getClients: ' . $e->getMessage(), [
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar clientes no banco de dados',
                'error' => config('app.debug') ? $e->getMessage() : 'Erro interno',
                'errors' => []
            ], 500);

        } catch (\Exception $e) {
CATCH_EOF

# Encontrar a linha do catch atual e substituir
CATCH_LINE=$(grep -n "} catch (\\\\Exception" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)

if [ -n "$CATCH_LINE" ]; then
    # Substituir o catch genérico pelo melhorado
    # Primeiro, remover o catch antigo até o final do método
    END_METHOD_LINE=$(grep -n "^    }$" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)
    
    # Criar arquivo temporário com o catch melhorado
    head -n $((CATCH_LINE - 1)) "$CONTROLLER_FILE" > /tmp/controller_part1.txt
    cat /tmp/improved_catch.txt >> /tmp/controller_part1.txt
    
    # Adicionar o resto do catch original (apenas a parte do Log e return)
    sed -n "${CATCH_LINE},${END_METHOD_LINE}p" "$CONTROLLER_FILE" | grep -A 20 "Log::error\|return response" >> /tmp/controller_part1.txt
    tail -n +$((END_METHOD_LINE + 1)) "$CONTROLLER_FILE" >> /tmp/controller_part1.txt
    
    sudo cp /tmp/controller_part1.txt "$CONTROLLER_FILE"
    rm /tmp/controller_part1.txt /tmp/improved_catch.txt
    
    echo "✅ Tratamento de erros melhorado"
else
    echo "⚠️ Não foi possível localizar o bloco catch para melhorar"
fi
echo ""

# 5. Verificar sintaxe
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe:"
    php -l "$CONTROLLER_FILE"
    echo ""
    echo "🔄 Restaurando backup..."
    sudo cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi
echo ""

# 6. Limpar cache
echo "🧹 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Melhorias aplicadas!"
echo ""
echo "💡 Agora verifique os logs do Laravel para ver o erro específico:"
echo "   tail -50 storage/logs/laravel.log | grep getClients"


