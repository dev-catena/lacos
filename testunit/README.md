# 🧪 Testes Unitários e Funcionais

Este diretório contém scripts de teste para validar funcionalidades do sistema.

## 📦 Scripts Disponíveis

### `test_supplier_wizard.py`
Script Python que testa todas as validações do wizard de cadastro de fornecedor.

### `test_appointment_flow.py`
Script Python que testa o fluxo completo de agendamento:
- Login como médico
- Disponibilização de horários
- Login como cuidador
- Agendamento de consulta

### `create_test_user.py`
Script Python para criar automaticamente uma conta de teste com credenciais válidas.

## 📋 Requisitos

- Python 3.8+
- pip (gerenciador de pacotes Python)

## 🚀 Guia Completo de Testes

### Passo 1: Configurar Ambiente

```bash
cd testunit

# Executar script de setup (primeira vez)
./setup.sh
```

Este script irá:
- Criar um ambiente virtual Python
- Instalar todas as dependências necessárias (`requests`)
- Configurar tudo automaticamente

**Alternativa - Configuração Manual:**
```bash
cd testunit

# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

### Passo 2: Criar Conta de Teste

Antes de executar os testes, você precisa de uma conta válida. Você tem 3 opções:

#### Opção 1: Criar automaticamente (Recomendado) ⭐

```bash
# Ativar ambiente virtual
source venv/bin/activate

# Criar conta de teste
python3 create_test_user.py

# Ou usando o script helper
./create_test_user.sh
```

**O que o script faz:**
- ✅ Cria uma conta de teste com email único (ex: `teste_supplier_1767352902@lacos.com`)
- ✅ Gera senha padrão: `Teste123456`
- ✅ Salva credenciais em arquivo `.txt` (ex: `test_credentials_1767352902.txt`)
- ✅ Mostra o comando completo para executar os testes

**Exemplo de saída:**
```
================================================================================
🔧 CRIANDO CONTA DE TESTE PARA TESTES DO WIZARD DE FORNECEDOR
================================================================================

📧 Email: teste_supplier_1767352902@lacos.com
🔐 Senha: Teste123456
👤 Nome: Usuário Teste 1767352902

📤 Criando conta...
✅ Conta criada com sucesso!

================================================================================
📋 CREDENCIAIS DE TESTE
================================================================================
Email:    teste_supplier_1767352902@lacos.com
Senha:    Teste123456

💡 Use essas credenciais para executar os testes:
   python3 test_supplier_wizard.py https://gateway.lacosapp.com/api teste_supplier_1767352902@lacos.com Teste123456

💾 Credenciais salvas em: test_credentials_1767352902.txt
```

#### Opção 2: Criar manualmente

1. Acesse: https://lacosapp.com/cadastro
2. Preencha o formulário com:
   - Nome completo
   - Email único
   - Senha (mínimo 6 caracteres)
   - Telefone (opcional)
3. Anote as credenciais para usar nos testes

#### Opção 3: Usar conta root (Apenas se necessário) 🔑

Se você tiver acesso a uma conta root, o script consegue deletar fornecedores automaticamente:

**Credenciais Root:**
- **Email:** `root@lacos.com` (ou sua conta root)
- **Senha:** sua senha root

**Vantagens:**
- ✅ Limpeza automática de fornecedores antes/depois dos testes
- ✅ Não precisa remover manualmente
- ✅ Permite executar múltiplos testes na mesma sessão

**Nota:** A Opção 1 (criar conta automaticamente) é geralmente mais simples e recomendada.

### Passo 3: Executar os Testes

#### Comando Básico

```bash
# Ativar ambiente virtual (se ainda não estiver ativo)
source venv/bin/activate

# Executar testes (solicitará email e senha se não fornecer)
python3 test_supplier_wizard.py
```

#### Com Credenciais na Linha de Comando

```bash
python3 test_supplier_wizard.py <API_URL> <EMAIL> <PASSWORD>
```

**Exemplos:**

```bash
# Usando conta criada automaticamente (RECOMENDADO)
python3 test_supplier_wizard.py https://gateway.lacosapp.com/api teste_supplier_1767352902@lacos.com Teste123456

# Usando conta root (para limpeza automática - apenas se necessário)
python3 test_supplier_wizard.py https://gateway.lacosapp.com/api root@lacos.com sua_senha_root

# Usando conta manual
python3 test_supplier_wizard.py https://gateway.lacosapp.com/api seu_email@lacos.com sua_senha

# Para ambiente local (se testando localmente)
python3 test_supplier_wizard.py http://192.168.0.20/api seu_email@lacos.com sua_senha
```

#### Usando o Script Helper

```bash
./run_tests.sh https://gateway.lacosapp.com/api seu_email@lacos.com sua_senha
```

### Passo 4: Analisar os Resultados

O script gera dois tipos de relatórios:

#### 1. Relatório JSON
- Arquivo: `report_YYYYMMDD_HHMMSS.json`
- Formato estruturado para análise programática
- Contém todos os detalhes dos testes

#### 2. Relatório HTML (Visual)
- Arquivo: `report_YYYYMMDD_HHMMSS.html`
- Relatório visual com cores e formatação
- Abra no navegador para visualização fácil

**Exemplo de saída no terminal:**
```
================================================================================
📊 RELATÓRIO DE TESTES
================================================================================

📈 RESUMO:
   Total de testes: 30
   ✅ Passou: 25 (83.3%)
   ❌ Falhou: 5 (16.7%)
   ⚠️  Erro: 0 (0.0%)

❌ TESTES QUE FALHARAM (5):
--------------------------------------------------------------------------------

🔴 Campo Obrigatório - company_name vazio
   Descrição: Nome da empresa é obrigatório
   Esperado: Rejeitar
   Status recebido: 201
   Mensagem: ❌ Deveria rejeitar mas retornou 201
   ...

💾 Relatório salvo em: testunit/report_20260102_120000.json
📄 Relatório HTML salvo em: testunit/report_20260102_120000.html
```

## 📋 Informações de Login e Credenciais

### URLs da API

- **Produção (HTTPS):** `https://gateway.lacosapp.com/api`
- **Produção (HTTP):** `http://192.168.0.20/api`
- **Local (desenvolvimento):** `http://localhost/api` ou `http://192.168.0.20/api`

### Credenciais de Teste

#### Conta Criada Automaticamente
- **Email:** `teste_supplier_TIMESTAMP@lacos.com` (gerado automaticamente)
- **Senha:** `Teste123456` (padrão)
- **Perfil:** `caregiver`
- **Arquivo de credenciais:** `test_credentials_TIMESTAMP.txt`

#### Conta Root (Recomendada)
- **Email:** `root@lacos.com`
- **Senha:** (sua senha root)
- **Vantagem:** Permite limpeza automática de fornecedores

#### Conta Manual
- Crie em: https://lacosapp.com/cadastro
- Use suas próprias credenciais

### Fluxo de Autenticação

1. **Login:** O script faz login automaticamente usando as credenciais fornecidas
2. **Token:** Obtém token JWT/Sanctum
3. **Testes:** Executa todos os testes usando o token
4. **Limpeza:** Remove fornecedores criados (se tiver permissão root)

## 🔧 Comandos Rápidos

### Setup Completo (Primeira Vez)

```bash
cd testunit
./setup.sh
source venv/bin/activate
python3 create_test_user.py
```

### Executar Testes (Com Conta Criada)

```bash
cd testunit
source venv/bin/activate

# Copie o comando mostrado pelo create_test_user.py
# Ou use:
python3 test_supplier_wizard.py https://gateway.lacosapp.com/api SEU_EMAIL SUA_SENHA
```

### Executar Testes (Com Conta de Teste Criada Automaticamente)

```bash
cd testunit
source venv/bin/activate

# Primeiro, crie a conta de teste
python3 create_test_user.py

# Depois, use as credenciais mostradas (exemplo):
python3 test_supplier_wizard.py https://gateway.lacosapp.com/api teste_supplier_1767352902@lacos.com Teste123456
```

### Executar Testes (Com Conta Root - Apenas se Necessário)

```bash
cd testunit
source venv/bin/activate
python3 test_supplier_wizard.py https://gateway.lacosapp.com/api root@lacos.com SUA_SENHA_ROOT
```

### Ver Relatórios

```bash
# Listar relatórios gerados
ls -lh testunit/report_*.{json,html}

# Abrir relatório HTML no navegador
xdg-open testunit/report_YYYYMMDD_HHMMSS.html  # Linux
open testunit/report_YYYYMMDD_HHMMSS.html      # macOS
start testunit/report_YYYYMMDD_HHMMSS.html     # Windows
```

## ⚠️ Problemas Comuns e Soluções

### Erro: "Você já possui um cadastro de fornecedor"

**Causa:** O usuário já tem um fornecedor cadastrado.

**Soluções:**
1. **Criar nova conta de teste** (recomendado): Sempre funciona
   ```bash
   cd testunit
   source venv/bin/activate
   python3 create_test_user.py
   # Use as credenciais geradas no comando acima
   python3 test_supplier_wizard.py https://gateway.lacosapp.com/api teste_supplier_TIMESTAMP@lacos.com Teste123456
   ```
2. **Usar conta root** (se tiver acesso): O script remove automaticamente
   ```bash
   python3 test_supplier_wizard.py https://gateway.lacosapp.com/api root@lacos.com SUA_SENHA_ROOT
   ```
3. **Remover manualmente:**
   - Acesse: http://admin.lacosapp.com
   - Vá em "Fornecedores"
   - Delete o fornecedor existente
   - Aguarde alguns segundos e tente novamente

### Erro: "Acesso negado. Apenas usuários root podem..."

**Causa:** Tentando deletar fornecedor sem permissão root.

**Solução:** Use uma conta root ou remova manualmente via painel admin.

### Erro: "Token de autenticação não encontrado"

**Causa:** Login falhou ou token expirou.

**Solução:** Verifique as credenciais e tente novamente.

### Erro: "Profile is invalid"

**Causa:** Perfil inválido no cadastro.

**Solução:** O script `create_test_user.py` já usa o perfil correto (`caregiver`). Se criar manualmente, use um dos perfis válidos:
- `caregiver` (padrão)
- `accompanied`
- `professional_caregiver`
- `doctor`

### Erro: "externally-managed-environment"

**Causa:** Tentando instalar pacotes no Python do sistema.

**Solução:** Use o ambiente virtual:
```bash
cd testunit
./setup.sh
source venv/bin/activate
```

## 📊 O que é Testado

### ✅ Caminho Feliz (Happy Path)
- Cadastro completo de Pessoa Jurídica
- Cadastro completo de Pessoa Física
- Cadastro com apenas campos obrigatórios

### ❌ Validações de Obrigatoriedade
- `company_name` vazio ou ausente
- `company_type` ausente
- `cnpj` ausente para Pessoa Jurídica
- `cpf` ausente para Pessoa Física
- `products_categories` vazio ou ausente

### 📏 Validações de Tamanho Máximo
- `company_name` excede 255 caracteres
- `cnpj` excede 18 caracteres
- `cpf` excede 14 caracteres
- `state` excede 2 caracteres
- `zip_code` excede 10 caracteres

### 🔢 Validações de Tipo
- `company_type` inválido
- `account_type` inválido
- `products_categories` não é array

### 🌐 Validações de Formato
- `website` não é URL válida
- `website` sem protocolo

### 🏢 Regras de Negócio
- CNPJ fornecido para Pessoa Física
- CPF fornecido para Pessoa Jurídica
- Categoria inválida
- Estado inválido

### 🔗 Validações de Integridade
- Campos bancários parciais
- PIX sem tipo

### 📊 Valores Limite
- Campos no tamanho máximo exato
- Mínimo de categorias (1)
- Máximo de categorias (todas)

## 📄 Relatórios Gerados

O script gera dois tipos de relatórios:

1. **JSON** (`report_YYYYMMDD_HHMMSS.json`): Dados estruturados para análise programática
2. **HTML** (`report_YYYYMMDD_HHMMSS.html`): Relatório visual com cores e formatação

### Estrutura do Relatório

```json
{
  "timestamp": "2024-01-02T12:00:00",
  "summary": {
    "total": 30,
    "passed": 25,
    "failed": 5,
    "errors": 0
  },
  "results": [
    {
      "name": "Nome do Teste",
      "description": "Descrição do teste",
      "status": "PASS|FAIL|ERROR",
      "expected": "accept|reject",
      "actual_status": 201,
      "message": "Mensagem do resultado",
      "response": {...}
    }
  ]
}
```

### Interpretação dos Resultados

#### ✅ PASS
O teste passou conforme esperado:
- Dados válidos foram aceitos
- Dados inválidos foram rejeitados

#### ❌ FAIL
O teste falhou:
- Dados válidos foram rejeitados (não deveria)
- Dados inválidos foram aceitos (não deveria)
- Erros esperados não foram retornados

#### ⚠️ ERROR
Erro na execução do teste (problema de conexão, timeout, etc.)

## 📝 Notas Importantes

1. **Autenticação**: O script precisa de um usuário válido para fazer login
2. **Limpeza Automática**: 
   - Com conta root: Limpeza automática antes/depois de cada teste
   - Sem root: Pode ser necessário limpar manualmente via painel admin
3. **Rate Limiting**: O script inclui delays entre requisições (0.5s) para evitar sobrecarga
4. **Ambiente**: Certifique-se de estar testando no ambiente correto:
   - **Produção:** `https://gateway.lacosapp.com/api`
   - **Desenvolvimento:** `http://192.168.0.20/api`
5. **Dados Únicos**: Cada execução usa dados únicos (timestamp) para evitar conflitos
6. **Retry Automático**: Se um teste falhar por "Already registered", o script tenta limpar e repetir

## 🔄 Fluxo Completo de Teste

```
1. Setup (primeira vez)
   └─> ./setup.sh
       └─> Cria venv, instala dependências

2. Criar Conta de Teste
   └─> python3 create_test_user.py
       └─> Gera email único, senha padrão
       └─> Salva credenciais em arquivo .txt

3. Executar Testes
   └─> python3 test_supplier_wizard.py API_URL EMAIL SENHA
       ├─> Login com credenciais
       ├─> Limpar fornecedores existentes (se root)
       ├─> Executar 30+ testes
       │   ├─> Caminho feliz (dados corretos)
       │   ├─> Validações (dados incorretos)
       │   ├─> Tamanhos máximos
       │   ├─> Tipos de dados
       │   └─> Regras de negócio
       ├─> Limpar após cada teste bem-sucedido
       └─> Gerar relatórios (JSON + HTML)

4. Analisar Resultados
   └─> Abrir report_*.html no navegador
       └─> Ver testes que passaram/falharam
       └─> Identificar problemas de validação
```

## 🏥 Teste Funcional - Fluxo de Agendamento

### Descrição
O script `test_appointment_flow.py` testa o fluxo completo de agendamento de consultas:
1. Login como médico (CPF: 40780462319, senha: 11111111)
2. Disponibilização de 2 horários para hoje (a partir da hora atual)
3. Login como cuidador/amigo
4. Agendamento de uma consulta usando um dos horários disponíveis
5. Geração de relatório com resultados

### Uso

#### Comando Básico (solicita credenciais do cuidador)
```bash
cd testunit
source venv/bin/activate
python3 test_appointment_flow.py
```

#### Com Todos os Parâmetros
```bash
python3 test_appointment_flow.py <API_URL> <DOCTOR_CPF> <DOCTOR_PASSWORD> <CAREGIVER_LOGIN> <CAREGIVER_PASSWORD>
```

**Exemplo:**
```bash
python3 test_appointment_flow.py http://192.168.0.20:8000/api 40780462319 11111111 cpf_ou_email_cuidador senha_cuidador
```

#### Usando o Script Helper
```bash
./run_appointment_test.sh http://192.168.0.20:8000/api 40780462319 11111111 cpf_ou_email_cuidador senha_cuidador
```

### Relatório
O script gera um relatório JSON com:
- Resumo dos passos executados
- Status de cada passo (PASS/FAIL/ERROR)
- Dados coletados durante o teste
- Erros encontrados (se houver)

**Arquivo gerado:** `report_appointment_flow_YYYYMMDD_HHMMSS.json`

### Exemplo de Saída
```
================================================================================
🧪 TESTE FUNCIONAL - FLUXO DE AGENDAMENTO
================================================================================
API: http://192.168.0.20:8000/api
Médico CPF: 40780462319
Cuidador: cpf_ou_email_cuidador
================================================================================

✅ Login Médico: Médico logado: Dr. Nome (ID: 7)
✅ Criar Disponibilidade: 2 horários disponibilizados: 14:00 e 15:00
✅ Login Cuidador: Cuidador logado: Nome do Cuidador
✅ Obter Grupos: Grupo selecionado: Grupo do Paciente (ID: 1)
✅ Criar Agendamento: Consulta agendada para 2026-01-25 14:00:00

================================================================================
✅ TESTE CONCLUÍDO COM SUCESSO!
================================================================================

📊 RELATÓRIO DE TESTE
================================================================================

📈 RESUMO:
   Total de passos: 5
   ✅ Passou: 5 (100.0%)
   ❌ Falhou: 0 (0.0%)
   ⚠️  Erro: 0 (0.0%)

💾 Relatório salvo em: testunit/report_appointment_flow_20260125_143000.json
```

## 📁 Estrutura de Arquivos

```
testunit/
├── setup.sh                    # Script de configuração inicial
├── run_tests.sh                # Script helper para executar testes
├── run_appointment_test.sh     # Helper para teste de agendamento
├── create_test_user.py         # Script para criar conta de teste
├── create_test_user.sh         # Helper para criar conta
├── test_supplier_wizard.py     # Script principal de testes
├── test_appointment_flow.py    # Teste funcional de agendamento
├── requirements.txt             # Dependências Python
├── README.md                   # Este arquivo
├── .gitignore                  # Arquivos ignorados pelo git
├── venv/                       # Ambiente virtual (criado após setup)
├── test_credentials_*.txt      # Credenciais salvas (gerado)
├── report_*.json               # Relatórios JSON (gerado)
└── report_*.html               # Relatórios HTML (gerado)
```

## 📖 Exemplo de Saída Completa

```
🧪 TESTES DO WIZARD DE CADASTRO DE FORNECEDOR
================================================================================
✅ Login realizado com sucesso: teste@lacos.com

🧹 Verificando fornecedores existentes...
   ✅ Nenhum fornecedor existente encontrado

📋 Total de testes: 30

🧪 Testando: Caminho Feliz - Pessoa Jurídica Completo
   Descrição: Todos os campos preenchidos corretamente para PJ
   ✅ Aceito corretamente (status 201)
   🧹 Limpando fornecedor criado para próximo teste...
   ✅ Fornecedor removido com sucesso

🧪 Testando: Campo Obrigatório - company_name vazio
   Descrição: Nome da empresa é obrigatório
   ✅ Rejeitado corretamente (status 422)

...

📊 RELATÓRIO DE TESTES
================================================================================

📈 RESUMO:
   Total de testes: 30
   ✅ Passou: 25 (83.3%)
   ❌ Falhou: 5 (16.7%)
   ⚠️  Erro: 0 (0.0%)

💾 Relatório salvo em: testunit/report_20240102_120000.json
📄 Relatório HTML salvo em: testunit/report_20240102_120000.html
```
