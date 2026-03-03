# 🖥️ Como Importar Medicamentos no Servidor

## ⚠️ Importante

A importação **DEVE ser feita no servidor** (192.168.0.20), não localmente. O banco de dados está no servidor.

## 📋 Passo a Passo

### 1. Copiar Arquivo CSV para o Servidor

```bash
# Do seu computador local
scp scripts/DADOS_ABERTOS_MEDICAMENTOS.csv usuario@192.168.0.20:/var/www/lacos-backend/
```

**Substitua `usuario` pelo seu usuário SSH no servidor.**

### 2. Conectar ao Servidor

```bash
ssh usuario@192.168.0.20
```

### 3. Executar Script no Servidor

```bash
cd /var/www/lacos-backend

# Copiar script para o servidor (se ainda não estiver lá)
# Ou executar diretamente:

# Verificar se migration existe
php artisan migrate:status | grep medication_catalog

# Se não existir, executar migration
php artisan migrate --path=database/migrations/2024_12_20_000001_create_medication_catalog_table.php

# Importar CSV
php artisan medications:import DADOS_ABERTOS_MEDICAMENTOS.csv --chunk=1000
```

### 4. Verificar Importação

```bash
# Estatísticas
php artisan tinker --execute="
    \$total = DB::table('medication_catalog')->count();
    \$active = DB::table('medication_catalog')->where('is_active', true)->count();
    echo 'Total: ' . \$total . PHP_EOL;
    echo 'Ativos: ' . \$active . PHP_EOL;
"

# Testar API
curl "http://192.168.0.20/api/medications/search?q=paracetamol&limit=5"
```

## 🔄 Alternativa: Script Automatizado

Se você copiar o script `IMPORTAR_MEDICAMENTOS_ANVISA_SERVIDOR.sh` para o servidor:

```bash
# No servidor
chmod +x IMPORTAR_MEDICAMENTOS_ANVISA_SERVIDOR.sh
./IMPORTAR_MEDICAMENTOS_ANVISA_SERVIDOR.sh
```

## 📝 Checklist

- [ ] CSV copiado para o servidor
- [ ] Conectado ao servidor via SSH
- [ ] Migration executada
- [ ] CSV importado
- [ ] Estatísticas verificadas
- [ ] API testada

## ⚠️ Problemas Comuns

### Erro: "Could not open input file: artisan"
**Causa:** Script executado localmente ao invés do servidor
**Solução:** Execute no servidor via SSH

### Erro: "Arquivo não encontrado"
**Causa:** CSV não foi copiado para o servidor
**Solução:** Use `scp` para copiar o arquivo

### Erro: "Migration não encontrada"
**Causa:** Arquivos não foram copiados para o servidor
**Solução:** Copie os arquivos do backend para o servidor

## 🚀 Comandos Rápidos

```bash
# 1. Copiar CSV
scp scripts/DADOS_ABERTOS_MEDICAMENTOS.csv usuario@192.168.0.20:/var/www/lacos-backend/

# 2. Conectar
ssh usuario@192.168.0.20

# 3. Importar
cd /var/www/lacos-backend
php artisan medications:import DADOS_ABERTOS_MEDICAMENTOS.csv --chunk=1000
```







