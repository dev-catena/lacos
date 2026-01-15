import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente de ícone robusto que garante renderização correta no Android
 * Inclui fallback e validação de nomes de ícones
 */
const RobustIcon = ({ name, size = 24, color = '#000000', style, ...props }) => {
  // Garantir que a cor não seja undefined
  const iconColor = color || '#000000';
  const finalColor = iconColor === 'transparent' || !iconColor ? '#000000' : iconColor;
  
  // Validar nome do ícone
  if (!name || typeof name !== 'string') {
    console.warn('RobustIcon: nome do ícone inválido:', name);
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <Text style={[styles.fallback, { fontSize: size * 0.6, color: finalColor }]}>?</Text>
      </View>
    );
  }

  // Lista de ícones válidos do Ionicons (comuns)
  const validIcons = [
    'folder', 'document', 'document-text', 'receipt', 'calendar', 
    'flask', 'image', 'arrow-back', 'add', 'close', 'person', 
    'male', 'female', 'location', 'call', 'mail', 'people',
    'star', 'star-outline', 'star-half', 'alert-circle'
  ];

  // Se o ícone não estiver na lista, tentar mesmo assim (pode ser válido)
  const iconName = name;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Ionicons
        name={iconName}
        size={size}
        color={finalColor}
        style={styles.icon}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  icon: {
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  fallback: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default RobustIcon;

