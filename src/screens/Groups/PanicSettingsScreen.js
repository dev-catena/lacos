import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import panicService from '../../services/panicService';
import apiService from '../../services/apiService';

const PanicSettingsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [panicEnabled, setPanicEnabled] = useState(true);
  const [members, setMembers] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [panicEvents, setPanicEvents] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadPanicConfig();
      loadPanicEvents();
    }, [groupId])
  );

  const loadPanicConfig = async () => {
    try {
      setLoading(true);
      
      // Buscar configuração do pânico
      const configResponse = await panicService.checkConfig(groupId);
      if (configResponse.success) {
        setPanicEnabled(configResponse.data.enabled);
        setEmergencyContacts(configResponse.data.emergency_contacts || []);
      }

      // Buscar membros do grupo
      const membersResponse = await apiService.get(`/groups/${groupId}/members`);
      if (membersResponse.success) {
        setMembers(membersResponse.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar configurações',
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPanicEvents = async () => {
    try {
      const response = await panicService.getEvents(groupId);
      if (response.success && response.data) {
        setPanicEvents(response.data.data || []); // Paginação
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    }
  };

  const togglePanicEnabled = async (value) => {
    try {
      await apiService.put(`/groups/${groupId}`, {
        panic_enabled: value,
      });
      
      setPanicEnabled(value);
      
      Toast.show({
        type: 'success',
        text1: value ? 'Botão de pânico ativado' : 'Botão de pânico desativado',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao atualizar',
        text2: error.message,
      });
    }
  };

  const toggleEmergencyContact = async (memberId, currentValue) => {
    try {
      await apiService.put(`/group-members/${memberId}`, {
        is_emergency_contact: !currentValue,
      });

      // Recarregar configuração
      loadPanicConfig();

      Toast.show({
        type: 'success',
        text1: !currentValue 
          ? 'Contato de emergência adicionado' 
          : 'Contato de emergência removido',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao atualizar contato',
        text2: error.message,
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}min ${secs}s` : `${secs}s`;
  };

  const isEmergencyContact = (memberId) => {
    return emergencyContacts.some(ec => ec.user_id === memberId);
  };

  const renderMemberItem = ({ item }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <View style={styles.memberAvatar}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{item.user?.name || item.name}</Text>
          <Text style={styles.memberRole}>
            {item.role === 'admin' ? 'Administrador' : 'Membro'}
          </Text>
        </View>
      </View>
      <Switch
        value={isEmergencyContact(item.user_id || item.id)}
        onValueChange={() => toggleEmergencyContact(item.id, isEmergencyContact(item.user_id || item.id))}
        trackColor={{ false: colors.gray300, true: colors.error + '50' }}
        thumbColor={isEmergencyContact(item.user_id || item.id) ? colors.error : colors.gray400}
      />
    </View>
  );

  const renderEventItem = ({ item }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventIconContainer}>
          <Ionicons name="warning" size={24} color={colors.error} />
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>Pânico Acionado</Text>
          <Text style={styles.eventDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[
          styles.eventStatusBadge,
          item.call_status === 'completed' && styles.eventStatusCompleted,
          item.call_status === 'cancelled' && styles.eventStatusCancelled,
        ]}>
          <Text style={styles.eventStatusText}>
            {item.call_status === 'ongoing' && 'Em andamento'}
            {item.call_status === 'completed' && 'Concluída'}
            {item.call_status === 'cancelled' && 'Cancelada'}
          </Text>
        </View>
      </View>

      <View style={styles.eventDetails}>
        {item.user && (
          <View style={styles.eventDetailRow}>
            <Ionicons name="person-outline" size={16} color={colors.gray400} />
            <Text style={styles.eventDetailText}>
              Acionado por: {item.user.name}
            </Text>
          </View>
        )}

        {item.trigger_type && (
          <View style={styles.eventDetailRow}>
            <Ionicons 
              name={item.trigger_type === 'voice' ? 'mic-outline' : 'hand-left-outline'} 
              size={16} 
              color={colors.gray400} 
            />
            <Text style={styles.eventDetailText}>
              Tipo: {item.trigger_type === 'voice' ? 'Voz' : 'Manual'}
            </Text>
          </View>
        )}

        {item.call_duration && (
          <View style={styles.eventDetailRow}>
            <Ionicons name="time-outline" size={16} color={colors.gray400} />
            <Text style={styles.eventDetailText}>
              Duração: {formatDuration(item.call_duration)}
            </Text>
          </View>
        )}

        {item.location_address && (
          <View style={styles.eventDetailRow}>
            <Ionicons name="location-outline" size={16} color={colors.gray400} />
            <Text style={styles.eventDetailText} numberOfLines={2}>
              {item.location_address}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
          <Text style={styles.headerTitle}>Botão de Pânico</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Configuração Principal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuração Geral</Text>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="warning" size={24} color={colors.error} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Habilitar Botão de Pânico</Text>
                  <Text style={styles.settingDescription}>
                    Permite que o paciente acione emergências
                  </Text>
                </View>
              </View>
              <Switch
                value={panicEnabled}
                onValueChange={togglePanicEnabled}
                trackColor={{ false: colors.gray300, true: colors.error + '50' }}
                thumbColor={panicEnabled ? colors.error : colors.gray400}
              />
            </View>
          </View>

          {!panicEnabled && (
            <View style={styles.warningBox}>
              <Ionicons name="information-circle" size={20} color={colors.warning} />
              <Text style={styles.warningText}>
                O botão de pânico está desabilitado. O paciente não poderá acionar emergências.
              </Text>
            </View>
          )}
        </View>

        {/* Contatos de Emergência */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contatos de Emergência</Text>
          <Text style={styles.sectionDescription}>
            Selecione os membros que receberão ligações automáticas
          </Text>

          {members.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyStateText}>
                Nenhum membro no grupo
              </Text>
            </View>
          ) : (
            <FlatList
              data={members}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}

          {emergencyContacts.length === 0 && members.length > 0 && (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.warningText}>
                ⚠️ Nenhum contato de emergência definido! Configure ao menos um.
              </Text>
            </View>
          )}
        </View>

        {/* Histórico de Acionamentos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Acionamentos</Text>
          
          {panicEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
              <Text style={styles.emptyStateText}>
                Nenhum acionamento registrado
              </Text>
            </View>
          ) : (
            <FlatList
              data={panicEvents}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.gray400,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    color: colors.gray400,
  },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: colors.gray400,
  },
  eventStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.warning + '20',
  },
  eventStatusCompleted: {
    backgroundColor: colors.success + '20',
  },
  eventStatusCancelled: {
    backgroundColor: colors.gray200,
  },
  eventStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.warning,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray600,
  },
  emptyState: {
    backgroundColor: colors.white,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.gray400,
    marginTop: 12,
  },
});

export default PanicSettingsScreen;

