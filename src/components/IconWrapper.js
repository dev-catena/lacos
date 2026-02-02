import React from 'react';
import { Platform, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Wrapper para ícones que garante renderização correta em todas as plataformas
 * Especialmente útil para web onde os ícones podem não carregar
 */
const IconWrapper = ({ name, size = 24, color = '#000000', style, ...props }) => {
  // No web, garantir que o ícone seja renderizado com fallback
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webContainer, { width: size, height: size }]}>
        <Ionicons
          name={name}
          size={size}
          color={color}
          style={[styles.icon, style]}
          {...props}
        />
        {/* Fallback: se o ícone não aparecer, mostrar texto */}
        <Text style={[styles.fallback, { fontSize: size * 0.5, color }]} accessibilityLabel={name}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  // Em outras plataformas, usar normalmente
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      style={style}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  webContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    // Garantir que o ícone seja visível no web
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 1,
  },
  fallback: {
    position: 'absolute',
    zIndex: 0,
    opacity: 0.3, // Só aparece se o ícone não carregar
  },
});

export default IconWrapper;

