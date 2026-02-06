import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../constants/colors';
import { HomeIcon, GroupsIcon, NotificationIcon, ProfileIcon, PeopleIcon } from './CustomIcons';
import notificationApiService from '../services/notificationApiService';

// Componente para renderizar ícone SVG profissional
const TabIcon = ({ routeName, isFocused, size = 24 }) => {
  try {
    const color = isFocused ? colors.primary : colors.gray400;

    switch (routeName) {
      case 'Home':
        return <HomeIcon size={size} color={color} filled={isFocused} />;
      case 'Groups':
        return <GroupsIcon size={size} color={color} filled={isFocused} />;
      case 'Caregivers':
        return <PeopleIcon size={size} color={color} />;
      case 'Media':
        return <GroupsIcon size={size} color={color} filled={isFocused} />;
      case 'Notifications':
        return <NotificationIcon size={size} color={color} filled={isFocused} />;
      case 'Profile':
        return <ProfileIcon size={size} color={color} filled={isFocused} />;
      case 'Clients':
        return <GroupsIcon size={size} color={color} filled={isFocused} />;
      default:
        return <View style={{ width: size, height: size }} />;
    }
  } catch (error) {
    console.error('❌ CustomTabBar - Erro ao renderizar ícone:', error);
    return <View style={{ width: size, height: size, backgroundColor: colors.gray300 }} />;
  }
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = React.useRef(null);

  const loadUnreadCount = React.useCallback(async () => {
    try {
      console.log('🔔 CustomTabBar - Carregando contador de notificações...');
      const result = await notificationApiService.getUnreadCount();
      console.log('🔔 CustomTabBar - Resultado do getUnreadCount:', JSON.stringify(result));
      if (result.success) {
        const count = result.count || 0;
        console.log('🔔 CustomTabBar - Contador de notificações atualizado:', count);
        setUnreadCount(count);
      } else {
        console.warn('⚠️ CustomTabBar - Erro ao obter contador:', result.error);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ CustomTabBar - Erro ao carregar contador de notificações:', error);
      setUnreadCount(0);
    }
  }, []);
  
  // Carregar contador na inicialização
  React.useEffect(() => {
    console.log('🔔 CustomTabBar - Componente montado, carregando contador inicial...');
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Monitorar estado do app (ativo/background)
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App voltou para primeiro plano - recarregar contador e reiniciar intervalo
        loadUnreadCount();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
          // Verificar se app ainda está ativo antes de fazer requisição
          if (AppState.currentState === 'active') {
            loadUnreadCount();
          }
        }, 10000); // Aumentado para 10 segundos para reduzir requisições
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App foi para background - parar intervalo
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    });

    return () => {
      subscription.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // loadUnreadCount está memoizado com useCallback, não precisa estar nas dependências

  // Carregar contador de notificações não lidas quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      // Só atualizar se o app estiver ativo
      if (AppState.currentState === 'active') {
        loadUnreadCount();
        
        // Limpar intervalo anterior se existir
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        // Atualizar a cada 10 segundos quando a tela estiver em foco E app estiver ativo
        // Intervalo aumentado para reduzir requisições desnecessárias
        intervalRef.current = setInterval(() => {
          // Verificar se app ainda está ativo antes de fazer requisição
          if (AppState.currentState === 'active') {
            loadUnreadCount();
          }
        }, 10000);
      }
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [])
  );

  // Carregar contador na inicialização
  React.useEffect(() => {
    console.log('🔔 CustomTabBar - Componente montado, carregando contador inicial...');
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Atualizar contador quando mudar de rota (detectar mudanças no state.index)
  React.useEffect(() => {
    // Atualizar contador quando o índice da rota mudar
    // Isso detecta quando o usuário navega entre as tabs
    console.log('🔔 CustomTabBar - Rota mudou, atualizando contador...');
    loadUnreadCount();
  }, [state.index, loadUnreadCount]);

  try {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || route.name;
            const isFocused = state.index === index;
            const showBadge = route.name === 'Notifications' && unreadCount > 0;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <TabIcon
                    routeName={route.name}
                    isFocused={isFocused}
                    size={24}
                  />
                  {showBadge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.label,
                    { color: isFocused ? colors.primary : colors.gray400 },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    );
  } catch (error) {
    console.error('❌ CustomTabBar - Erro crítico ao renderizar:', error);
    return (
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.tabBar}>
          <Text style={styles.label}>Erro ao carregar navegação</Text>
        </View>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.backgroundLight,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  iconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.backgroundLight,
  },
  badgeText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CustomTabBar;
