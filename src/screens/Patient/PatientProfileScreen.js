import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../constants/colors';
import { LacosIcon } from '../../components/LacosLogo';
import { useAuth } from '../../contexts/AuthContext';

const PATIENT_SESSION_KEY = '@lacos_patient_session';

const PatientProfileScreen = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [patientSession, setPatientSession] = useState(null);

  useEffect(() => {
    loadPatientSession();
  }, []);

  const loadPatientSession = async () => {
    try {
      const sessionJson = await AsyncStorage.getItem(PATIENT_SESSION_KEY);
      if (sessionJson) {
        setPatientSession(JSON.parse(sessionJson));
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair do Aplicativo',
      'Deseja sair? Você precisará fazer login novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 PatientProfileScreen - Fazendo logout...');
              
              // Remove a sessão antiga do paciente (compatibilidade)
              await AsyncStorage.removeItem(PATIENT_SESSION_KEY);
              
              // Faz logout pelo AuthContext (remove token, user, etc)
              await signOut();
              
              console.log('✅ PatientProfileScreen - Logout concluído, RootNavigator vai redirecionar');
              // RootNavigator automaticamente redireciona para Login quando signed = false
            } catch (error) {
              console.error('❌ PatientProfileScreen - Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const InfoCard = ({ icon, label, value, color = colors.primary }) => (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LacosIcon size={36} />
          <Text style={styles.title}>Meu Perfil</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={colors.textWhite} />
          </View>
          <Text style={styles.userName}>
            {user?.name || patientSession?.accompaniedName || 'Paciente'}
          </Text>
          <View style={styles.groupBadge}>
            <Ionicons name="people" size={14} color={colors.primary} />
            <Text style={styles.groupBadgeText}>
              {patientSession?.groupName || 'Grupo de Cuidados'}
            </Text>
          </View>
          {user?.profile && (
            <View style={[styles.profileBadge, { backgroundColor: colors.secondary + '20' }]}>
              <Text style={[styles.profileBadgeText, { color: colors.secondary }]}>
                Paciente
              </Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          <InfoCard
            icon="people-outline"
            label="Grupo de Cuidados"
            value={patientSession?.groupName || 'Não definido'}
            color={colors.primary}
          />

          <InfoCard
            icon="time-outline"
            label="Conectado desde"
            value={patientSession?.loginTime 
              ? new Date(patientSession.loginTime).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })
              : 'Não disponível'
            }
            color={colors.info}
          />
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ajuda</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="help-circle-outline" size={24} color={colors.info} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Como Usar</Text>
              <Text style={styles.menuSubtitle}>Tutorial e instruções</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="call-outline" size={24} color={colors.success} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Contatos de Emergência</Text>
              <Text style={styles.menuSubtitle}>Ver números importantes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={28} color={colors.textWhite} />
            </View>
            <View style={styles.logoutContent}>
              <Text style={styles.logoutText}>Sair do Aplicativo</Text>
              <Text style={styles.logoutSubtext}>Voltar à tela inicial</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  groupBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  profileBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
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
    backgroundColor: colors.error,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutContent: {
    flex: 1,
    marginLeft: 16,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 4,
  },
  logoutSubtext: {
    fontSize: 14,
    color: colors.textWhite,
    opacity: 0.9,
  },
});

export default PatientProfileScreen;

