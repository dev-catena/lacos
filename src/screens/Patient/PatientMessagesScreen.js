import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import groupService from '../../services/groupService';
import GroupChatScreen from '../Groups/GroupChatScreen';

/**
 * Tela de Mensagens do Paciente - carrega o grupo e exibe o chat
 */
const PatientMessagesScreen = ({ navigation }) => {
  const [groupId, setGroupId] = useState(null);
  const [groupName, setGroupName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      loadGroup();
    }, [])
  );

  const loadGroup = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await groupService.getMyGroups();
      if (result.success && result.data && result.data.length > 0) {
        const group = result.data[0];
        setGroupId(group.id);
        setGroupName(group.name || 'Grupo');
      } else {
        setError('Você ainda não faz parte de um grupo');
      }
    } catch (err) {
      console.error('PatientMessagesScreen - Erro ao carregar grupo:', err);
      setError('Não foi possível carregar as mensagens');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando mensagens...</Text>
      </View>
    );
  }

  if (error || !groupId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Nenhum grupo encontrado'}</Text>
      </View>
    );
  }

  return (
    <GroupChatScreen
      navigation={navigation}
      route={{ params: {} }}
      groupId={groupId}
      groupName={groupName}
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  errorText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default PatientMessagesScreen;
