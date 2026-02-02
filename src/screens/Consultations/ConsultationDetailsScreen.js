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
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import consultationService from '../../services/consultationService';

const ConsultationDetailsScreen = ({ route, navigation }) => {
  const { consultationId, groupId, groupName } = route.params || {};
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadConsultation();
    }, [consultationId])
  );

  const loadConsultation = async () => {
    if (!consultationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await consultationService.getConsultation(consultationId);
      
      if (result.success && result.data) {
        setConsultation(result.data);
      } else {
        console.error('Erro ao carregar consulta:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar consulta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (consultation) {
      navigation.navigate('AddConsultation', {
        consultationId: consultation.id,
        consultation: consultation,
        groupId,
        groupName,
      });
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Consulta</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEdit}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !consultation ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyText}>Consulta não encontrada</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Título e Data */}
        <View style={styles.section}>
          <Text style={styles.title}>{consultation.title}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={colors.textLight} />
            <Text style={styles.dateText}>{formatDate(consultation.date)}</Text>
          </View>
          {consultation.doctorName && (
            <View style={styles.infoRow}>
              <Ionicons name="person" size={16} color={colors.textLight} />
              <Text style={styles.infoText}>{consultation.doctorName}</Text>
            </View>
          )}
          {consultation.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color={colors.textLight} />
              <Text style={styles.infoText}>{consultation.location}</Text>
            </View>
          )}
        </View>

        {/* Resumo */}
        {consultation.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo da Consulta</Text>
            <Text style={styles.sectionText}>{consultation.summary}</Text>
          </View>
        )}

        {/* Diagnóstico */}
        {consultation.diagnosis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnóstico/Avaliação</Text>
            <Text style={styles.sectionText}>{consultation.diagnosis}</Text>
          </View>
        )}

        {/* Tratamento */}
        {consultation.treatment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tratamento Prescrito</Text>
            <Text style={styles.sectionText}>{consultation.treatment}</Text>
          </View>
        )}

        {/* Observações */}
        {consultation.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.sectionText}>{consultation.notes}</Text>
          </View>
        )}

        {/* Anexos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anexos</Text>
          
          {/* Áudios */}
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="mic" size={24} color={colors.secondary} />
            <Text style={styles.attachButtonText}>Adicionar Gravação de Áudio</Text>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          {/* Laudos */}
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="document-text" size={24} color={colors.primary} />
            <Text style={styles.attachButtonText}>Adicionar Laudo/Relatório</Text>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          {/* Exames */}
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="flask" size={24} color={colors.info} />
            <Text style={styles.attachButtonText}>Adicionar Resultado de Exame</Text>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
        </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: colors.textWhite,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  dateText: {
    fontSize: 14,
    color: colors.textLight,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
});

export default ConsultationDetailsScreen;

