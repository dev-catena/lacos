import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../constants/colors';

const GROUPS_STORAGE_KEY = '@lacos_groups';

const ShowGroupCodesScreen = ({ navigation }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const groupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      if (groupsJson) {
        const parsedGroups = JSON.parse(groupsJson);
        setGroups(parsedGroups);
        console.log('📋 Grupos carregados:', parsedGroups);
      } else {
        console.log('❌ Nenhum grupo encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os grupos');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code) => {
    Clipboard.setString(code);
    Alert.alert('✅ Copiado!', `Código ${code} copiado para área de transferência`);
  };

  const copyAllCodes = () => {
    const allCodes = groups.map(g => 
      `${g.groupName}: ${g.code} (${g.accompaniedName})`
    ).join('\n');
    Clipboard.setString(allCodes);
    Alert.alert('✅ Copiado!', 'Todos os códigos foram copiados');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando grupos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Códigos de Acesso</Text>
        {groups.length > 0 && (
          <TouchableOpacity
            onPress={copyAllCodes}
            style={styles.copyAllButton}
          >
            <Ionicons name="copy" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Códigos de Pareamento</Text>
            <Text style={styles.infoText}>
              Use estes códigos para fazer login como paciente
            </Text>
          </View>
        </View>

        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={80} color={colors.gray300} />
            <Text style={styles.emptyTitle}>Nenhum grupo criado</Text>
            <Text style={styles.emptyText}>
              Crie um grupo primeiro para gerar códigos de acesso
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>
              {groups.length} {groups.length === 1 ? 'grupo encontrado' : 'grupos encontrados'}
            </Text>

            {groups.map((group, index) => (
              <View key={group.id} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupNumber}>
                    <Text style={styles.groupNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.groupName}</Text>
                    <Text style={styles.accompaniedName}>
                      👤 {group.accompaniedName}
                    </Text>
                  </View>
                </View>

                <View style={styles.codeContainer}>
                  <View style={styles.codeBox}>
                    <Text style={styles.codeLabel}>Código de Acesso</Text>
                    <Text style={styles.codeText}>{group.code}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyCode(group.code)}
                  >
                    <Ionicons name="copy-outline" size={24} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.groupMeta}>
                  <Text style={styles.metaText}>
                    📅 Criado em: {new Date(group.createdAt).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={styles.metaText}>
                    🆔 ID: {group.id}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  copyAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.info + '10',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.info + '40',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  groupCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary + '40',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  groupNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  accompaniedName: {
    fontSize: 14,
    color: colors.textLight,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  codeBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  copyButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  groupMeta: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textLight,
  },
});

export default ShowGroupCodesScreen;

