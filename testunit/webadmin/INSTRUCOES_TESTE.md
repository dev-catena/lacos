# 📋 Instruções para Executar os Testes do Web-Admin

## ⚠️ IMPORTANTE: Pré-requisitos

Antes de executar os testes, você **DEVE** iniciar o web-admin primeiro!

## 🚀 Como Iniciar o Web-Admin

### Opção 1: Usando o script (Recomendado)
```bash
cd /home/darley/lacos
./scripts/INICIAR_ADMIN_WEB.sh
```

### Opção 2: Manualmente
```bash
cd /home/darley/lacos/web-admin
npm install  # Se ainda não instalou as dependências
npm run dev
```

O web-admin estará disponível em:
- **http://localhost:5173** (porta padrão do Vite)
- **http://10.102.0.103:8081** (se usar o script INICIAR_ADMIN_WEB.sh)

## 🧪 Como Executar os Testes

### 1. Ativar o ambiente virtual
```bash
cd /home/darley/lacos/testunit/webadmin
source venv/bin/activate
```

### 2. Verificar se o web-admin está rodando
Abra um navegador e acesse:
- http://localhost:5173
- Ou http://10.102.0.103:8081

Se a página carregar, o web-admin está rodando! ✅

### 3. Executar os testes
```bash
./run_tests.sh
```

Ou diretamente:
```bash
python3 test_webadmin.py
```

## 📊 Relatório de Testes

Após a execução, um relatório detalhado será gerado em:
- `relatorio_teste_webadmin_[data].txt`

## 🔧 Configuração

Se o web-admin estiver rodando em uma porta diferente, edite o arquivo `test_webadmin.py`:

```python
WEB_ADMIN_URL = "http://localhost:5173"  # Ajuste conforme necessário
API_BASE_URL = "http://localhost:8000/api"  # Ajuste conforme necessário
ADMIN_EMAIL = "root@lacos.com"
ADMIN_PASSWORD = "root123"  # Ajuste conforme necessário
```

## ❌ Erros Comuns

### Erro: `ERR_CONNECTION_REFUSED`
**Causa:** O web-admin não está rodando.

**Solução:** Inicie o web-admin primeiro (veja seção "Como Iniciar o Web-Admin" acima).

### Erro: `ChromeDriver version mismatch`
**Causa:** Versão do ChromeDriver incompatível com o Chrome/Chromium.

**Solução:** O código já tenta resolver isso automaticamente. Se persistir, limpe o cache:
```bash
rm -rf ~/.wdm
```

## 📝 Notas

- Os testes abrem um navegador Chrome/Chromium automaticamente
- Para ver os testes em execução, deixe o navegador visível
- Para rodar em modo headless (sem interface), descomente a linha no código:
  ```python
  chrome_options.add_argument('--headless')
  ```


