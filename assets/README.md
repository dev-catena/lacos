# Assets

Esta pasta contém os recursos visuais do aplicativo Laços.

## Arquivos Necessários

Para o aplicativo funcionar completamente, você precisará adicionar os seguintes arquivos:

### Ícones e Splash Screen

1. **icon.png** (1024x1024px)
   - Ícone principal do aplicativo
   - Formato: PNG com fundo sólido
   - Será usado na App Store e Google Play

2. **adaptive-icon.png** (1024x1024px)
   - Ícone adaptativo para Android
   - Área segura de 512x512px no centro
   - Formato: PNG

3. **splash.png** (2048x3840px ou maior)
   - Tela de abertura do aplicativo
   - Fundo: #6366f1 (roxo/índigo)
   - Formato: PNG

4. **favicon.png** (48x48px)
   - Favicon para versão web
   - Formato: PNG

## Como Gerar os Assets

### Opção 1: Usar Figma/Design Tool
1. Crie os designs nos tamanhos especificados
2. Exporte como PNG
3. Coloque nesta pasta

### Opção 2: Placeholders Temporários
Para testes, você pode usar placeholders:

```bash
# No diretório do projeto
# Use um serviço online como placeholder.com ou similares
# ou crie imagens simples com fundo colorido
```

### Opção 3: Usar o Expo Icon Generator
```bash
expo install expo-asset
# Use o comando do Expo para gerar os ícones a partir de uma imagem base
```

## Cores do Tema

- **Primária**: #6366f1 (Roxo/Índigo)
- **Secundária**: #ec4899 (Rosa)
- **Fundo**: #f8fafc (Cinza claro)

## Sugestão de Ícone

O ícone do app pode representar:
- 🤝 Mãos unidas (laços de união)
- ❤️ Coração (cuidado e amor)
- 👥 Pessoas conectadas (grupos de cuidadores)
- 🏥 Símbolo de saúde combinado com conexão

Use design minimalista e moderno que represente cuidado, união familiar e saúde.

