import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

const ExpandableFAB = ({ navigation, state }) => {
  console.log('🎈 ExpandableFAB - Renderizando FAB');
  console.log('🎈 ExpandableFAB - Navigation:', navigation ? 'OK' : 'UNDEFINED');
  console.log('🎈 ExpandableFAB - State:', state);
  
  const insets = useSafeAreaInsets();
  console.log('📐 ExpandableFAB - Safe Area Insets:', insets);
  console.log('📐 ExpandableFAB - Bottom inset (Navigation Bar):', insets.bottom);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(animation, {
        toValue,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(rotation, {
        toValue,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    setIsExpanded(!isExpanded);
  };

  const navigateTo = (routeName) => {
    console.log('🧭 ExpandableFAB - Navegando para:', routeName);
    try {
      if (navigation && navigation.navigate) {
        navigation.navigate(routeName);
        toggleMenu();
        console.log('✅ ExpandableFAB - Navegação bem-sucedida');
      } else {
        console.error('❌ ExpandableFAB - Navigation não disponível');
      }
    } catch (error) {
      console.error('❌ ExpandableFAB - Erro ao navegar:', error);
    }
  };

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const menuItems = [
    {
      name: 'Home',
      label: 'Início',
      icon: 'home',
      color: colors.primary,
      index: 0,
    },
    {
      name: 'Groups',
      label: 'Grupos',
      icon: 'people',
      color: colors.secondary,
      index: 1,
    },
    {
      name: 'Notifications',
      label: 'Notificações',
      icon: 'notifications',
      color: colors.warning,
      index: 2,
    },
  ];

  // Obter rota atual de forma segura
  let currentRoute = 'Home'; // Default
  
  if (state && state.routes && state.routes[state.index]) {
    currentRoute = state.routes[state.index].name;
    console.log('🎈 ExpandableFAB - Rota atual:', currentRoute);
  } else {
    console.warn('⚠️ ExpandableFAB - State inválido, usando rota padrão');
  }
  
  console.log('✅ ExpandableFAB - Renderizando botão flutuante!');
  console.log('✅ ExpandableFAB - Estilo: position absolute, sem tabBar nativo');
  
  // Calcular bottom position respeitando a Navigation Bar do Android
  const bottomPosition = 20 + insets.bottom;
  console.log('📍 ExpandableFAB - Posição bottom:', bottomPosition);

  return (
    <View 
      style={[styles.container, { bottom: bottomPosition }]} 
      pointerEvents="box-none"
    >
      {/* Background Overlay */}
      {isExpanded && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      {/* Menu Items */}
      {menuItems.map((item, index) => {
        const isFocused = currentRoute === item.name;
        
        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(70 * (menuItems.length - index))],
        });

        const scale = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

        const opacity = animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.5, 1],
        });

        return (
          <Animated.View
            key={item.name}
            style={[
              styles.menuItem,
              {
                transform: [{ translateY }, { scale }],
                opacity,
              },
            ]}
          >
            <View style={styles.menuItemContainer}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <TouchableOpacity
                style={[
                  styles.menuButton,
                  { backgroundColor: item.color },
                  isFocused && styles.menuButtonFocused,
                ]}
                onPress={() => navigateTo(item.name)}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={item.icon} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        );
      })}

      {/* Main FAB */}
      <TouchableOpacity
        style={[styles.fab, isExpanded && styles.fabExpanded]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons 
            name={isExpanded ? 'close' : 'menu'} 
            size={28} 
            color="#FFFFFF" 
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Current Route Indicator (when collapsed) */}
      {!isExpanded && (
        <View style={styles.indicator}>
          <View style={[styles.indicatorDot, { backgroundColor: colors.primary }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // bottom será calculado dinamicamente com Safe Area Insets
    right: 20,
    alignItems: 'flex-end',
    zIndex: 9999, // Garantir que fique acima de tudo
    elevation: 9999, // Android
    backgroundColor: 'transparent',
  },
  overlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabExpanded: {
    backgroundColor: colors.error,
  },
  menuItem: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'flex-end',
  },
  menuItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  menuButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  menuButtonFocused: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

export default ExpandableFAB;

