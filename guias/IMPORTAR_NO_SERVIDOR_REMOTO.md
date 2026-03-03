# 🖥️ Como Importar Medicamentos no Servidor Remoto

## ✅ Script Automatizado Criado

Criei um script que faz tudo automaticamente usando `sshpass`:

```bash
./scripts/IMPORTAR_MEDICAMENTOS_REMOTO.sh
```

Este script:
1. ✅ Copia o CSV para `/tmp` no servidor
2. ✅ Conecta ao servidor via SSH
3. ✅ Executa a migration (se necessário)
4. ✅ Importa os medicamentos
5. ✅ Mostra estatísticas
6. ✅ Limpa arquivo temporário

## 📋 Passo a Passo Completo

### 1. Instalar sshpass (se necessário)

```bash
sudo apt-get install sshpass
```

### 2. Copiar Arquivos do Backend (Primeira Vez)

Se for a primeira importação, você precisa copiar os arquivos do backend:

```bash
./scripts/COPIAR_ARQUIVOS_BACKEND_SERVIDOR.sh
```

Este script copia:
- Migration
- Model
- Controller
- Comando Artisan

### 3. Executar Importação

```bash
./scripts/IMPORTAR_MEDICAMENTOS_REMOTO.sh
```

## 🔧 Configurações do Servidor

O script está configurado com:
- **Host:** 192.168.0.20
- **Porta:** 63022
- **Usuário:** darley
- **Pasta temporária:** /tmp
- **Backend:** /var/www/lacos-backend

## 📝 O que o Script Faz

1. **Copia CSV para /tmp:**
   ```bash
   scp scripts/DADOS_ABERTOS_MEDICAMENTOS.csv darley@192.168.0.20:/tmp/
   ```

2. **Conecta ao servidor e:**
   - Verifica se migration existe
   - Executa migration se necessário
   - Importa CSV usando comando Artisan
   - Mostra estatísticas
   - Limpa arquivo temporário

## ⚠️ Primeira Vez

Na primeira vez, você precisa:

1. **Copiar arquivos do backend:**
   ```bash
   ./scripts/COPIAR_ARQUIVOS_BACKEND_SERVIDOR.sh
   ```

2. **Adicionar rotas manualmente** (se necessário):
   Edite `routes/api.php` no servidor e adicione:
   ```php
   use App\Http\Controllers\Api\MedicationCatalogController;
   
   Route::get('/medications/search', [MedicationCatalogController::class, 'search']);
   Route::get('/medications/info', [MedicationCatalogController::class, 'getInfo']);
   Route::get('/medications/stats', [MedicationCatalogController::class, 'stats']);
   ```

3. **Executar importação:**
   ```bash
   ./scripts/IMPORTAR_MEDICAMENTOS_REMOTO.sh
   ```

## 🧪 Testar Após Importação

```bash
# Estatísticas
curl "http://192.168.0.20/api/medications/stats"

# Buscar medicamentos
curl "http://192.168.0.20/api/medications/search?q=paracetamol&limit=5"
```

## 🔍 Verificar no Servidor

Se quiser verificar manualmente no servidor:

```bash
ssh -p 63022 darley@192.168.0.20
cd /var/www/lacos-backend

# Estatísticas
php artisan tinker --execute="
    \$total = DB::table('medication_catalog')->count();
    \$active = DB::table('medication_catalog')->where('is_active', true)->count();
    echo 'Total: ' . \$total . PHP_EOL;
    echo 'Ativos: ' . \$active . PHP_EOL;
"
```

## ✅ Checklist

- [ ] sshpass instalado
- [ ] Arquivos do backend copiados (primeira vez)
- [ ] Rotas adicionadas (primeira vez)
- [ ] CSV importado
- [ ] Estatísticas verificadas
- [ ] API testada

