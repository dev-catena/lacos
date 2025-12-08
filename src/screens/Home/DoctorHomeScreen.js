import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { LacosLogoFull } from '../../components/LacosLogo';
import appointmentService from '../../services/appointmentService';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

const DoctorHomeScreen = ({ navigation }) => {
  const { user, signed } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' ou 'agenda'

  useFocusEffect(
    React.useCallback(() => {
      if (signed && user) {
        loadAppointments();
      }
    }, [signed, user])
  );

  const loadAppointments = async () => {
    try {
      setLoading(true);
      console.log('📅 DoctorHomeScreen - Carregando consultas agendadas...');
      
      // Dados mockup de consultas agendadas
      const today = new Date();
      const mockAppointments = [
        {
          id: 1,
          title: 'Consulta de Rotina',
          description: 'Acompanhamento mensal - Pressão arterial e exames',
          appointment_date: new Date(today.getTime() + 2 * 60 * 60 * 1000).toISOString(), // Hoje, 2 horas à frente
          scheduled_at: new Date(today.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          location: 'Consultório - Sala 201',
          group: { name: 'Maria Silva' },
          group_id: 1, // ID do grupo do paciente
          patient_name: 'Maria Silva',
        },
        {
          id: 2,
          title: 'Consulta Cardiológica',
          description: 'Avaliação cardiovascular completa',
          appointment_date: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(), // Amanhã, 10h
          scheduled_at: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
          location: 'Hospital Central - Ambulatório',
          group: { name: 'João Santos' },
          group_id: 2,
          patient_name: 'João Santos',
        },
        {
          id: 3,
          title: 'Retorno - Exames',
          description: 'Avaliação dos resultados dos exames laboratoriais',
          appointment_date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(), // Depois de amanhã, 14h
          scheduled_at: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
          location: 'Consultório - Sala 201',
          group: { name: 'Ana Costa' },
          group_id: 3,
          patient_name: 'Ana Costa',
        },
        {
          id: 4,
          title: 'Consulta de Urgência',
          description: 'Avaliação de sintomas respiratórios',
          appointment_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(), // 3 dias, 9h
          scheduled_at: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
          location: 'Pronto Atendimento',
          group: { name: 'Carlos Oliveira' },
          group_id: 4,
          patient_name: 'Carlos Oliveira',
        },
        {
          id: 5,
          title: 'Consulta Preventiva',
          description: 'Check-up anual completo',
          appointment_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(), // 5 dias, 15h
          scheduled_at: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
          location: 'Consultório - Sala 201',
          group: { name: 'Fernanda Lima' },
          group_id: 5,
          patient_name: 'Fernanda Lima',
        },
        {
          id: 6,
          title: 'Consulta de Acompanhamento',
          description: 'Controle de medicação e evolução do tratamento',
          appointment_date: new Date(today.getTime() - 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(), // Ontem (passada)
          scheduled_at: new Date(today.getTime() - 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
          location: 'Consultório - Sala 201',
          group: { name: 'Roberto Alves' },
          group_id: 6,
          patient_name: 'Roberto Alves',
        },
        {
          id: 7,
          title: 'Consulta Pediátrica',
          description: 'Acompanhamento de crescimento e desenvolvimento',
          appointment_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(), // 7 dias, 11h
          scheduled_at: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(),
          location: 'Consultório - Sala 205',
          group: { name: 'Pedro Henrique' },
          group_id: 7,
          patient_name: 'Pedro Henrique',
        },
        {
          id: 8,
          title: 'Consulta Geriátrica',
          description: 'Avaliação de saúde do idoso',
          appointment_date: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(), // 10 dias, 8h
          scheduled_at: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
          location: 'Consultório - Sala 201',
          group: { name: 'Dona Rosa' },
          group_id: 8,
          patient_name: 'Dona Rosa',
        },
      ];
      
      // Ordenar por data (mais próximas primeiro)
      mockAppointments.sort((a, b) => {
        const dateA = new Date(a.appointment_date || a.scheduled_at);
        const dateB = new Date(b.appointment_date || b.scheduled_at);
        return dateA - dateB;
      });
      
      console.log(`✅ DoctorHomeScreen - ${mockAppointments.length} consulta(s) mockup carregada(s)`);
      setAppointments(mockAppointments);
      
      // TODO: Quando a API estiver pronta, substituir por:
      // const result = await appointmentService.getAppointments(null, startDate, endDate);
      // if (result.success && result.data) { ... }
      
    } catch (error) {
      console.error('❌ DoctorHomeScreen - Erro ao carregar consultas:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const formatDate = (dateString) => {
    const date = moment(dateString);
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'days').startOf('day');
    
    if (date.isSame(today, 'day')) {
      return 'Hoje';
    } else if (date.isSame(tomorrow, 'day')) {
      return 'Amanhã';
    } else {
      return date.format('DD/MM/YYYY');
    }
  };

  const formatTime = (dateString) => {
    const date = moment(dateString);
    return date.format('HH:mm');
  };

  const handleAppointmentPress = (appointment) => {
    // Navegar para detalhes da consulta do médico
    navigation.navigate('DoctorAppointmentDetails', { 
      appointment: appointment
    });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando consultas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <LacosLogoFull width={120} height={40} />
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileButton}
        >
          <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.tabActive]}
          onPress={() => setActiveTab('appointments')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="calendar" 
            size={20} 
            color={activeTab === 'appointments' ? colors.primary : colors.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.tabTextActive]}>
            Consultas Agendadas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'agenda' && styles.tabActive]}
          onPress={() => setActiveTab('agenda')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={activeTab === 'agenda' ? colors.primary : colors.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'agenda' && styles.tabTextActive]}>
            Agenda
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        >
        {activeTab === 'appointments' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consultas Agendadas</Text>
            
            {appointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>Nenhuma consulta agendada</Text>
              <Text style={styles.emptySubtext}>
                Suas consultas com pacientes aparecerão aqui
              </Text>
            </View>
          ) : (
            appointments.map((appointment) => {
              const appointmentDate = new Date(appointment.appointment_date || appointment.scheduled_at);
              const isPast = appointmentDate < new Date();
              
              return (
                <TouchableOpacity
                  key={appointment.id}
                  style={[
                    styles.appointmentCard,
                    isPast && styles.appointmentCardPast
                  ]}
                  onPress={() => handleAppointmentPress(appointment)}
                >
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentIconContainer}>
                      <Ionicons 
                        name="calendar" 
                        size={24} 
                        color={isPast ? colors.textLight : colors.primary} 
                      />
                    </View>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentTitle}>
                        {appointment.title || 'Consulta'}
                      </Text>
                      <Text style={styles.appointmentPatient}>
                        Paciente: {appointment.patient_name || appointment.group?.name || 'Não informado'}
                      </Text>
                      {appointment.description && (
                        <Text style={styles.appointmentDescription} numberOfLines={2}>
                          {appointment.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.appointmentFooter}>
                    <View style={styles.appointmentDateContainer}>
                      <Ionicons 
                        name="time-outline" 
                        size={16} 
                        color={colors.textLight} 
                      />
                      <Text style={styles.appointmentDate}>
                        {formatDate(appointmentDate)} às {formatTime(appointmentDate)}
                      </Text>
                    </View>
                    {appointment.location && (
                      <View style={styles.appointmentLocationContainer}>
                        <Ionicons 
                          name="location-outline" 
                          size={16} 
                          color={colors.textLight} 
                        />
                        <Text style={styles.appointmentLocation} numberOfLines={1}>
                          {appointment.location}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {isPast && (
                    <View style={styles.pastBadge}>
                      <Text style={styles.pastBadgeText}>Realizada</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agenda</Text>
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>Agenda</Text>
              <Text style={styles.emptySubtext}>
                Visualize sua agenda de consultas aqui
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  tabTextActive: {
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appointmentCardPast: {
    opacity: 0.6,
    borderColor: colors.border,
  },
  appointmentHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  appointmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  appointmentPatient: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  appointmentDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  appointmentDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentDate: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  appointmentLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  appointmentLocation: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 6,
    flex: 1,
  },
  pastBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.textLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pastBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
    textTransform: 'uppercase',
  },
});

export default DoctorHomeScreen;

