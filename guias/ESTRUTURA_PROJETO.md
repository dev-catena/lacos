# 📁 Estrutura do Projeto Laços

## 🎯 Visão Geral

O projeto Laços é um sistema completo com múltiplas plataformas:

```
lacos/
├── backend-laravel/     # API Backend (Laravel)
├── src/                 # Código fonte do app React Native (compartilhado)
├── ios/                 # Projeto nativo iOS (Xcode)
├── android/             # Projeto nativo Android (Gradle)
├── website/             # Site público (React/Vite)
├── web-admin/           # Painel de administração web (React/Vite)
├── assets/              # Imagens e assets compartilhados
├── scripts/             # Scripts de automação
└── guias/               # Documentação
```

## 📱 Apps Mobile (iOS e Android)

### ✅ Sim, as pastas `ios/` e `android/` contêm os apps nativos!

**Como funciona:**

1. **`src/`** - Código React Native compartilhado
   - Contém toda a lógica do app (screens, components, services, etc.)
   - Este código é usado tanto no iOS quanto no Android

2. **`ios/`** - Projeto nativo iOS
   - Configurações específicas do iOS (Xcode)
   - `Laos.xcodeproj` - Projeto Xcode
   - `Podfile` - Dependências nativas iOS (CocoaPods)
   - Configurações de ícones, splash screen, permissões

3. **`android/`** - Projeto nativo Android
   - Configurações específicas do Android (Gradle)
   - `build.gradle` - Configurações de build
   - `AndroidManifest.xml` - Permissões e configurações
   - Ícones e recursos Android

**Fluxo de desenvolvimento:**
- Você desenvolve o código em `src/` (React Native)
- O React Native compila para iOS (`ios/`) e Android (`android/`)
- Cada plataforma tem suas configurações nativas específicas

## 🌐 Aplicações Web

### `website/` - Site Público
- Site institucional/público do Laços
- Tecnologia: React + Vite
- Páginas: Home, Login, Cadastro, Fornecedor, etc.
- Build: `npm run build` → gera `dist/`

### `web-admin/` - Painel Administrativo
- Interface web para administradores
- Tecnologia: React + Vite
- Funcionalidades: Gerenciar usuários, médicos, planos, fornecedores
- Build: `npm run build` → gera `dist/`

## 🎨 Pasta `assets/` - Para que serve?

A pasta `assets/` contém **imagens e recursos visuais compartilhados** entre diferentes partes do projeto:

### Conteúdo:
- `lacos.svg` / `lacos-ico.svg` - Logos do Laços
- `avatar.webp`, `avatar2.webp` - Avatares padrão
- `perfil.webp` - Imagem de perfil padrão
- `senhor.webp`, `senhora.webp` - Avatares de exemplo
- `senhora-avatar.webp` - Avatar feminino

### Por que está no nível raiz?

1. **Compartilhamento**: As mesmas imagens podem ser usadas em:
   - App mobile (React Native)
   - Website
   - Web-admin
   - Backend (quando necessário)

2. **Organização**: Centraliza todos os assets visuais em um só lugar

3. **Facilidade**: Cada projeto pode referenciar `../assets/` para acessar as imagens

## 🔧 Outras Pastas Importantes

### `backend-laravel/`
- API REST em Laravel
- Endpoints para todas as plataformas
- Banco de dados, autenticação, lógica de negócio

### `scripts/`
- Scripts de automação (deploy, backup, configuração)
- Shell scripts, PHP scripts, etc.

### `guias/`
- Documentação do projeto
- Guias de instalação, configuração, deploy

## 📊 Fluxo de Dados

```
┌─────────────┐
│   Website   │
│  (React)    │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
┌──────▼──────┐  ┌───▼────────┐
│  Web-Admin  │  │   Mobile   │
│   (React)   │  │ (React     │
└──────┬──────┘  │  Native)   │
       │         └──────┬──────┘
       │                │
       └────────┬───────┘
                │
         ┌──────▼──────┐
         │  Backend    │
         │  Laravel    │
         │    API     │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │  Database   │
         │   MySQL     │
         └─────────────┘
```

## 🚀 Como Cada Parte Funciona

### App Mobile
```bash
# Desenvolvimento
npm start              # Inicia Metro bundler
npm run android        # Roda no Android
npm run ios            # Roda no iOS

# Build produção
cd android && ./gradlew assembleRelease
cd ios && xcodebuild ...
```

### Website
```bash
cd website
npm install
npm run dev            # Desenvolvimento
npm run build          # Build produção
```

### Web-Admin
```bash
cd web-admin
npm install
npm run dev            # Desenvolvimento
npm run build          # Build produção
```

### Backend
```bash
cd backend-laravel
composer install
php artisan serve      # Desenvolvimento
```

## 📝 Resumo

| Pasta | Conteúdo | Tecnologia |
|-------|----------|------------|
| `src/` | Código React Native compartilhado | React Native |
| `ios/` | Projeto nativo iOS | Xcode, Swift |
| `android/` | Projeto nativo Android | Gradle, Kotlin |
| `website/` | Site público | React + Vite |
| `web-admin/` | Painel admin | React + Vite |
| `backend-laravel/` | API Backend | Laravel (PHP) |
| `assets/` | Imagens compartilhadas | SVG, WebP |
| `scripts/` | Scripts de automação | Shell, PHP |
| `guias/` | Documentação | Markdown |

## ✅ Conclusão

- **Sim**, `ios/` e `android/` contêm os apps nativos
- **`assets/`** está no nível raiz para compartilhar imagens entre todos os projetos
- Cada parte do sistema (mobile, web, admin) é independente mas compartilha o mesmo backend






