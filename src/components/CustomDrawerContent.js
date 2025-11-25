import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';

const CustomDrawerContent = ({ state, descriptors, navigation }) => {
  const { user } = useAuth();

  const menuItems = [
    { 
      name: 'Home', 
      label: 'Início', 
      icon: 'home-outline',
      iconFocused: 'home'
    },
    { 
      name: 'Groups', 
      label: 'Grupos', 
      icon: 'people-outline',
      iconFocused: 'people'
    },
    { 
      name: 'Notifications', 
      label: 'Notificações', 
      icon: 'notifications-outline',
      iconFocused: 'notifications'
    },
    { 
      name: 'Profile', 
      label: 'Perfil', 
      icon: 'person-outline',
      iconFocused: 'person'
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="heart" size={40} color={colors.primary} />
        <Text style={styles.appName}>Laços</Text>
        <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
      </View>

      <ScrollView style={styles.menu}>
        {menuItems.map((item, index) => {
          const isFocused = state.index === index;
          
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.menuItem,
                isFocused && styles.menuItemActive
              ]}
              onPress={() => {
                navigation.navigate(item.name);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFocused ? item.iconFocused : item.icon}
                size={24}
                color={isFocused ? colors.primary : colors.text}
              />
              <Text
                style={[
                  styles.menuItemText,
                  isFocused && styles.menuItemTextActive
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.version}>Versão 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 10,
  },
  userName: {
    fontSize: 14,
    color: colors.gray400,
    marginTop: 5,
  },
  menu: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: colors.primary + '10',
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 15,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    color: colors.gray400,
  },
});

export default CustomDrawerContent;

