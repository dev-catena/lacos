# Diagnóstico: Horários da Agenda Não Aparecem para o Cuidador

## Problema
A médica disponibilizou dois horários para o dia 19/12, mas eles não aparecem para o cuidador marcar.

## Possíveis Causas

### 1. **Backend Filtrando Datas Passadas**
O método `getAvailability` no backend pode estar filtrando datas passadas. Se hoje é 20/12/2024 ou depois, o dia 19/12/2024 seria considerado passado e não seria retornado.

**Solução**: Verificar se o backend está filtrando datas passadas no método `getAvailability`.

### 2. **Ano Incorreto na Data**
A agenda pode ter sido salva com o ano errado (2024 ao invés de 2025, ou vice-versa).

**Verificação**: Executar o script de diagnóstico:
```bash
./scripts/VERIFICAR_AGENDA_MEDICA.sh dudarubackgoncalves@gmail.com
```

### 3. **Backend Não Retornando Dados Corretamente**
O endpoint `/api/doctors/{doctorId}/availability` pode não estar retornando os dados salvos corretamente.

**Verificação**: Os logs adicionados no frontend vão mostrar exatamente o que o backend está retornando.

### 4. **Problema de Formato de Data**
A data pode estar sendo salva ou retornada em formato diferente do esperado.

**Verificação**: Conferir se as datas estão no formato `YYYY-MM-DD` (ex: `2024-12-19` ou `2025-12-19`).

## Como Diagnosticar

### Passo 1: Verificar Logs do Console
Quando o cuidador tentar agendar uma consulta e selecionar o médico, os logs no console do React Native mostrarão:

- `📞 loadDoctorAvailability - Buscando agenda para médico ID: X`
- `📥 loadDoctorAvailability - Resposta completa do backend: {...}`
- `✅ loadDoctorAvailability - Resposta válida recebida: {...}`

Esses logs vão mostrar exatamente o que o backend está retornando.

### Passo 2: Verificar Banco de Dados
Execute o script de diagnóstico:
```bash
cd /home/darley/lacos
./scripts/VERIFICAR_AGENDA_MEDICA.sh dudarubackgoncalves@gmail.com
```

Este script vai:
1. Buscar o ID do médico pelo email
2. Verificar os dados salvos na tabela `doctor_availability`
3. Verificar especificamente a data 19/12 (tanto 2024 quanto 2025)
4. Mostrar todos os horários cadastrados

### Passo 3: Verificar Backend
Conectar ao servidor e verificar:

```bash
ssh darley@192.168.0.20
cd /var/www/lacos-backend
```

Verificar se o método `getAvailability` existe e como ele busca os dados:
```bash
grep -A 50 "getAvailability" app/Http/Controllers/Api/DoctorController.php
```

Verificar se há filtro de datas passadas que possa estar removendo o dia 19/12.

## Soluções

### Solução 1: Corrigir Filtro de Datas no Backend
Se o backend estiver filtrando datas passadas, modificar o método `getAvailability` para incluir todas as datas futuras (ou pelo menos as próximas semanas), não apenas as datas a partir de hoje.

### Solução 2: Verificar Ano da Data
Se a agenda foi salva com ano errado, pode ser necessário:
1. Verificar qual ano foi usado ao salvar
2. Corrigir os dados no banco se necessário
3. Ou ajustar a lógica de salvamento/carregamento

### Solução 3: Verificar Formato de Resposta
Garantir que o backend retorna os dados no formato esperado:
```json
{
  "success": true,
  "data": {
    "availableDays": ["2024-12-19", "2024-12-20"],
    "daySchedules": {
      "2024-12-19": ["08:00", "14:00"],
      "2024-12-20": ["09:00", "15:00"]
    }
  }
}
```

## Próximos Passos

1. ✅ Logs detalhados adicionados no frontend
2. ⏳ Executar script de diagnóstico para verificar banco de dados
3. ⏳ Verificar logs do console quando cuidador tentar agendar
4. ⏳ Verificar implementação do backend se necessário

## Arquivos Modificados

- `src/screens/Groups/AddAppointmentScreen.js` - Logs detalhados adicionados
- `scripts/VERIFICAR_AGENDA_MEDICA.sh` - Script de diagnóstico criado


