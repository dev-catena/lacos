import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

const DrawerHeader = ({ title, showBack = false }) => {
  const navigation = useNavigation();

  const handleMenuPress = () => {
    if (Platform.OS === 'android') {
      navigation.openDrawer();
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Botão Voltar ou Menu */}
        {showBack ? (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : Platform.OS === 'android' ? (
          <TouchableOpacity
            onPress={handleMenuPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={28} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconButton} />
        )}

        {/* Título */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Espaço reservado para manter o título centralizado */}
        <View style={styles.iconButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    minHeight: 56,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
});

export default DrawerHeader;

