import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '../constants/colors';

const DrawerToggleButton = ({ color = colors.text, size = 28 }) => {
  const navigation = useNavigation();

  // Só mostrar no Android
  if (Platform.OS !== 'android') {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => navigation.toggleDrawer()}
      style={{
        padding: 8,
        marginRight: 8,
      }}
      activeOpacity={0.7}
    >
      <Ionicons name="menu" size={size} color={color} />
    </TouchableOpacity>
  );
};

export default DrawerToggleButton;

