# 📄 Onde Aparece o PDF do Atestado?

## 📍 Localização do PDF

O PDF do atestado médico gerado aparece na **tela de "Arquivos" (Documents)** do aplicativo.

### Como Acessar:

1. **Navegue até a aba "Arquivos"** (ícone de pasta na barra inferior)
2. **Filtre por "Laudo"** (o atestado é salvo como tipo `report`)
3. **Ou visualize "Todos"** os documentos

## 🎯 Caminho Completo:

```
App → Aba "Arquivos" → Categoria "Laudo" → Atestado Médico
```

## 📋 Detalhes do Documento:

Quando você clicar no documento, verá:
- **Título**: "Atestado Médico - [Nome do Paciente]"
- **Data**: Data de geração
- **Médico**: Nome do médico que gerou
- **Tipo**: Laudo (report)
- **Opção de Download**: Botão para baixar o PDF

## 🔍 Informações Técnicas:

- **Tipo no banco**: `report`
- **Localização no backend**: `/storage/app/temp/certificate_[hash].pdf`
- **URL de validação**: Inclui QR Code para validação digital
- **Assinatura digital**: O PDF inclui assinatura digital do médico

## ✅ Após Gerar o Atestado:

Após gerar o atestado com sucesso, você verá um alerta perguntando se deseja:
- **"Ver Documento"**: Navega diretamente para a tela de Arquivos
- **"Continuar"**: Continua na videochamada

## 💡 Dica:

Se você não encontrar o documento imediatamente:
1. Recarregue a tela de Arquivos (puxe para baixo)
2. Verifique se está no grupo correto
3. Filtre por "Laudo" para ver apenas atestados






