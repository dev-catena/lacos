# Prompt para Correção de Ícones no Android

## Problema
Os ícones não aparecem no Android (aparecem retângulos com 'x' no meio). Isso acontece quando a tela usa `Ionicons` diretamente ao invés de usar `SafeIcon` com SVGs customizados.

## Técnica que Funciona

### Solução Aplicada com Sucesso:
1. **Substituir todos os `Ionicons` por `SafeIcon`** na tela problemática
2. **Garantir que os ícones usados estejam mapeados no `SafeIcon.js`**
3. **Adicionar mapeamentos faltantes** se necessário

### Exemplo de Correção:

**ANTES (não funciona no Android):**
```javascript
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="document-text" size={24} color={colors.primary} />
```

**DEPOIS (funciona no Android):**
```javascript
import SafeIcon from '../../components/SafeIcon';

<SafeIcon name="document-text" size={24} color={colors.primary} />
```

## Prompt para Usar

```
Os ícones não estão aparecendo no Android na tela [NOME_DA_TELA]. 
Aplique a técnica que já funcionou antes:

1. Verifique se a tela está usando Ionicons diretamente
2. Substitua TODOS os Ionicons por SafeIcon
3. Verifique se os nomes dos ícones usados estão mapeados no SafeIcon.js
4. Se algum ícone não estiver mapeado, adicione o mapeamento no SafeIcon.js usando os SVGs customizados do CustomIcons.js

Lembre-se: A tela de Receitas funciona porque usa SafeIcon. Compare com ela se necessário.

Ícones que precisam estar mapeados no SafeIcon:
- folder → FolderIcon
- receipt → ReceiptIcon  
- calendar → CalendarIcon
- flask → FlaskIcon
- image → ImageIcon
- document-text → DocumentIcon
- document → DocumentIcon
- document-attach → DocumentAttachIcon
- E outros conforme necessário

Aplique a correção seguindo o mesmo padrão usado nas telas de Receitas e Arquivos.
```

## Checklist de Correção

- [ ] Identificar a tela com problema de ícones
- [ ] Verificar se usa `Ionicons` diretamente
- [ ] Importar `SafeIcon` na tela
- [ ] Substituir todos os `<Ionicons>` por `<SafeIcon>`
- [ ] Verificar se os nomes dos ícones estão mapeados em `SafeIcon.js`
- [ ] Adicionar mapeamentos faltantes em `SafeIcon.js` (importar do `CustomIcons.js` se necessário)
- [ ] Verificar se não há imports duplicados no `SafeIcon.js`
- [ ] Testar no Android

## Arquivos Importantes

- **Componente principal**: `src/components/SafeIcon.js`
- **Ícones customizados**: `src/components/CustomIcons.js`
- **Exemplo que funciona**: `src/screens/Prescriptions/PrescriptionsScreen.js`
- **Outro exemplo**: `src/screens/Documents/DocumentsScreen.js`

## Notas Importantes

1. **Nunca use `Ionicons` diretamente no Android** - sempre use `SafeIcon`
2. **SafeIcon tenta usar SVG customizado primeiro**, depois faz fallback para Ionicons
3. **Se um ícone não estiver mapeado**, o SafeIcon tentará usar Ionicons, que pode não funcionar no Android
4. **Sempre verifique imports duplicados** após adicionar novos ícones ao SafeIcon

## Comando Rápido para Verificar

```bash
# Verificar se uma tela usa Ionicons diretamente
grep -n "Ionicons" src/screens/[NOME_DA_TELA]/[ARQUIVO].js

# Verificar se um ícone está mapeado no SafeIcon
grep -n "nome-do-icone" src/components/SafeIcon.js
```

