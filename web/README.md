# Gestão de Planos - Laços

Aplicação web React para gestão de planos do sistema Laços. Permite ao usuário root configurar os planos disponíveis e definir quais funcionalidades cada plano terá acesso.

## 🚀 Funcionalidades

- **Gestão de Planos**: Visualização e edição dos 4 planos padrão (Básico, Intermediário, Avançado e Pleno)
- **Configuração de Funcionalidades**: Seleção de funcionalidades disponíveis em cada plano
- **Plano Padrão**: Identificação do plano básico como padrão para novos usuários
- **Interface Moderna**: Design responsivo e intuitivo

## 📋 Planos Disponíveis

1. **Básico** (Padrão) - Atribuído automaticamente a novos usuários
2. **Intermediário**
3. **Avançado**
4. **Pleno**

## 🎯 Funcionalidades Configuráveis

- Grupo de cuidados
- Histórico
- Remédios
- Agenda
- Médicos
- Arquivos
- Mídias
- Sinais vitais
- Configurações
- Smartwatch (ainda não implementado na aplicação mobile)
- Sensor de Quedas (ainda não implementado na aplicação mobile)
- Câmeras (ainda não implementado na aplicação mobile)

## 🛠️ Instalação

```bash
cd web
npm install
```

## 🚀 Executar

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos de produção estarão na pasta `dist/`

## 🔌 Integração com API

A aplicação se conecta à API Laravel em `http://193.203.182.22/api`.

### Endpoints Esperados

- `GET /api/plans` - Listar todos os planos
- `GET /api/plans/:id` - Obter detalhes de um plano
- `POST /api/plans` - Criar novo plano
- `PUT /api/plans/:id` - Atualizar plano
- `DELETE /api/plans/:id` - Deletar plano

### Autenticação

A aplicação utiliza o token armazenado em `localStorage` com a chave `@lacos:token` para autenticação nas requisições.

## 📝 Notas

- Por padrão, todos os usuários começam com visualização do plano básico
- Os planos são contratados por usuários com perfil Cuidador/Amigo
- A aplicação funciona mesmo sem conexão com a API, utilizando dados padrão

