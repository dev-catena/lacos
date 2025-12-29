import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { LacosLogoFull } from '../../components/LacosLogo';

const ProfileSelectionScreen = ({ route, navigation }) => {
  const { login, password, profiles } = route.params || {};
  const { signInWithProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  const getProfileIcon = (profile) => {
    const icons = {
      doctor: 'medical-outline',
      caregiver: 'people-outline',
      professional_caregiver: 'briefcase-outline',
      patient: 'person-outline',
      accompanied: 'person-outline',
    };
    return icons[profile] || 'person-outline';
  };

  const getProfileLabel = (profile) => {
    const labels = {
      doctor: 'Médico',
      caregiver: 'Cuidador/Amigo',
      professional_caregiver: 'Cuidador Profissional',
      patient: 'Paciente',
      accompanied: 'Acompanhado',
    };
    return labels[profile] || profile;
  };

  const getProfileColor = (profile) => {
    const colors_map = {
      doctor: '#4A90E2',
      caregiver: '#50C878',
      professional_caregiver: '#FF6B6B',
      patient: '#9B59B6',
      accompanied: '#F39C12',
    };
    return colors_map[profile] || colors.primary;
  };

  const handleProfileSelect = async (profileId) => {
    if (!login || !password) {
      Alert.alert('Erro', 'Dados de login não encontrados');
      return;
    }

    setSelectedProfileId(profileId);
    setLoading(true);

    try {
      const result = await signInWithProfile(login, password, profileId);

      if (result.requires2FA) {
        navigation.navigate('TwoFactor', { login, password, profileId });
        return;
      }

      if (!result.success) {
        Alert.alert('Erro', result.error || 'Não foi possível fazer login');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao fazer login com perfil selecionado');
    } finally {
      setLoading(false);
      setSelectedProfileId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <LacosLogoFull width={150} height={47} />
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Selecione o Perfil</Text>
          <Text style={styles.subtitle}>
            Você possui múltiplos perfis. Selecione qual deseja usar:
          </Text>
        </View>

        {/* Lista de Perfis */}
        <View style={styles.profilesList}>
          {profiles && profiles.map((profile) => {
            const profileColor = getProfileColor(profile.profile);
            const isSelected = selectedProfileId === profile.id;
            const isLoading = loading && isSelected;

            return (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.profileCard,
                  isSelected && { borderColor: profileColor, borderWidth: 2 }
                ]}
                onPress={() => handleProfileSelect(profile.id)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={[styles.profileIconContainer, { backgroundColor: profileColor + '20' }]}>
                  <Ionicons 
                    name={getProfileIcon(profile.profile)} 
                    size={32} 
                    color={profileColor} 
                  />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileType}>{profile.profile_label || getProfileLabel(profile.profile)}</Text>
                </View>
                {isLoading ? (
                  <ActivityIndicator size="small" color={profileColor} />
                ) : (
                  <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  titleContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 22,
  },
  profilesList: {
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  profileType: {
    fontSize: 14,
    color: colors.textLight,
  },
});

export default ProfileSelectionScreen;
