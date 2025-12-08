import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

const HistoryScreen = ({ route, navigation }) => {
  const { groupId, groupName, accompaniedName } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [filterType, setFilterType] = useState('all');

  // Tipos de eventos
  const eventTypes = [
    { id: 'all', label: 'Todos', icon: 'time' },
    { id: 'consultation', label: 'Consultas', icon: 'medical' },
    { id: 'vital_signs', label: 'Sinais', icon: 'pulse' },
    { id: 'medication', label: 'Remédios', icon: 'medical' },
    { id: 'panic', label: 'Pânico', icon: 'alert-circle' },
    { id: 'occurrence', label: 'Ocorrências', icon: 'warning' },
  ];

  useEffect(() => {
    loadHistory();
  }, [groupId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // TODO: Implementar chamada à API para buscar histórico
      // const result = await historyService.getHistory(groupId);
      
      // Mock de dados para exemplo
      const mockEvents = [
        {
          id: 1,
          type: 'consultation',
          title: 'Consulta - Cardiologia',
          description: 'Dr. João Silva - Check-up regular',
          date: '2025-11-25T10:00:00',
          icon: 'medical',
          color: '#B8D4F0', // Pastel azul
        },
        {
          id: 2,
          type: 'vital_signs',
          title: 'Sinais Vitais Registrados',
          description: 'PA: 120/80 | Glicose: 95 mg/dL',
          date: '2025-11-24T08:30:00',
          icon: 'pulse',
          color: '#B8E6B8', // Pastel verde
        },
        {
          id: 3,
          type: 'medication',
          title: 'Medicamento Adicionado',
          description: 'Losartana 50mg - 1x ao dia',
          date: '2025-11-23T14:15:00',
          icon: 'medical',
          color: '#C8A8E9', // Pastel roxo
        },
        {
          id: 4,
          type: 'panic',
          title: 'Botão de Pânico Acionado',
          description: 'Localização: Rua ABC, 123',
          date: '2025-11-22T16:45:00',
          icon: 'alert-circle',
          color: '#F5A5A5', // Pastel vermelho
        },
        {
          id: 5,
          type: 'occurrence',
          title: 'Ocorrência Registrada',
          description: 'Queda leve sem ferimentos',
          date: '2025-11-21T11:20:00',
          icon: 'warning',
          color: '#FFD4A3', // Pastel laranja
        },
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    if (isToday) {
      return `Hoje às ${timeStr}`;
    } else if (isYesterday) {
      return `Ontem às ${timeStr}`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(e => e.type === filterType);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Histórico</Text>
          <Text style={styles.subtitle}>{accompaniedName || groupName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filtros */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {eventTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.filterChip,
              filterType === type.id && styles.filterChipActive
            ]}
            onPress={() => setFilterType(type.id)}
          >
            <Ionicons 
              name={type.icon} 
              size={16} 
              color={filterType === type.id ? colors.white : colors.gray600} 
            />
            <Text style={[
              styles.filterChipText,
              filterType === type.id && styles.filterChipTextActive
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Timeline */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C8A8E9" />
          <Text style={styles.loadingText}>Carregando histórico...</Text>
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={80} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Nenhum evento</Text>
          <Text style={styles.emptyText}>
            {filterType === 'all' 
              ? 'Nenhum evento registrado ainda'
              : 'Nenhum evento deste tipo'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.timeline}
          showsVerticalScrollIndicator={false}
        >
          {filteredEvents.map((event, index) => (
            <View key={event.id} style={styles.timelineItem}>
              {/* Timeline line */}
              {index !== filteredEvents.length - 1 && (
                <View style={styles.timelineLine} />
              )}
              
              {/* Timeline dot/icon */}
              <View style={[styles.timelineDot, { backgroundColor: event.color }]}>
                <Ionicons name={event.icon} size={20} color={colors.white} />
              </View>

              {/* Event card */}
              <TouchableOpacity 
                style={styles.eventCard}
                onPress={() => {
                  // TODO: Navegar para detalhes do evento
                  console.log('Ver detalhes:', event.id);
                }}
              >
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                </View>
                <Text style={styles.eventDescription}>{event.description}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* Botão Flutuante para Adicionar Ocorrência */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddOccurrence', {
          groupId,
          groupName,
          accompaniedName
        })}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 2,
  },
  filtersContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#C8A8E9', // Pastel roxo
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray600,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray600,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: 8,
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -20,
    width: 2,
    backgroundColor: colors.gray200,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  eventDate: {
    fontSize: 12,
    color: colors.gray600,
  },
  eventDescription: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD4A3', // Pastel laranja
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HistoryScreen;

