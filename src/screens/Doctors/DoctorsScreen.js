import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowBackIcon,
  StarIcon,
  PersonIcon,
  MedicalOutlineIcon,
  CardOutlineIcon,
  CallOutlineIcon,
  MailOutlineIcon,
  LocationOutlineIcon,
  CreateOutlineIcon,
  TrashOutlineIcon,
  AddIcon,
  CheckmarkCircleIcon,
} from '../../components/CustomIcons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import doctorService from '../../services/doctorService';
import { formatCrmDisplay } from '../../utils/crm';

const DoctorsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Validar e corrigir groupId (mesmo padrão dos outros screens)
  const validGroupId = typeof groupId === 'number' && groupId > 1000000000000
    ? 1
    : groupId;

  const loadDoctors = async () => {
    try {
      setLoading(true);
      
      // Buscar médicos do grupo e médicos da plataforma em paralelo
      const [groupDoctorsResponse, platformDoctors] = await Promise.all([
        doctorService.getDoctors(validGroupId),
        doctorService.getPlatformDoctors(),
      ]);
      
      // Processar médicos do grupo
      let groupDoctors = [];
      if (groupDoctorsResponse.success && groupDoctorsResponse.data) {
        groupDoctors = groupDoctorsResponse.data.map(doctor => ({
          ...doctor,
          is_platform_doctor: false, // Marcar como médico do grupo
        }));
      }
      
      // Combinar as duas listas
      // Remover duplicatas baseado no ID (se um médico da plataforma já estiver no grupo, priorizar o do grupo)
      const doctorsMap = new Map();
      
      // Primeiro adicionar médicos do grupo (têm prioridade)
      groupDoctors.forEach(doctor => {
        doctorsMap.set(doctor.id, doctor);
      });
      
      // Depois adicionar médicos da plataforma que não estão no grupo
      platformDoctors.forEach(doctor => {
        if (!doctorsMap.has(doctor.id)) {
          doctorsMap.set(doctor.id, doctor);
        }
      });
      
      // Converter Map para array e ordenar por nome
      const allDoctors = Array.from(doctorsMap.values()).sort((a, b) => {
        // Ordenar: médicos principais primeiro, depois por nome
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setDoctors(allDoctors);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar médicos',
        text2: error.message || 'Tente novamente',
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDoctors();
    }, [validGroupId])
  );

  const handleAddDoctor = () => {
    navigation.navigate('AddDoctor', { 
      groupId: validGroupId,
      groupName 
    });
  };

  const handleEditDoctor = (doctor) => {
    navigation.navigate('AddDoctor', { 
      groupId: validGroupId,
      groupName,
      doctor,
      isEditing: true 
    });
  };

  const handleDeleteDoctor = (doctorId, doctorName) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir o médico ${doctorName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await doctorService.deleteDoctor(doctorId);
              Toast.show({
                type: 'success',
                text1: 'Médico excluído com sucesso',
              });
              loadDoctors();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Erro ao excluir médico',
                text2: error.message,
              });
            }
          },
        },
      ]
    );
  };

  const renderDoctorItem = ({ item }) => (
    <TouchableWithoutFeedback
      onPress={() => {
        // Médicos da plataforma não são editáveis através desta tela
        if (!item.is_platform_doctor) {
          handleEditDoctor(item);
        }
      }}
      disabled={item.is_platform_doctor}
    >
      <View
        style={[
          styles.doctorCard,
          item.is_platform_doctor && styles.platformDoctorCard,
        ]}
        collapsable={false}
        needsOffscreenAlphaCompositing={false}
      >
      {/* Badges */}
      <View style={styles.badgesContainer}>
        {item.is_primary && (
          <View style={styles.primaryBadge}>
            <StarIcon size={12} color={colors.white} filled={true} />
            <Text style={styles.primaryBadgeText}>Principal</Text>
          </View>
        )}
        {item.is_platform_doctor && (
          <View style={styles.platformBadge}>
            <CheckmarkCircleIcon size={12} color={colors.white} />
            <Text style={styles.platformBadgeText}>Plataforma</Text>
          </View>
        )}
      </View>

      {/* Avatar e Nome */}
      <View style={styles.doctorHeader}>
        <View style={[
          styles.avatar,
          item.is_platform_doctor && styles.platformAvatar,
        ]}>
          <PersonIcon 
            size={32} 
            color={item.is_platform_doctor ? colors.success : colors.primary} 
          />
        </View>
        <View style={styles.doctorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.doctorName}>{item.name}</Text>
            {item.is_platform_doctor && (
              <View style={styles.platformIndicator}>
                <CheckmarkCircleIcon size={16} color={colors.success} />
              </View>
            )}
          </View>
          {item.medical_specialty?.name && (
            <View style={styles.specialtyBadge}>
              <MedicalOutlineIcon size={14} color={colors.primary} />
              <Text style={styles.specialtyText}>
                {item.medical_specialty.name}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* CRM */}
      {item.crm && (
        <View style={styles.infoRow}>
          <CardOutlineIcon size={16} color={colors.gray400} />
          <Text style={styles.infoText}>CRM: {formatCrmDisplay(item.crm)}</Text>
        </View>
      )}

      {/* Telefone */}
      {item.phone && (
        <View style={styles.infoRow}>
          <CallOutlineIcon size={16} color={colors.gray400} />
          <Text style={styles.infoText}>{item.phone}</Text>
        </View>
      )}

      {/* Email */}
      {item.email && (
        <View style={styles.infoRow}>
          <MailOutlineIcon size={16} color={colors.gray400} />
          <Text style={styles.infoText}>{item.email}</Text>
        </View>
      )}

      {/* Endereço */}
      {item.address && (
        <View style={styles.infoRow}>
          <LocationOutlineIcon size={16} color={colors.gray400} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      )}

      {/* Botões de Ação - Apenas para médicos do grupo (não da plataforma) */}
      {!item.is_platform_doctor && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditDoctor(item)}
          >
            <CreateOutlineIcon size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteDoctor(item.id, item.name)}
          >
            <TrashOutlineIcon size={20} color={colors.error} />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Excluir
            </Text>
          </TouchableOpacity>
        </View>
      )}
      </View>
    </TouchableWithoutFeedback>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <MedicalOutlineIcon size={64} color={colors.gray300} />
      </View>
      <Text style={styles.emptyTitle}>Nenhum médico cadastrado</Text>
      <Text style={styles.emptyText}>
        Cadastre os médicos vinculados ao cuidado do paciente
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddDoctor}>
        <Text style={styles.emptyButtonText}>Cadastrar Primeiro Médico</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Médicos</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Lista de Médicos */}
      <FlatList
        data={doctors}
        renderItem={renderDoctorItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          doctors.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={!loading && renderEmptyState}
        refreshing={loading}
        onRefresh={loadDoctors}
        showsVerticalScrollIndicator={false}
      />

      {/* Botão Flutuante */}
      {doctors.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddDoctor}
          activeOpacity={0.8}
        >
          <AddIcon size={28} color={colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray400,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    padding: 20,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  doctorCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: colors.gray200,
    ...Platform.select({
      android: {
        elevation: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
    }),
  },
  platformDoctorCard: {
    borderWidth: 1.5,
    borderColor: colors.success,
    backgroundColor: colors.success + '08', // Fundo levemente verde
  },
  badgesContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success || '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  platformBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  platformIndicator: {
    marginLeft: 4,
  },
  platformAvatar: {
    backgroundColor: colors.success + '20', // Fundo verde claro para avatar
  },
  specialtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specialtyText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray600,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    marginTop: 12,
    paddingTop: 0,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  deleteButton: {},
  deleteButtonText: {
    color: colors.error,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default DoctorsScreen;

