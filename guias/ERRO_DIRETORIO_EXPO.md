# 🔧 Erro: Cannot determine the project's Expo SDK version

## 🐛 Problema

Você recebeu o erro:
```
ConfigError: Cannot determine the project's Expo SDK version because the module `expo` is not installed.
```

## ✅ Solução

O problema é que você estava executando o comando no diretório errado (`/home/darley` em vez de `/home/darley/lacos`).

### Opção 1: Usar o Script (Recomendado)

```bash
cd /home/darley/lacos
./scripts/INICIAR_EXPO.sh
```

### Opção 2: Navegar Manualmente

```bash
# 1. Ir para o diretório do projeto
cd /home/darley/lacos

# 2. Verificar se está no lugar certo
pwd  # Deve mostrar: /home/darley/lacos

# 3. Iniciar o Expo
npm start
```

### Opção 3: Se as Dependências Não Estiverem Instaladas

```bash
cd /home/darley/lacos
npm install
npm start
```

## 📝 Nota sobre os Warnings

Os warnings sobre pacotes deprecated (`inflight`, `rimraf`, `glob`) são normais e não impedem o funcionamento. Eles vêm de dependências indiretas e serão atualizados automaticamente quando as dependências principais forem atualizadas.

## 🎯 Sempre Lembre-se

**Sempre execute os comandos do Expo dentro do diretório do projeto:**
```bash
cd /home/darley/lacos
```

## 💡 Dica

Crie um alias no seu `.bashrc` ou `.zshrc`:
```bash
alias lacos='cd /home/darley/lacos'
```

Depois, você pode simplesmente digitar `lacos` para ir para o diretório do projeto.






