import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import doctorService from '../../services/doctorService';

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
      const response = await doctorService.getDoctors(validGroupId);
      if (response.success && response.data) {
        setDoctors(response.data);
      }
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
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => handleEditDoctor(item)}
      activeOpacity={0.7}
    >
      {/* Badge de Médico Principal */}
      {item.is_primary && (
        <View style={styles.primaryBadge}>
          <Ionicons name="star" size={12} color={colors.white} />
          <Text style={styles.primaryBadgeText}>Principal</Text>
        </View>
      )}

      {/* Avatar e Nome */}
      <View style={styles.doctorHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={colors.primary} />
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{item.name}</Text>
          {item.medical_specialty?.name && (
            <View style={styles.specialtyBadge}>
              <Ionicons name="medical-outline" size={14} color={colors.primary} />
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
          <Ionicons name="card-outline" size={16} color={colors.gray400} />
          <Text style={styles.infoText}>CRM: {item.crm}</Text>
        </View>
      )}

      {/* Telefone */}
      {item.phone && (
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color={colors.gray400} />
          <Text style={styles.infoText}>{item.phone}</Text>
        </View>
      )}

      {/* Email */}
      {item.email && (
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={16} color={colors.gray400} />
          <Text style={styles.infoText}>{item.email}</Text>
        </View>
      )}

      {/* Endereço */}
      {item.address && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={colors.gray400} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      )}

      {/* Botões de Ação */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditDoctor(item)}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteDoctor(item.id, item.name)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            Excluir
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="medical-outline" size={64} color={colors.gray300} />
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
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
          <Ionicons name="add" size={28} color={colors.white} />
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
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
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
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
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    marginTop: 12,
    paddingTop: 12,
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

