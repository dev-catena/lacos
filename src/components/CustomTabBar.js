import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../constants/colors';
import { HomeIcon, GroupsIcon, NotificationIcon, ProfileIcon, PeopleIcon, MessagesIcon } from './CustomIcons';
import notificationApiService from '../services/notificationApiService';
import chatService from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';

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
      case 'Messages':
        return <MessagesIcon size={size} color={color} />;
      default:
        return <View style={{ width: size, height: size }} />;
    }
  } catch (error) {
    console.error('❌ CustomTabBar - Erro ao renderizar ícone:', error);
    return <View style={{ width: size, height: size, backgroundColor: colors.gray300 }} />;
  }
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { signed } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [messagesUnreadCount, setMessagesUnreadCount] = useState(0);
  const intervalRef = React.useRef(null);

  const loadUnreadCount = React.useCallback(async () => {
    if (!signed) {
      setUnreadCount(0);
      return;
    }
    try {
      const result = await notificationApiService.getUnreadCount();
      if (result.success) {
        setUnreadCount(result.count ?? 0);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      setUnreadCount(0);
    }
  }, [signed]);

  const loadMessagesUnreadCount = React.useCallback(async () => {
    if (!signed) {
      setMessagesUnreadCount(0);
      return;
    }
    try {
      const result = await chatService.getUnreadCount();
      if (result.success) {
        setMessagesUnreadCount(result.count ?? 0);
      } else {
        setMessagesUnreadCount(0);
      }
    } catch (error) {
      setMessagesUnreadCount(0);
    }
  }, [signed]);

  // Resetar contador e parar intervalo quando deslogar
  React.useEffect(() => {
    if (!signed) {
      setUnreadCount(0);
      setMessagesUnreadCount(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [signed]);

  // Carregar contadores na inicialização
  React.useEffect(() => {
    loadUnreadCount();
    loadMessagesUnreadCount();
  }, [loadUnreadCount, loadMessagesUnreadCount]);

  // Monitorar estado do app (ativo/background)
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App voltou para primeiro plano - recarregar contadores e reiniciar intervalo
        loadUnreadCount();
        loadMessagesUnreadCount();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
          // Verificar se app ainda está ativo antes de fazer requisição
          if (AppState.currentState === 'active') {
            loadUnreadCount();
            loadMessagesUnreadCount();
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
        loadMessagesUnreadCount();
        
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
            loadMessagesUnreadCount();
          }
        }, 10000);
      }
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [loadUnreadCount])
  );

  // Atualizar contadores quando mudar de rota (detectar mudanças no state.index)
  React.useEffect(() => {
    // Atualizar contadores quando o usuário navega entre as tabs
    loadUnreadCount();
    loadMessagesUnreadCount();
  }, [state.index, loadUnreadCount, loadMessagesUnreadCount]);

  try {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || route.name;
            const isFocused = state.index === index;
            const showNotificationsBadge = route.name === 'Notifications' && unreadCount > 0;
            const showMessagesBadge = route.name === 'Messages' && messagesUnreadCount > 0;
            const showBadge = showNotificationsBadge || showMessagesBadge;
            const badgeCount = showNotificationsBadge ? unreadCount : (showMessagesBadge ? messagesUnreadCount : 0);

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
                        {badgeCount > 99 ? '99+' : badgeCount}
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
