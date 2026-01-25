# 📸 Manual do Cuidador - Sistema de Mídias

## 🎯 O que é o Sistema de Mídias?

O Sistema de Mídias permite que **cuidadores** postem **fotos e vídeos** que aparecem automaticamente na tela inicial do **paciente** por **24 horas**.

É uma forma de compartilhar momentos especiais, lembretes visuais, ou simplesmente alegrar o dia do paciente!

---

## 📱 Como Acessar (Cuidador)

### Opção 1: Aba de Mídias (Menu Inferior)

```
┌─────────────────────────────────┐
│                                 │
│        Tela do App              │
│                                 │
└─────────────────────────────────┘
 [Início] [Grupos] [🎬Mídias] [🔔]
                     ↑
                 Toque aqui
```

**Localização:** 3ª aba no menu inferior  
**Ícone:** 🎬 Imagens  
**Nome:** Mídias

---

## 📸 Como Postar uma Foto ou Vídeo

### Passo a Passo:

1. **Abra a aba "Mídias"** no menu inferior

2. **Toque no botão "+" (flutuante)** no canto inferior direito

3. **Escolha o tipo:**
   - 📷 **Escolher Foto** - Selecione uma imagem da galeria
   - 🎥 **Escolher Vídeo** - Selecione um vídeo da galeria

4. **Selecione o arquivo** da galeria do seu dispositivo

5. **Aguarde o upload** (barra de progresso aparecerá)

6. **Pronto!** A mídia aparecerá:
   - ✅ Na sua lista de mídias
   - ✅ No carrossel do paciente

---

## 🎬 O que o Paciente Vê

Quando você posta uma mídia, ela aparece **automaticamente** na tela inicial do paciente:

```
┌─────────────────────────────────────┐
│  📞 Contatos Rápidos                │
│  [Contato 1] [Contato 2]            │
│  [Contato 3] [🚨 SOS]               │
├─────────────────────────────────────┤
│  🎬 Momentos Recentes           [3] │
│  ┌─────────┬─────────┬─────────┐   │
│  │ Foto 1  │ Foto 2  │ Vídeo 1 │   │
│  │ 2h ⏰   │ 5h ⏰   │ 10h ⏰  │   │
│  └─────────┴─────────┴─────────┘   │
│  ← Deslize para ver →              │
└─────────────────────────────────────┘
```

**Características:**
- ✅ Cards grandes e visuais
- ✅ Rolagem horizontal suave
- ✅ Contador regressivo (horas restantes)
- ✅ Seu nome aparece como autor
- ✅ Descrição opcional

---

## ⏰ Sistema de Expiração (24h)

### Como Funciona:

**Quando você posta:**
- Mídia é criada com timestamp
- Aparece instantaneamente para o paciente
- Contador inicia: "24h restantes"

**Durante as 24 horas:**
- ⏰ 23h restantes
- ⏰ 20h restantes
- ⏰ 10h restantes
- ⏰ 2h restantes

**Após 24 horas:**
- ❌ Mídia desaparece automaticamente do carrossel
- ❌ Removida do servidor (cron job)
- ✅ Não ocupa espaço desnecessário

---

## 🗑️ Como Remover uma Mídia

Você pode remover uma mídia **antes** de expirar:

### Método 1: Pressionar e Segurar
1. Na tela de Mídias (cuidador)
2. **Pressione e segure** a mídia
3. Confirme a remoção

### Método 2: Ícone de Lixeira
1. Na tela de Mídias
2. Toque no **ícone de lixeira** no card
3. Confirme a remoção

**Efeito:**
- ✅ Mídia removida da sua lista
- ✅ Desaparece do carrossel do paciente
- ✅ Arquivo deletado do servidor

---

## 📊 Visualizar Suas Mídias

### Tela de Mídias (Cuidador)

```
┌─────────────────────────────────┐
│   Mídias do Grupo               │
├─────────────────────────────────┤
│ ℹ️ Mídias aparecem por 24h      │
├─────────────────────────────────┤
│  [Foto 1]    [Vídeo 1]          │
│  12h ⏰      20h ⏰              │
│  Por você    Por você           │
│                                 │
│  [Foto 2]    [Foto 3]           │
│  2h ⏰       Expirada            │
│  Por Maria   Por você           │
└─────────────────────────────────┘
              [+] ← Adicionar
```

**Informações exibidas:**
- Thumbnail da foto/vídeo
- Tempo restante até expirar
- Data/hora de postagem
- Quem postou
- Botão de deletar

---

## 🎨 Tipos de Mídia Suportados

### Fotos (Imagens)
- ✅ JPG, JPEG, PNG, GIF
- ✅ Tamanho máximo: **10 MB**
- ✅ Edição/crop disponível antes do upload
- ✅ Otimização automática

### Vídeos
- ✅ MP4, MOV
- ✅ Tamanho máximo: **50 MB**
- ✅ Qualidade ajustada automaticamente (70%)
- ✅ Ícone de play no carrossel

---

## 💡 Dicas de Uso

### Boas Práticas:

**📅 Momentos Especiais:**
- Aniversários
- Visitas da família
- Passeios
- Refeições especiais

**🎓 Lembretes Visuais:**
- "Lembre-se de beber água"
- "Hora da caminhada"
- Instruções com imagens

**❤️ Carinho e Motivação:**
- Mensagens positivas
- Fotos da família
- Momentos felizes

**⚠️ O que EVITAR:**
- Vídeos muito longos (>2 min)
- Arquivos muito pesados
- Conteúdo repetitivo
- Mais de 4 mídias por dia (lotam o carrossel)

---

## 🔄 Atualizar Lista de Mídias

### Pull to Refresh:
- Na tela de Mídias
- **Puxe para baixo** para atualizar
- Mídias recentes aparecerão no topo

---

## 👥 Múltiplos Grupos

Se você administra **mais de um grupo**, pode escolher para qual grupo postar:

```
┌─────────────────────────────────┐
│ Grupo: Família Silva      [▼]  │
├─────────────────────────────────┤
│  [Mídias deste grupo]           │
└─────────────────────────────────┘
```

**Seletor de Grupo:**
- Aparece no topo da tela
- Toque para escolher outro grupo
- Mídias são separadas por grupo

---

## 📱 Interface Completa do Cuidador

### Menu Inferior (Bottom Tabs):

```
1. 🏠 Início       - Dashboard e atividades
2. 👥 Grupos       - Gerenciar grupos
3. 🎬 Mídias       - Upload de fotos/vídeos
4. 🔔 Notificações - Alertas e lembretes
```

**Ordem:** Início → Grupos → **Mídias** → Notificações

---

## ⚙️ Requisitos Técnicos

### Permissões Necessárias:
- ✅ Acesso à galeria de fotos
- ✅ Ser **administrador** do grupo
- ✅ Conexão com internet (para upload)

### Compatibilidade:
- ✅ Android 5.0+
- ✅ iOS 13.0+
- ✅ Tablets e smartphones

---

## 🆘 Problemas Comuns

### "Funcionalidade ainda não está disponível"
- ❌ Backend não está configurado
- ✅ Espere o administrador do sistema configurar

### "Você precisa ser administrador do grupo"
- ❌ Seu perfil no grupo não é admin
- ✅ Peça ao criador do grupo para promovê-lo

### Upload não funciona
- Verifique conexão com internet
- Tente com arquivo menor
- Verifique permissões da galeria

### Mídia não aparece para paciente
- Aguarde alguns segundos (sincronização)
- Paciente deve recarregar a tela
- Verificar se paciente está no mesmo grupo

---

## 📊 Limites e Regras

| Item | Limite |
|------|--------|
| Fotos | 10 MB cada |
| Vídeos | 50 MB cada |
| Duração | 24 horas |
| Mídias por grupo | Recomendado: 4 ativas |
| Grupos | Ilimitado (se admin) |

---

## 🎯 Fluxo Completo

```
CUIDADOR                          PACIENTE
   │                                 │
   │ 1. Abre aba "Mídias"            │
   │ 2. Toca no "+"                  │
   │ 3. Escolhe foto                 │
   │ 4. Faz upload ──────────────────┼─→ Recebe notificação
   │                                 │
   │ ✅ Upload concluído             │   5. Abre app
   │                                 │   6. Vê carrossel
   │                                 │   7. Desliza fotos
   │                                 │
   │ Após 24h:                       │
   │ ❌ Mídia expira ────────────────┼─→ Mídia desaparece
   │ 🗑️ Deletada automaticamente     │
```

---

## ✅ Checklist do Cuidador

Antes de começar:
- [ ] Sou administrador do grupo
- [ ] Tenho fotos/vídeos para compartilhar
- [ ] App está atualizado
- [ ] Backend está funcionando (sem erro 404)

Ao postar:
- [ ] Escolhi foto/vídeo apropriado
- [ ] Arquivo tem tamanho adequado (<10MB fotos, <50MB vídeos)
- [ ] Adicionei descrição (opcional)
- [ ] Upload concluído com sucesso

Após postar:
- [ ] Mídia aparece na minha lista
- [ ] Verifiquei que aparece para o paciente
- [ ] Contador de 24h está funcionando

---

## 🎉 Benefícios

**Para o Paciente:**
- ❤️ Sente-se mais conectado à família
- 😊 Recebe conteúdo visual alegre
- 📅 Lembrete visual de eventos
- 🏠 Sensação de proximidade

**Para o Cuidador:**
- 📸 Compartilha momentos facilmente
- ⏰ Sistema automático (sem esforço)
- 🗑️ Limpeza automática (24h)
- 📊 Controle total sobre o conteúdo

---

## 🚀 Começe Agora!

1. **Abra o app** como Cuidador
2. **Toque na aba "Mídias"** 🎬
3. **Toque no botão "+"**
4. **Escolha uma foto bonita**
5. **Faça upload**
6. **Veja o sorriso do paciente!** 😊

---

**O Sistema de Mídias torna o cuidado mais humano e conectado!** ❤️📸✨

