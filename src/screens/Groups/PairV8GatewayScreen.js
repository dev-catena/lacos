import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import {
  claimV8GatewayByCode,
  listV8Gateways,
  unpairV8Gateway,
} from '../../services/v8GatewayService';

const PairV8GatewayScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [gateways, setGateways] = useState([]);

  const loadGateways = useCallback(async () => {
    if (!groupId) return;
    setLoadingList(true);
    try {
      const list = await listV8Gateways(groupId);
      setGateways(list);
    } catch (e) {
      console.warn('listV8Gateways', e);
    } finally {
      setLoadingList(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGateways();
  }, [loadGateways]);

  const handleClaim = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      Alert.alert('Código', 'Digite o código de 6 caracteres mostrado no Serial do ESP32.');
      return;
    }
    setSubmitting(true);
    try {
      await claimV8GatewayByCode(groupId, trimmed);
      setCode('');
      Alert.alert('Vinculado', 'O gateway V8 passou a enviar sinais vitais para este grupo.');
      await loadGateways();
    } catch (e) {
      Alert.alert('Falha', e?.message || 'Não foi possível vincular.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnpair = (item) => {
    Alert.alert(
      'Desvincular',
      `Remover "${item.name || item.device_id}" deste grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              await unpairV8Gateway(groupId, item.id);
              await loadGateways();
            } catch (e) {
              Alert.alert('Erro', e?.message || 'Falha ao desvincular.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Gateway V8</Text>
          {!!groupName && <Text style={styles.headerSubtitle}>{groupName}</Text>}
        </View>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parear ESP32</Text>
          <Text style={styles.cardHint}>
            Ligue o gateway na Wi-Fi e digite o código que aparece no monitor Serial
            (ou no portal, se disponível). Não é preciso login no ESP.
          </Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(t) => setCode(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
            placeholder="Código (ex: A1B2C3)"
            placeholderTextColor={colors.gray400}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.btnDisabled]}
            onPress={handleClaim}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Vincular ao grupo</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Gateways neste grupo</Text>
        {loadingList ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
        ) : (
          <FlatList
            data={gateways}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.empty}>Nenhum gateway vinculado ainda.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.name || 'Gateway V8'}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {item.bracelet_mac ? `MAC ${item.bracelet_mac} · ` : ''}
                    {item.last_seen_at
                      ? `visto ${new Date(item.last_seen_at).toLocaleString('pt-BR')}`
                      : 'ainda sem heartbeat'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleUnpair(item)} hitSlop={12}>
                  <Ionicons name="trash-outline" size={22} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  headerTitleContainer: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  placeholder: { width: 32 },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray200 || '#e5e7eb',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  cardHint: { fontSize: 13, color: colors.gray500, lineHeight: 18, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300 || '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    letterSpacing: 3,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionLabel: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray500,
    textTransform: 'uppercase',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { color: colors.gray500, textAlign: 'center', marginTop: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray200 || '#e5e7eb',
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 12, color: colors.gray500, marginTop: 4 },
});

export default PairV8GatewayScreen;
