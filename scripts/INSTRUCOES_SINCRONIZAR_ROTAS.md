# 📋 Instruções para Sincronizar Rotas do Servidor

## Método Automático

Execute o script que tenta baixar e sincronizar automaticamente:

```bash
./scripts/SINCRONIZAR_ROTAS_API.sh
```

## Método Manual

Se a autenticação SSH automática não funcionar:

### Passo 1: Baixar o arquivo do servidor

```bash
# Opção 1: Usando SCP
scp -P 63022 darley@10.102.0.103:/var/www/lacos-backend/routes/api.php /tmp/api_servidor.php

# Opção 2: Usando SSH
ssh -p 63022 darley@10.102.0.103 'cat /var/www/lacos-backend/routes/api.php' > /tmp/api_servidor.php
```

### Passo 2: Executar o script de sincronização

```bash
php scripts/SINCRONIZAR_ROTAS_COMPLETO.php
```

O script irá:
- ✅ Identificar rotas comentadas no local que estão ativas no servidor (e descomentá-las)
- ✅ Identificar rotas completamente faltantes (e adicioná-las)
- ✅ Criar um backup do arquivo local antes de modificar
- ✅ Mostrar um relatório das mudanças

## O que o script faz

1. **Compara** o arquivo local com o do servidor
2. **Identifica** rotas comentadas que devem ser ativadas
3. **Identifica** rotas completamente faltantes
4. **Cria backup** do arquivo local
5. **Aplica mudanças**:
   - Descomenta rotas que estavam comentadas
   - Adiciona rotas completamente faltantes

## Exemplo de saída

```
📊 Analisando arquivos...
  Local: 244 linhas
  Servidor: 250 linhas

📋 Estatísticas:
  Rotas ativas no servidor: 85
  Rotas ativas no local: 80
  Rotas comentadas no local: 5

🔓 Rotas comentadas que devem ser ativadas: 3
  - get /doctors -> DoctorController::class (linha 181)
  - get /caregivers -> CaregiverController::class (linha 203)
  - get /messages/conversation/{userId} -> MessageController::class (linha 210)

➕ Rotas completamente faltantes: 2
  - post /vital-signs -> VitalSignController::class
  - get /consultations -> ConsultationController::class

✅ Backup criado: routes/api.php.backup_20260122_014500
✅ Descomentada: /doctors
✅ Descomentada: /caregivers
✅ Descomentada: /messages/conversation/{userId}
✅ Adicionadas 2 rotas faltantes
✅ Arquivo atualizado com sucesso!
```





