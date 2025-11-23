import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { LacosIcon } from '../../components/LacosLogo';

const ProfileScreen = ({ navigation }) => {
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Ao sair, você retornará à tela inicial onde poderá escolher entre entrar como Paciente ou Acompanhante novamente.\n\nDeseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Erro ao sair:', error);
              Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
            }
          }
        },
      ]
    );
  };

  const MenuItem = ({ icon, title, subtitle, onPress, color = colors.text, showArrow = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={20} color={colors.gray400} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LacosIcon size={36} />
          <Text style={styles.title}>Perfil</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.name} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.editProfileText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.menuContainer}>
            <MenuItem
              icon="person-outline"
              title="Dados Pessoais"
              subtitle="Nome, e-mail, telefone"
              color={colors.primary}
              onPress={() => navigation.navigate('EditPersonalData')}
            />
            <MenuItem
              icon="lock-closed-outline"
              title="Segurança"
              subtitle="Senha e autenticação"
              color={colors.warning}
              onPress={() => navigation.navigate('Security')}
            />
            <MenuItem
              icon="notifications-outline"
              title="Notificações"
              subtitle="Preferências de notificações"
              color={colors.info}
              onPress={() => navigation.navigate('NotificationPreferences')}
            />
          </View>
        </View>

        {/* Menu Aplicativo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicativo</Text>
          <View style={styles.menuContainer}>
            <MenuItem
              icon="key-outline"
              title="Códigos de Acesso"
              subtitle="Ver códigos de todos os grupos"
              color={colors.primary}
              onPress={() => navigation.navigate('ShowGroupCodes')}
            />
            <MenuItem
              icon="information-circle-outline"
              title="Sobre o Laços"
              subtitle="Versão 1.0.0"
              color={colors.secondary}
            />
            <MenuItem
              icon="help-circle-outline"
              title="Ajuda e Suporte"
              subtitle="FAQ e contato"
              color={colors.success}
            />
            <MenuItem
              icon="document-text-outline"
              title="Termos e Privacidade"
              subtitle="Termos de uso e política"
              color={colors.text}
            />
          </View>
        </View>

        {/* Botão Sair */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={24} color={colors.textWhite} />
            </View>
            <View style={styles.logoutContent}>
            <Text style={styles.logoutText}>Sair da Conta</Text>
              <Text style={styles.logoutSubtext}>Voltar à tela inicial</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Desenvolvido com 💙 para cuidar de quem amamos
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  userCard: {
    backgroundColor: colors.backgroundLight,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.textLight,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.error,
    padding: 18,
    borderRadius: 12,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutContent: {
    flex: 1,
    marginLeft: 12,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 2,
  },
  logoutSubtext: {
    fontSize: 13,
    color: colors.textWhite,
    opacity: 0.8,
  },
  footer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default ProfileScreen;

