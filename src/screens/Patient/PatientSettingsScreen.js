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

/**
 * Cabeçalho da configuração do paciente.
 * O painel BLE fica no PatientBraceletHost (instância única, sempre montada).
 */
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
        <View style={styles.content} />
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
    zIndex: 40,
    backgroundColor: colors.background,
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
