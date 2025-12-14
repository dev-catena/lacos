# 🎨 Guia de Ícones SVG Personalizados - App Laços

## 📦 Localização

**Arquivo:** `/home/darley/lacos/src/components/CustomIcons.js`

Todos os ícones SVG personalizados estão em um único arquivo, otimizados para o contexto de cuidados com idosos.

---

## 🎯 Categorias de Ícones

### 1. Ações Rápidas (Home Screen)

#### 💊 MedicationIcon
**Uso:** Registrar medicação
```jsx
import { MedicationIcon } from '../components/CustomIcons';

<MedicationIcon size={24} color="#6366f1" />
```

#### 💓 VitalSignsIcon
**Uso:** Sinais vitais (pressão, temperatura, glicose)
```jsx
<VitalSignsIcon size={24} color="#ec4899" />
```

#### 📅 AppointmentIcon
**Uso:** Agendar consultas médicas
```jsx
<AppointmentIcon size={24} color="#3b82f6" />
```

#### 💬 MessagesIcon
**Uso:** Chat entre cuidadores
```jsx
<MessagesIcon size={24} color="#10b981" />
```

---

### 2. Navegação (Bottom Tabs)

#### 🏠 HomeIcon
**Uso:** Aba Home
```jsx
<HomeIcon size={24} color="#6366f1" filled={true} />
<HomeIcon size={24} color="#9ca3af" filled={false} /> {/* Não selecionado */}
```

#### 👥 GroupsIcon
**Uso:** Aba Grupos
```jsx
<GroupsIcon size={24} color="#6366f1" filled={true} />
```

#### 🔔 NotificationIcon
**Uso:** Aba Notificações
```jsx
<NotificationIcon size={24} color="#6366f1" filled={true} />
```

#### 👤 ProfileIcon
**Uso:** Aba Perfil
```jsx
<ProfileIcon size={24} color="#6366f1" filled={true} />
```

---

### 3. Ícones Funcionais

#### 🧓 ElderlyIcon
**Uso:** Pessoa acompanhada/idoso
```jsx
<ElderlyIcon size={32} color="#6366f1" />
```

#### 🏥 EmergencyIcon
**Uso:** Situações de emergência
```jsx
<EmergencyIcon size={28} color="#ef4444" />
```

#### 📋 MedicalHistoryIcon
**Uso:** Histórico médico
```jsx
<MedicalHistoryIcon size={24} color="#6366f1" />
```

#### 🎯 InviteCodeIcon
**Uso:** Código de convite (Caso de Uso 3)
```jsx
<InviteCodeIcon size={40} color="#6366f1" />
```

#### 👨‍⚕️ CaregiverIcon
**Uso:** Cuidador/membro do grupo
```jsx
<CaregiverIcon size={28} color="#6366f1" />
```

#### 📱 CompanionAppIcon
**Uso:** App companion para idosos
```jsx
<CompanionAppIcon size={32} color="#6366f1" />
```

#### ⚙️ PermissionsIcon
**Uso:** Configurações de permissões
```jsx
<PermissionsIcon size={24} color="#6366f1" />
```

#### ✅ SuccessIcon
**Uso:** Feedback de sucesso
```jsx
<SuccessIcon size={48} color="#10b981" />
```

#### ❌ ErrorIcon
**Uso:** Feedback de erro
```jsx
<ErrorIcon size={48} color="#ef4444" />
```

#### 📤 ShareIcon
**Uso:** Compartilhar informações
```jsx
<ShareIcon size={24} color="#6366f1" />
```

#### 📍 LocationIcon
**Uso:** Endereço, localização
```jsx
<LocationIcon size={24} color="#ef4444" />
```

---

## 🎨 Paleta de Cores Sugerida

```javascript
const iconColors = {
  primary: '#6366f1',    // Roxo/Azul principal
  secondary: '#ec4899',  // Rosa
  success: '#10b981',    // Verde
  error: '#ef4444',      // Vermelho
  info: '#3b82f6',       // Azul
  warning: '#f59e0b',    // Laranja
  gray: '#9ca3af',       // Cinza (desativado)
};
```

---

## 📍 Onde Usar Cada Ícone

### Home Screen
```jsx
import {
  MedicationIcon,
  VitalSignsIcon,
  AppointmentIcon,
  MessagesIcon,
} from '../components/CustomIcons';

// Ações Rápidas
<MedicationIcon size={24} color={colors.primary} />
<VitalSignsIcon size={24} color={colors.secondary} />
<AppointmentIcon size={24} color={colors.info} />
<MessagesIcon size={24} color={colors.success} />
```

### Navegação (Bottom Tabs)
```jsx
import {
  HomeIcon,
  GroupsIcon,
  NotificationIcon,
  ProfileIcon,
} from '../components/CustomIcons';

// No tabBarIcon:
tabBarIcon: ({ focused, color }) => (
  <HomeIcon size={24} color={color} filled={focused} />
)
```

### Tela de Grupos
```jsx
import {
  GroupsIcon,
  ElderlyIcon,
  CaregiverIcon,
  InviteCodeIcon,
} from '../components/CustomIcons';

// Card de grupo
<GroupsIcon size={32} color={colors.primary} filled={true} />

// Pessoa acompanhada
<ElderlyIcon size={40} color={colors.primary} />

// Cuidador
<CaregiverIcon size={32} color={colors.secondary} />

// Código de convite
<InviteCodeIcon size={48} color={colors.primary} />
```

### Tela de Criar Grupo (Caso de Uso 2)
```jsx
import {
  ElderlyIcon,
  MedicalHistoryIcon,
  LocationIcon,
  CompanionAppIcon,
} from '../components/CustomIcons';

// Formulário da pessoa acompanhada
<ElderlyIcon size={64} color={colors.primary} />

// Seção de histórico médico
<MedicalHistoryIcon size={32} color={colors.info} />

// Endereço
<LocationIcon size={24} color={colors.error} />

// Código para app companion
<CompanionAppIcon size={48} color={colors.success} />
```

### Tela de Adicionar Cuidador (Caso de Uso 3)
```jsx
import {
  InviteCodeIcon,
  CaregiverIcon,
  ShareIcon,
  SuccessIcon,
} from '../components/CustomIcons';

// Gerar código
<InviteCodeIcon size={80} color={colors.primary} />

// Lista de cuidadores
<CaregiverIcon size={28} color={colors.secondary} />

// Compartilhar código
<ShareIcon size={24} color={colors.info} />

// Convite aceito
<SuccessIcon size={64} color={colors.success} />
```

### Estados Vazios
```jsx
import {
  GroupsIcon,
  MedicalHistoryIcon,
  MessagesIcon,
} from '../components/CustomIcons';

// Sem grupos
<GroupsIcon size={64} color={colors.gray} filled={false} />

// Sem histórico
<MedicalHistoryIcon size={64} color={colors.gray} />

// Sem mensagens
<MessagesIcon size={64} color={colors.gray} />
```

### Alertas e Modals
```jsx
import {
  SuccessIcon,
  ErrorIcon,
  EmergencyIcon,
} from '../components/CustomIcons';

// Sucesso
<SuccessIcon size={56} color={colors.success} />

// Erro
<ErrorIcon size={56} color={colors.error} />

// Emergência
<EmergencyIcon size={56} color={colors.error} />
```

---

## 🔄 Como Substituir os Ícones Atuais

### Exemplo 1: Home Screen - Ações Rápidas

**Antes:**
```jsx
<Icon name="medical" size={24} color={colors.primary} />
```

**Depois:**
```jsx
import { MedicationIcon } from '../../components/CustomIcons';

<MedicationIcon size={24} color={colors.primary} />
```

### Exemplo 2: Bottom Tabs

**Antes:**
```jsx
import Icon from 'react-native-vector-icons/Ionicons';

tabBarIcon: ({ color }) => (
  <Icon name="home" size={24} color={color} />
)
```

**Depois:**
```jsx
import { HomeIcon } from '../components/CustomIcons';

tabBarIcon: ({ focused, color }) => (
  <HomeIcon size={24} color={color} filled={focused} />
)
```

---

## 🎯 Vantagens dos Ícones Customizados

✅ **Temáticos:** Específicos para cuidados com idosos  
✅ **Consistentes:** Mesmo estilo visual  
✅ **Leves:** SVG otimizado  
✅ **Personalizáveis:** Tamanho e cor dinâmicos  
✅ **Semânticos:** Significado claro  
✅ **Acessíveis:** Fácil de entender  

---

## 📝 Exemplos Práticos

### Card de Ação com Ícone Custom
```jsx
import { MedicationIcon } from '../components/CustomIcons';

<TouchableOpacity style={styles.actionCard}>
  <View style={styles.iconContainer}>
    <MedicationIcon size={32} color={colors.primary} />
  </View>
  <Text style={styles.actionText}>Registrar Medicação</Text>
</TouchableOpacity>
```

### Header com Ícone Custom
```jsx
import { ElderlyIcon } from '../components/CustomIcons';

<View style={styles.header}>
  <ElderlyIcon size={40} color={colors.primary} />
  <Text style={styles.title}>Pessoa Acompanhada</Text>
</View>
```

### Estado Vazio com Ícone Custom
```jsx
import { GroupsIcon } from '../components/CustomIcons';

<View style={styles.emptyState}>
  <GroupsIcon size={80} color={colors.gray} filled={false} />
  <Text style={styles.emptyTitle}>Nenhum grupo ainda</Text>
  <Text style={styles.emptyText}>Crie um grupo para começar</Text>
</View>
```

### Modal de Sucesso
```jsx
import { SuccessIcon } from '../components/CustomIcons';

<Modal visible={showSuccess}>
  <View style={styles.modalContent}>
    <SuccessIcon size={80} color={colors.success} />
    <Text style={styles.modalTitle}>Grupo criado com sucesso!</Text>
    <Text style={styles.modalText}>
      O código de convite foi gerado
    </Text>
  </View>
</Modal>
```

---

## 🔧 Customização Avançada

### Adicionar Animação
```jsx
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: withSpring(pressed ? 0.9 : 1) }],
}));

<Animated.View style={animatedStyle}>
  <MedicationIcon size={32} color={colors.primary} />
</Animated.View>
```

### Badge com Ícone
```jsx
<View style={styles.iconWithBadge}>
  <NotificationIcon size={28} color={colors.primary} filled={true} />
  <View style={styles.badge}>
    <Text style={styles.badgeText}>3</Text>
  </View>
</View>
```

---

## 📚 Todos os Ícones Disponíveis

| Ícone | Nome | Uso Principal |
|-------|------|---------------|
| 💊 | MedicationIcon | Medicações |
| 💓 | VitalSignsIcon | Sinais vitais |
| 📅 | AppointmentIcon | Consultas |
| 💬 | MessagesIcon | Mensagens |
| 🏠 | HomeIcon | Home (navegação) |
| 👥 | GroupsIcon | Grupos (navegação) |
| 🔔 | NotificationIcon | Notificações |
| 👤 | ProfileIcon | Perfil |
| 🧓 | ElderlyIcon | Pessoa idosa |
| 🏥 | EmergencyIcon | Emergência |
| 📋 | MedicalHistoryIcon | Histórico médico |
| 🎯 | InviteCodeIcon | Códigos de convite |
| 👨‍⚕️ | CaregiverIcon | Cuidador |
| 📱 | CompanionAppIcon | App companion |
| ⚙️ | PermissionsIcon | Permissões |
| ✅ | SuccessIcon | Sucesso |
| ❌ | ErrorIcon | Erro |
| 📤 | ShareIcon | Compartilhar |
| 📍 | LocationIcon | Localização |

---

## 🎨 Próximos Passos

1. **Substituir na Home:** Trocar ícones do Ionicons pelos customizados
2. **Aplicar nos Tabs:** Usar ícones personalizados na navegação
3. **Telas de Grupos:** Aplicar ícones temáticos
4. **Estados Vazios:** Usar ícones consistentes
5. **Modals e Alertas:** Feedback visual com ícones custom

---

**Criado em:** 21/11/2025  
**Ícones:** 19 ícones SVG personalizados  
**Status:** ✅ Pronto para uso!

