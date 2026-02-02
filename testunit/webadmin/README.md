# Testes Automatizados do Web-Admin

Este diretório contém scripts de testes automatizados para o painel administrativo (web-admin).

## Instalação

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

2. Instale o ChromeDriver (necessário para o Selenium):
```bash
# Ubuntu/Debian
sudo apt-get install chromium-chromedriver

# Ou use webdriver-manager (recomendado)
pip install webdriver-manager
```

## Configuração

Edite o arquivo `test_webadmin.py` e ajuste as seguintes variáveis:

- `WEB_ADMIN_URL`: URL do web-admin (padrão: http://localhost:5173)
- `API_BASE_URL`: URL da API backend (padrão: http://localhost:8000/api)
- `ADMIN_EMAIL`: Email do administrador (padrão: root@lacos.com)
- `ADMIN_PASSWORD`: Senha do administrador

## Execução

```bash
python3 test_webadmin.py
```

## Testes Realizados

O script testa as seguintes funcionalidades:

1. **Login**: Autenticação no web-admin
2. **Gerenciamento de Usuários**: 
   - Criação de usuário fake
   - Bloqueio de usuário
   - Exclusão de usuário
3. **Gerenciamento de Médicos**:
   - Listagem de médicos
   - Edição de médico
   - Bloqueio de médico
   - Visualização de pacientes do médico
4. **Gerenciamento de Cuidadores**:
   - Verificação de cuidadores no banco de dados
   - Visualização na interface
   - Visualização de pacientes do cuidador
5. **Gerenciamento de Fornecedores**:
   - Criação de solicitação no site
   - Aprovação de fornecedor
   - Reprovação de fornecedor
   - Suspensão de fornecedor
6. **Gerenciamento de Smartwatches**:
   - Inclusão de dispositivo
   - Exclusão de dispositivo

## Modo Headless

Por padrão, o script roda em modo headless (sem interface gráfica). Para ver o navegador durante os testes, comente a linha:

```python
chrome_options.add_argument('--headless')
```

## Notas

- Os testes podem falhar se os elementos da interface mudarem
- Ajuste os seletores CSS/XPath conforme necessário
- Alguns testes podem precisar de dados pré-existentes no banco


