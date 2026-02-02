import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

// Componente reutilizável para o logo
// Por enquanto usando texto estilizado, os SVGs estão disponíveis em assets/
const Logo = ({ size = 'medium', variant = 'full', color = '#59a02c' }) => {
  const sizes = {
    small: { fontSize: 20, iconSize: 16 },
    medium: { fontSize: 28, iconSize: 24 },
    large: { fontSize: 36, iconSize: 32 },
  };

  const currentSize = sizes[size];

  if (variant === 'icon') {
    return (
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, { fontSize: currentSize.iconSize * 1.5 }]}>🤝</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={[styles.icon, { fontSize: currentSize.iconSize }]}>🤝</Text>
        <Text style={[styles.logoText, { fontSize: currentSize.fontSize, color }]}>
          laços
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    // Emoji como ícone temporário
  },
  logoText: {
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default Logo;

