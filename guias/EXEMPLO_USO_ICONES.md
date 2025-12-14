# 📱 Exemplo: Como Usar os Ícones Custom na Home Screen

## Antes vs Depois

### ANTES (com Ionicons genéricos)
```jsx
<Icon name="medical" size={24} color={colors.primary} />
<Icon name="fitness" size={24} color={colors.secondary} />
<Icon name="calendar" size={24} color={colors.info} />
<Icon name="chatbubbles" size={24} color={colors.success} />
```

### DEPOIS (com ícones personalizados)
```jsx
<MedicationIcon size={24} color={colors.primary} />
<VitalSignsIcon size={24} color={colors.secondary} />
<AppointmentIcon size={24} color={colors.info} />
<MessagesIcon size={24} color={colors.success} />
```

---

## 🔧 Passo a Passo para Aplicar

### 1. Adicionar Import no HomeScreen.js

```javascript
// No topo do arquivo
import {
  MedicationIcon,
  VitalSignsIcon,
  AppointmentIcon,
  MessagesIcon,
} from '../../components/CustomIcons';
```

### 2. Substituir os Ícones das Ações Rápidas

**Localização:** `src/screens/Home/HomeScreen.js` - linha ~86

**SUBSTITUIR ESTE BLOCO:**
```jsx
<TouchableOpacity 
  style={styles.actionCard}
  onPress={handleMedication}
  activeOpacity={0.7}
>
  <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
    <Icon name="medical" size={24} color={colors.primary} />
  </View>
  <Text style={styles.actionText}>Registrar Medicação</Text>
</TouchableOpacity>
```

**POR ESTE:**
```jsx
<TouchableOpacity 
  style={styles.actionCard}
  onPress={handleMedication}
  activeOpacity={0.7}
>
  <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
    <MedicationIcon size={28} color={colors.primary} />
  </View>
  <Text style={styles.actionText}>Registrar Medicação</Text>
</TouchableOpacity>
```

### 3. Fazer o Mesmo para os Outros 3 Cards

**Sinais Vitais:**
```jsx
<VitalSignsIcon size={28} color={colors.secondary} />
```

**Agendar Consulta:**
```jsx
<AppointmentIcon size={28} color={colors.info} />
```

**Mensagens:**
```jsx
<MessagesIcon size={28} color={colors.success} />
```

---

## 📱 Exemplo Completo Atualizado

```jsx
{/* Ações Rápidas */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Ações Rápidas</Text>
  <View style={styles.quickActions}>
    
    {/* Medicação */}
    <TouchableOpacity 
      style={styles.actionCard}
      onPress={handleMedication}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
        <MedicationIcon size={28} color={colors.primary} />
      </View>
      <Text style={styles.actionText}>Registrar Medicação</Text>
    </TouchableOpacity>

    {/* Sinais Vitais */}
    <TouchableOpacity 
      style={styles.actionCard}
      onPress={handleVitalSigns}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: colors.secondary + '20' }]}>
        <VitalSignsIcon size={28} color={colors.secondary} />
      </View>
      <Text style={styles.actionText}>Sinais Vitais</Text>
    </TouchableOpacity>

    {/* Consulta */}
    <TouchableOpacity 
      style={styles.actionCard}
      onPress={handleAppointment}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: colors.info + '20' }]}>
        <AppointmentIcon size={28} color={colors.info} />
      </View>
      <Text style={styles.actionText}>Agendar Consulta</Text>
    </TouchableOpacity>

    {/* Mensagens */}
    <TouchableOpacity 
      style={styles.actionCard}
      onPress={handleMessages}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: colors.success + '20' }]}>
        <MessagesIcon size={28} color={colors.success} />
      </View>
      <Text style={styles.actionText}>Mensagens</Text>
    </TouchableOpacity>
    
  </View>
</View>
```

---

## 🎨 Resultado Visual

### Antes
- ❌ Ícones genéricos
- ❌ Pouco relacionado ao contexto
- ❌ Mesma aparência de outros apps

### Depois
- ✅ Ícones temáticos (medicação com frasco, sinais vitais com coração batendo)
- ✅ Totalmente relacionado ao contexto de cuidados
- ✅ Visual único e personalizado

---

## 🔄 Aplicar em Outras Telas

### Bottom Tabs (AppNavigator.js)

**Antes:**
```jsx
import Icon from 'react-native-vector-icons/Ionicons';

tabBarIcon: ({ focused, color }) => (
  <Icon name={focused ? 'home' : 'home-outline'} size={24} color={color} />
)
```

**Depois:**
```jsx
import { HomeIcon } from '../components/CustomIcons';

tabBarIcon: ({ focused, color }) => (
  <HomeIcon size={24} color={color} filled={focused} />
)
```

### Tela de Grupos (GroupsScreen.js)

**Estado Vazio - Antes:**
```jsx
<Icon name="people-outline" size={48} color={colors.gray300} />
```

**Estado Vazio - Depois:**
```jsx
import { GroupsIcon, ElderlyIcon } from '../../components/CustomIcons';

<GroupsIcon size={64} color={colors.gray300} filled={false} />
```

**Card de Grupo - Adicionar:**
```jsx
<ElderlyIcon size={32} color={colors.primary} />
<Text>Pessoa Acompanhada</Text>
```

---

## 🎯 Checklist de Implementação

- [ ] Adicionar imports no HomeScreen.js
- [ ] Substituir ícone de Medicação
- [ ] Substituir ícone de Sinais Vitais
- [ ] Substituir ícone de Consulta
- [ ] Substituir ícone de Mensagens
- [ ] Recarregar app no celular
- [ ] Testar cada botão
- [ ] Verificar visual

### Para as outras telas:
- [ ] Atualizar Bottom Tabs (AppNavigator.js)
- [ ] Atualizar GroupsScreen.js
- [ ] Atualizar NotificationsScreen.js
- [ ] Atualizar ProfileScreen.js

---

## 📸 Preview dos Novos Ícones

```
💊 MedicationIcon     - Frasco de remédio com cruz médica
💓 VitalSignsIcon     - Coração com linha de batimento
📅 AppointmentIcon    - Calendário com cruz médica
💬 MessagesIcon       - Balões de conversa com pontinhos

🏠 HomeIcon          - Casa acolhedora
👥 GroupsIcon        - Grupo de pessoas
🔔 NotificationIcon  - Sino
👤 ProfileIcon       - Pessoa

🧓 ElderlyIcon       - Pessoa idosa com bengala
🏥 EmergencyIcon     - Cruz de emergência em escudo
📋 MedicalHistoryIcon - Prancheta médica
🎯 InviteCodeIcon    - Ticket/código de barras
```

---

## 🚀 Testar Agora

```bash
# No terminal do Expo, pressione:
r  # Recarregar app
```

Ou no celular:
1. Agite o celular
2. Menu → "Reload"

---

**Data:** 21/11/2025  
**Ícones:** 19 disponíveis  
**Status:** ✅ Pronto para aplicar!

