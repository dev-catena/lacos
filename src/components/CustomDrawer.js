import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';

const CustomDrawer = (props) => {
  const { user, signOut } = useAuth();
  const { state, navigation } = props;
  const currentRoute = state.routes[state.index].name;

  const menuItems = [
    {
      name: 'Home',
      label: 'Início',
      icon: 'home',
      iconOutline: 'home-outline',
    },
    {
      name: 'Groups',
      label: 'Grupos',
      icon: 'people',
      iconOutline: 'people-outline',
    },
    {
      name: 'Notifications',
      label: 'Notificações',
      icon: 'notifications',
      iconOutline: 'notifications-outline',
    },
    {
      name: 'Profile',
      label: 'Perfil',
      icon: 'person',
      iconOutline: 'person-outline',
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.closeDrawer();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header com informações do usuário */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user?.photo_url ? (
              <Image
                source={{ uri: user.photo_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color={colors.textWhite} />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Divisor */}
        <View style={styles.divider} />

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => {
            const isActive = currentRoute === item.name;
            
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.menuItem,
                  isActive && styles.menuItemActive,
                ]}
                onPress={() => navigation.navigate(item.name)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isActive ? item.icon : item.iconOutline}
                  size={24}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.menuLabel,
                    isActive && styles.menuLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Divisor */}
        <View style={styles.divider} />

        {/* Botão de Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color={colors.error}
          />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Laços v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Cuidado e conexão sempre
          </Text>
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: colors.primary,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.textWhite,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.textWhite,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  menuContainer: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: colors.primary + '10',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 16,
    flex: 1,
  },
  menuLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.error,
    marginLeft: 16,
  },
  footer: {
    marginTop: 'auto',
    padding: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
  },
});

export default CustomDrawer;

