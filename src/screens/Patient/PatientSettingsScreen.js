import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import groupService from '../../services/groupService';
import PulseiraVitalPanel from '../VitalSigns/components/PulseiraVitalPanel';

const PatientSettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadGroup();
    }, [])
  );

  const loadGroup = async () => {
    try {
      setLoading(true);
      setError(null);
      const groupsResult = await groupService.getMyGroups();
      if (!groupsResult.success || !groupsResult.data?.length) {
        setGroupId(null);
        setGroupName('');
        setError('Você não está em nenhum grupo.');
        return;
      }
      const group = groupsResult.data[0];
      setGroupId(group.id);
      setGroupName(group.name || 'Grupo de Cuidados');
    } catch (err) {
      console.error('Erro ao carregar configurações do paciente:', err);
      setError('Não foi possível carregar as configurações.');
      setGroupId(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Configuração</Text>
          <Text style={styles.headerSubtitle}>{groupName || 'Pulseira V5 e V8'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : error || !groupId ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="settings-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Sem configurações</Text>
          <Text style={styles.emptyText}>{error || 'Entre em um grupo para conectar a pulseira.'}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.introCard}>
            <Ionicons name="watch-outline" size={22} color={colors.primary} />
            <Text style={styles.introText}>
              Pareie a pulseira V5 ou V8 neste celular (perto do paciente). As leituras vão
              automaticamente para o grupo a cada 5 minutos enquanto o app estiver aberto.
              Medidas sob demanda ficam com os cuidadores. No Android, use Reconectar se a
              conexão cair.
            </Text>
          </View>
          <PulseiraVitalPanel groupId={groupId} active allowConnect patientMode />
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  introText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default PatientSettingsScreen;
