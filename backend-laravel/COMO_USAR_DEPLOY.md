# 🚀 Como Fazer Deploy para o GitHub

Este guia explica como fazer o deploy do backend Laravel para o repositório GitHub.

## 📋 Pré-requisitos

1. **Git instalado**
```bash
git --version
```

2. **Acesso ao repositório GitHub**
   - Repositório: `https://github.com/dev-catena/gateway-lacos-.git`
   - Você precisa ter permissões de escrita no repositório

3. **Autenticação GitHub configurada**
   - Token de acesso pessoal (PAT) ou SSH key configurada

## 🎯 Método 1: Usando o Script Automático (Recomendado)

```bash
cd backend-laravel
./DEPLOY_GITHUB.sh
```

O script irá:
- ✅ Verificar se git está instalado
- ✅ Inicializar o repositório (se necessário)
- ✅ Configurar o remote do GitHub
- ✅ Adicionar todos os arquivos (respeitando .gitignore)
- ✅ Criar um commit inicial
- ✅ Fazer push para o GitHub

## 🎯 Método 2: Deploy Manual

### Passo 1: Navegar para o diretório
```bash
cd backend-laravel
```

### Passo 2: Inicializar Git (se necessário)
```bash
git init
```

### Passo 3: Adicionar Remote
```bash
git remote add origin https://github.com/dev-catena/gateway-lacos-.git
```

Ou se já existe:
```bash
git remote set-url origin https://github.com/dev-catena/gateway-lacos-.git
```

### Passo 4: Adicionar Arquivos
```bash
git add .
```

### Passo 5: Verificar o que será commitado
```bash
git status
```

### Passo 6: Criar Commit
```bash
git commit -m "feat: deploy inicial do backend Laravel gateway

- Estrutura completa do Laravel
- Controllers da API
- Rotas configuradas
- Models e Migrations
- Configurações do gateway"
```

### Passo 7: Fazer Push
```bash
git branch -M main
git push -u origin main
```

## 🔐 Configuração de Autenticação

### Opção 1: Token de Acesso Pessoal (PAT)

1. Crie um token em: https://github.com/settings/tokens
2. Use o token na URL:
```bash
git remote set-url origin https://SEU_TOKEN@github.com/dev-catena/gateway-lacos-.git
```

### Opção 2: SSH Key

1. Configure SSH key no GitHub
2. Use a URL SSH:
```bash
git remote set-url origin git@github.com:dev-catena/gateway-lacos-.git
```

## ⚠️ Solução de Problemas

### Erro: "Repository not found"
- Verifique se o repositório existe no GitHub
- Verifique suas permissões de acesso
- Crie o repositório no GitHub se não existir

### Erro: "Authentication failed"
- Configure autenticação (PAT ou SSH)
- Verifique suas credenciais

### Erro: "Remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/dev-catena/gateway-lacos-.git
```

### Repositório não está vazio
Se o repositório já tem conteúdo e você quer substituir:
```bash
git push -u origin main --force
```
⚠️ **Cuidado**: Isso sobrescreverá o conteúdo existente!

## 📦 O que será enviado?

O `.gitignore` está configurado para **NÃO** enviar:
- ❌ `/vendor/` (dependências do Composer)
- ❌ `/node_modules/` (dependências do NPM)
- ❌ `.env` (variáveis de ambiente)
- ❌ Scripts temporários (`.sh`, `.bak`, etc.)
- ❌ Arquivos de log
- ❌ Cache do Laravel

O que **SERÁ** enviado:
- ✅ Código fonte (`app/`, `config/`, `routes/`, etc.)
- ✅ Migrations (`database/migrations/`)
- ✅ Controllers e Models
- ✅ `.gitignore`
- ✅ `README_GITHUB.md`
- ✅ `DEPLOY_GITHUB.sh`

## ✅ Verificação Pós-Deploy

Após o deploy, verifique:
1. Acesse: https://github.com/dev-catena/gateway-lacos-
2. Confirme que os arquivos foram enviados
3. Verifique se o `.gitignore` está funcionando corretamente

## 🔄 Atualizações Futuras

Para fazer atualizações:
```bash
cd backend-laravel
git add .
git commit -m "feat: descrição da mudança"
git push origin main
```

## 📚 Recursos Adicionais

- [Documentação do Git](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [Laravel Documentation](https://laravel.com/docs)

---

**Pronto para fazer deploy!** 🚀

