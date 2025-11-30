# 🗜️ Sistema de Compressão de Mídia

## Visão Geral

O sistema implementa compressão automática de imagens e vídeos antes do upload, similar ao algoritmo usado pelo WhatsApp. Isso reduz o tamanho dos arquivos, economiza dados móveis e acelera o upload.

## 📋 Funcionalidades

### ✅ Compressão de Imagens
- **Redimensionamento automático**: Máximo 1920x1920px (similar ao WhatsApp)
- **Compressão de qualidade**: 85% de qualidade JPEG
- **Limite de compressão**: Imagens maiores que 2MB são comprimidas automaticamente
- **Biblioteca**: `expo-image-manipulator` (nativo do Expo)

### ⚠️ Compressão de Vídeos
- **Status**: Limitado no Expo managed workflow
- **Biblioteca**: `react-native-compressor` (requer build customizada)
- **Limite de compressão**: Vídeos maiores que 10MB tentam compressão
- **Fallback**: Se o compressor não estiver disponível, o vídeo original é usado

## 🔧 Como Funciona

### Fluxo de Upload

1. **Seleção de Mídia**
   - Usuário seleciona imagem ou vídeo da galeria
   - Imagens já são selecionadas com 85% de qualidade

2. **Verificação de Tamanho**
   - Sistema verifica se o arquivo excede os limites:
     - **Imagens**: > 2MB → Comprimir
     - **Vídeos**: > 10MB → Tentar comprimir

3. **Compressão (se necessário)**
   - **Imagens**: Redimensiona e comprime automaticamente
   - **Vídeos**: Tenta comprimir (se disponível)
   - Mostra toast de progresso ao usuário

4. **Upload**
   - Arquivo comprimido é enviado ao servidor
   - Timeout calculado baseado no tamanho final

## 📊 Parâmetros de Compressão

### Imagens
```javascript
{
  maxWidth: 1920,      // WhatsApp usa ~1920px
  maxHeight: 1920,
  quality: 0.85,       // 85% de qualidade
  format: 'JPEG'
}
```

### Vídeos
```javascript
{
  quality: 'medium',   // 'low', 'medium', 'high'
  maxWidth: 1280,      // WhatsApp usa ~1280px
  maxHeight: 1280,
  compressionMethod: 'auto'
}
```

## 🎯 Limites de Tamanho

### Antes da Compressão
- **Imagens**: Até 50MB
- **Vídeos**: Até 100MB

### Após Compressão
- **Imagens**: Geralmente reduzidas em 40-70%
- **Vídeos**: Depende da disponibilidade do compressor

## 📱 Compatibilidade

### ✅ Funciona em:
- **Android**: Compressão de imagens e vídeos (se build customizada)
- **iOS**: Compressão de imagens e vídeos (se build customizada)
- **Expo Go**: Apenas compressão de imagens

### ⚠️ Limitações:
- **Vídeos no Expo Go**: Compressão não disponível (requer build customizada)
- **Build customizada necessária**: Para compressão de vídeos, é necessário fazer build com `expo build` ou EAS Build

## 🔨 Instalação

As dependências já estão instaladas:

```bash
npm install expo-image-manipulator react-native-compressor
```

## 📝 Uso no Código

### Exemplo Básico

```javascript
import compressionService from '../services/compressionService';

// Comprimir imagem
const compressedImage = await compressionService.compressImage(uri, {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
});

// Comprimir vídeo
const compressedVideo = await compressionService.compressVideo(uri, {
  quality: 'medium',
  maxWidth: 1280,
  maxHeight: 1280,
});

// Comprimir automaticamente (detecta tipo)
const compressed = await compressionService.compressMedia(asset, 'image');
```

### Verificar se deve comprimir

```javascript
const shouldCompress = compressionService.shouldCompress(fileSize, 'image');
// Retorna true se fileSize > 2MB (imagens) ou > 10MB (vídeos)
```

## 🐛 Troubleshooting

### Vídeo não está sendo comprimido
- **Causa**: `react-native-compressor` não está disponível no Expo Go
- **Solução**: Fazer build customizada com `expo build` ou EAS Build

### Imagem não está sendo comprimida
- **Causa**: Arquivo menor que 2MB (não precisa comprimir)
- **Solução**: Normal, apenas arquivos grandes são comprimidos

### Erro ao comprimir
- **Causa**: Problema com permissões ou arquivo corrompido
- **Solução**: O sistema retorna o arquivo original em caso de erro

## 📈 Melhorias Futuras

- [ ] Adicionar opção para o usuário escolher qualidade de compressão
- [ ] Implementar compressão progressiva (mostrar preview durante compressão)
- [ ] Adicionar suporte para compressão em background
- [ ] Implementar cache de arquivos comprimidos
- [ ] Adicionar métricas de compressão (taxa de sucesso, tempo médio)

## 🔗 Referências

- [expo-image-manipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [react-native-compressor](https://github.com/Shobbak/react-native-compressor)
- [WhatsApp Compression Algorithm](https://www.whatsapp.com/faq/general/26000016)

