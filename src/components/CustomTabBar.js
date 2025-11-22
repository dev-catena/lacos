import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        // Definir ícones
        let iconName;
        if (route.name === 'Home') {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'Groups') {
          iconName = isFocused ? 'people' : 'people-outline';
        } else if (route.name === 'Notifications') {
          iconName = isFocused ? 'notifications' : 'notifications-outline';
        } else if (route.name === 'Profile') {
          iconName = isFocused ? 'person' : 'person-outline';
        }

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
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [
              styles.tab,
              pressed && styles.tabPressed
            ]}
            android_ripple={{
              color: colors.primary + '30',
              borderless: false,
            }}
          >
            {({ pressed }) => (
              <>
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isFocused ? colors.primary : colors.gray400}
                  style={{ opacity: pressed ? 0.7 : 1 }}
                />
                <Text
                  style={[
                    styles.label,
                    { 
                      color: isFocused ? colors.primary : colors.gray400,
                      opacity: pressed ? 0.7 : 1 
                    },
                  ]}
                >
                  {label}
                </Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 65,
    paddingBottom: Platform.OS === 'ios' ? 0 : 10,
    paddingTop: 8,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    minHeight: 50,
  },
  tabPressed: {
    backgroundColor: colors.primary + '10',
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});

export default CustomTabBar;

