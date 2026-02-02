import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../constants/colors';
import { HomeIcon, GroupsIcon, NotificationIcon, ProfileIcon, PeopleIcon } from './CustomIcons';

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
  try {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || route.name;
            const isFocused = state.index === index;

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
                <TabIcon
                  routeName={route.name}
                  isFocused={isFocused}
                  size={24}
                />
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
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CustomTabBar;
