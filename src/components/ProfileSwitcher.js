import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';

/**
 * Componente para trocar entre perfis (Acompanhante / Paciente)
 * Um usuário pode ser ambos simultaneamente
 */
const ProfileSwitcher = ({ currentProfile, onProfileChange, style }) => {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  const profiles = [
    {
      id: 'caregiver',
      name: 'Acompanhante',
      icon: 'heart',
      color: colors.success,
      description: 'Gerenciar grupos e cuidados',
    },
    {
      id: 'patient',
      name: 'Paciente',
      icon: 'person',
      color: colors.secondary,
      description: 'Visualizar meus compromissos e medicamentos',
    },
  ];

  const currentProfileData = profiles.find(p => p.id === currentProfile) || profiles[0];

  const handleProfileSelect = (profileId) => {
    setModalVisible(false);
    if (onProfileChange) {
      onProfileChange(profileId);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: currentProfileData.color + '20' }]}>
          <Ionicons name={currentProfileData.icon} size={18} color={currentProfileData.color} />
        </View>
        <Text style={styles.profileName}>{currentProfileData.name}</Text>
        <Ionicons name="swap-horizontal" size={16} color={colors.gray400} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Trocar Perfil</Text>
                <Text style={styles.modalSubtitle}>Olá, {user?.name || 'Usuário'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.infoText}>
                Escolha como deseja visualizar o aplicativo:
              </Text>

              {profiles.map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  style={[
                    styles.profileOption,
                    currentProfile === profile.id && styles.profileOptionActive,
                  ]}
                  onPress={() => handleProfileSelect(profile.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.profileIconLarge, { backgroundColor: profile.color + '20' }]}>
                    <Ionicons name={profile.icon} size={32} color={profile.color} />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileOptionTitle}>{profile.name}</Text>
                    <Text style={styles.profileOptionDescription}>{profile.description}</Text>
                  </View>
                  {currentProfile === profile.id && (
                    <Ionicons name="checkmark-circle" size={24} color={profile.color} />
                  )}
                </TouchableOpacity>
              ))}

              <View style={styles.noteBox}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={styles.noteText}>
                  Você pode alternar entre perfis a qualquer momento. Seus dados e grupos continuarão os mesmos.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray600,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  infoText: {
    fontSize: 15,
    color: colors.gray600,
    marginBottom: 20,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  profileOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  profileIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileOptionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  profileOptionDescription: {
    fontSize: 13,
    color: colors.gray600,
    lineHeight: 18,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});

export default ProfileSwitcher;

