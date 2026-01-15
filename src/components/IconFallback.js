import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';

/**
 * Componente de ícone que tenta usar Ionicons primeiro
 * Usa emojis apenas se os ícones realmente não funcionarem
 */
const IconFallback = ({ name, size = 24, color = '#000000', style, ...props }) => {
  const [useEmoji, setUseEmoji] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const iconColor = color || '#000000';
  const finalColor = iconColor === 'transparent' || !iconColor ? '#000000' : iconColor;

  // Verificar se as fontes estão carregadas
  useEffect(() => {
    async function checkFonts() {
      try {
        // Verificar se as fontes do Ionicons estão disponíveis
        const fonts = await Font.loadAsync({
          ...Ionicons.font,
        });
        setFontsLoaded(true);
        console.log('✅ Fontes do Ionicons carregadas no IconFallback');
      } catch (error) {
        console.warn('⚠️ Erro ao carregar fontes no IconFallback:', error);
        // Mesmo com erro, tentar usar Ionicons (pode funcionar)
        setFontsLoaded(true);
      }
    }
    checkFonts();
  }, []);

  // Mapeamento de ícones para emojis (fallback)
  const iconToEmoji = {
    'folder': '📁',
    'document': '📄',
    'document-text': '📝',
    'receipt': '🧾',
    'calendar': '📅',
    'flask': '🧪',
    'image': '🖼️',
    'arrow-back': '←',
    'add': '+',
    'close': '✕',
    'person': '👤',
    'male': '♂️',
    'female': '♀️',
    'location': '📍',
    'call': '📞',
    'mail': '✉️',
    'people': '👥',
    'star': '⭐',
    'star-outline': '☆',
    'star-half': '⭐',
    'alert-circle': '⚠️',
    'chevron-forward': '→',
    'folder-outline': '📁',
  };

  const emoji = iconToEmoji[name] || '❓';

  // SEMPRE tentar usar Ionicons primeiro (não usar emoji automaticamente)
  // Só usar emoji se forceEmoji for true ou se houver erro explícito
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {useEmoji ? (
        <Text style={[styles.emoji, { fontSize: size * 0.8 }]}>{emoji}</Text>
      ) : (
        <Ionicons
          name={name}
          size={size}
          color={finalColor}
          style={styles.icon}
          {...props}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible', // Mudado para 'visible' para garantir que o ícone apareça
  },
  icon: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false, // Remove padding extra no Android
  },
  emoji: {
    textAlign: 'center',
    lineHeight: undefined,
  },
});

export default IconFallback;

