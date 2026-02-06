# Extrator de Rotas Laravel do GitHub

Scripts Python para extrair rotas da API de um repositório Laravel no GitHub.

## Scripts Disponíveis

### 1. `extrair_rotas_github.py` (Autenticação com usuário/senha)
- Usa autenticação básica com username e senha
- ⚠️ **Menos seguro** - GitHub desencoraja uso de senha

### 2. `extrair_rotas_github_token.py` (Recomendado - Token de Acesso)
- Usa Personal Access Token (PAT)
- ✅ **Mais seguro** - Método recomendado pelo GitHub

## Instalação

```bash
# Instalar dependências
pip3 install requests

# Ou
pip install requests
```

## Como Usar

### Opção 1: Com Usuário e Senha (não recomendado)

```bash
python3 extrair_rotas_github.py
```

O script já está configurado com:
- Usuário: `devRoboflex`
- Organização: `Zontec-Software`
- Repositório: `thalamus-backend-laravel`
- Arquivo: `routes/api.php`

### Opção 2: Com Token de Acesso (recomendado)

1. **Criar um Personal Access Token:**
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token (classic)"
   - Selecione o escopo `repo` (acesso completo a repositórios)
   - Copie o token gerado

2. **Executar o script:**
   ```bash
   export GITHUB_TOKEN='seu_token_aqui'
   python3 extrair_rotas_github_token.py
   ```

   Ou edite o arquivo e defina o token diretamente na variável `GITHUB_TOKEN`.

## Saída

O script irá:
1. Conectar ao GitHub
2. Baixar o arquivo `routes/api.php`
3. Extrair todas as rotas
4. Exibir no terminal
5. Salvar em `rotas_extraidas.txt`

## Exemplo de Saída

```
================================================================================
Total de rotas encontradas: 45
================================================================================

GET Routes:
--------------------------------------------------------------------------------
  GET      api/users                          -> UserController::index        (linha 15)
  GET      api/users/{id}                     -> UserController::show         (linha 16)
  POST     api/users                          -> UserController::store         (linha 17)
  ...
```

## Padrões de Rotas Suportados

O script reconhece os seguintes padrões Laravel:

- `Route::get('path', [Controller::class, 'method'])`
- `Route::post('path', 'Controller@method')`
- `Route::resource('path', Controller::class)`
- `Route::apiResource('path', Controller::class)`
- `Route::method('path', function() {})`
- E outros métodos HTTP (put, patch, delete, etc.)

## Notas de Segurança

⚠️ **Importante:**
- Não compartilhe tokens ou senhas
- Use tokens com escopos mínimos necessários
- Considere usar variáveis de ambiente para tokens
- Revogue tokens que não estão mais em uso

## Solução de Problemas

### Erro de Autenticação
- Verifique se as credenciais estão corretas
- Para token: verifique se tem permissão `repo`
- Para senha: GitHub pode bloquear autenticação com senha

### Arquivo não encontrado
- Verifique se o arquivo `routes/api.php` existe no repositório
- Verifique se você tem acesso ao repositório

### Erro de permissão
- Verifique se o token tem escopo `repo`
- Verifique se você tem acesso à organização `Zontec-Software`


