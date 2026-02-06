# Guia Rápido - Criar Token GitHub

## Passo a Passo

1. **Acesse:** https://github.com/settings/tokens
2. **Clique em:** "Generate new token" → "Generate new token (classic)"
3. **Preencha:**
   - Note: `Extrator Rotas` (qualquer nome)
   - Expiration: Escolha (ex: 90 dias)
   - **Selecione o escopo:** ✅ `repo` (acesso completo a repositórios)
4. **Clique em:** "Generate token"
5. **COPIE o token** (você só verá uma vez!)

## Usar o Token

### Opção 1: Variável de ambiente (recomendado)
```bash
export GITHUB_TOKEN='seu_token_aqui'
python3 extrair_rotas_github_v2.py
```

### Opção 2: O script pede interativamente
```bash
python3 extrair_rotas_github_v2.py
# Cole o token quando solicitado
```

## Scripts Disponíveis

- `extrair_rotas_github_v2.py` - **RECOMENDADO** - Versão melhorada com token
- `extrair_rotas_github_token.py` - Versão anterior com token
- `extrair_rotas_github.py` - Versão antiga (não funciona mais - GitHub bloqueou senha)


