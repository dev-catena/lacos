import React, { useState, useEffect } from 'react';
import KidsBackground from '../../components/KidsBackground';
import { isKidsGroup } from '../../stores/currentGroupStore';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import vaccinationService from '../../services/vaccinationService';

const VaccinationDetailsScreen = ({ route, navigation }) => {
  const { groupId, recordId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);

  useEffect(() => {
    loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    setLoading(true);
    try {
      const data = await vaccinationService.getRecord(groupId, recordId);
      setRecord(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Erro ao carregar registro.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remover registro',
      'Deseja remover este registro de vacinação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await vaccinationService.deleteRecord(groupId, recordId);
              Toast.show({ type: 'success', text1: 'Registro removido.' });
              navigation.goBack();
            } catch {
              Toast.show({ type: 'error', text1: 'Erro ao remover registro.' });
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
      {isKidsGroup() && <KidsBackground />}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes da Vacina</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
      {isKidsGroup() && <KidsBackground />}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes da Vacina</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Registro não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPdf = record.document_mime_type === 'application/pdf';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      {isKidsGroup() && <KidsBackground />}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Detalhes da Vacina</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Cabeçalho da vacina */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="medical" size={32} color={colors.success} />
          </View>
          <Text style={styles.heroVaccineName}>{record.vaccine_name}</Text>
          <Text style={styles.heroDose}>{record.dose}</Text>
          <View style={styles.heroBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.heroBadgeText}>Aplicada</Text>
          </View>
        </View>

        {/* Detalhes */}
        <View style={styles.section}>
          <DetailRow icon="calendar" label="Data de aplicação" value={formatDate(record.applied_at)} />
          {record.batch_number ? <DetailRow icon="barcode-outline" label="Número do lote"       value={record.batch_number}    /> : null}
          {record.location      ? <DetailRow icon="location-outline" label="Local"               value={record.location}        /> : null}
          {record.professional_name ? <DetailRow icon="person-outline" label="Profissional"      value={record.professional_name} /> : null}
          {record.notes         ? <DetailRow icon="chatbubble-outline" label="Observações"        value={record.notes}           /> : null}
          {record.created_by_name ? <DetailRow icon="person-circle-outline" label="Registrado por" value={record.created_by_name} /> : null}
        </View>

        {/* Comprovante */}
        {record.document_url ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comprovante</Text>
            {isPdf ? (
              <TouchableOpacity
                style={styles.pdfCard}
                onPress={() => Linking.openURL(record.document_url)}
              >
                <Ionicons name="document-text" size={36} color={colors.error} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pdfTitle}>Abrir comprovante PDF</Text>
                  <Text style={styles.pdfSub}>Toque para visualizar</Text>
                </View>
                <Ionicons name="open-outline" size={20} color={colors.textLight} />
              </TouchableOpacity>
            ) : (
              <Image
                source={{ uri: record.document_url }}
                style={styles.docImage}
                resizeMode="cover"
              />
            )}
          </View>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIconWrap}>
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
    <View style={styles.detailTexts}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.background },
  header:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.backgroundLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:           { padding: 4 },
  headerCenter:      { flex: 1, marginLeft: 8 },
  headerTitle:       { fontSize: 18, fontWeight: '700', color: colors.text },
  deleteBtn:         { padding: 4 },
  loadingContainer:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText:         { fontSize: 14, color: colors.textLight },
  scroll:            { flex: 1 },

  heroCard:          { alignItems: 'center', backgroundColor: colors.backgroundLight, margin: 16, padding: 24, borderRadius: 16, gap: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  heroIcon:          { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success + '18', justifyContent: 'center', alignItems: 'center' },
  heroVaccineName:   { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  heroDose:          { fontSize: 15, color: colors.textLight },
  heroBadge:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.success + '18', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  heroBadgeText:     { fontSize: 13, color: colors.success, fontWeight: '700' },

  section:           { backgroundColor: colors.backgroundLight, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, gap: 14 },
  sectionTitle:      { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },

  detailRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailIconWrap:    { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary + '12', justifyContent: 'center', alignItems: 'center' },
  detailTexts:       { flex: 1 },
  detailLabel:       { fontSize: 11, color: colors.textLight, marginBottom: 2 },
  detailValue:       { fontSize: 14, color: colors.text, fontWeight: '500' },

  pdfCard:           { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.gray100, borderRadius: 10, padding: 14 },
  pdfTitle:          { fontSize: 14, fontWeight: '600', color: colors.text },
  pdfSub:            { fontSize: 12, color: colors.textLight },

  docImage:          { width: '100%', height: 220, borderRadius: 10 },
});

export default VaccinationDetailsScreen;
