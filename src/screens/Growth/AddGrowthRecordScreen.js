import React, { useState } from 'react';
import KidsBackground from '../../components/KidsBackground';
import { isKidsGroup } from '../../stores/currentGroupStore';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import growthService from '../../services/growthService';

const KIDS_GREEN = '#16a34a';

const AddGrowthRecordScreen = ({ route, navigation }) => {
  const { groupId, groupName, birthDate } = route.params || {};

  const [loading, setLoading]           = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [form, setForm] = useState({
    date: new Date(),
    weight: '',
    height: '',
    head_circumference: '',
    notes: '',
  });

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Calcula idade em meses a partir da data de nascimento
  const calcAgeMonths = (measureDate) => {
    if (!birthDate) return null;
    const birth   = new Date(birthDate + 'T12:00:00');
    const measure = new Date(measureDate);
    const months  =
      (measure.getFullYear() - birth.getFullYear()) * 12 +
      (measure.getMonth() - birth.getMonth());
    return Math.max(0, months);
  };

  const handleSubmit = async () => {
    const hasAnyMeasure = form.weight || form.height || form.head_circumference;
    if (!hasAnyMeasure) {
      Toast.show({ type: 'error', text1: 'Informe ao menos uma medida (peso, comprimento ou PC).' });
      return;
    }

    if (form.weight && isNaN(parseFloat(form.weight))) {
      Toast.show({ type: 'error', text1: 'Peso inválido.' });
      return;
    }
    if (form.height && isNaN(parseFloat(form.height))) {
      Toast.show({ type: 'error', text1: 'Comprimento/altura inválido.' });
      return;
    }
    if (form.head_circumference && isNaN(parseFloat(form.head_circumference))) {
      Toast.show({ type: 'error', text1: 'Perímetro cefálico inválido.' });
      return;
    }

    setLoading(true);
    try {
      const ageMonths = calcAgeMonths(form.date);
      const payload = {
        date: form.date.toISOString().split('T')[0],
        age_months: ageMonths,
        notes: form.notes.trim() || undefined,
      };
      if (form.weight)            payload.weight            = parseFloat(form.weight);
      if (form.height)            payload.height            = parseFloat(form.height);
      if (form.head_circumference) payload.head_circumference = parseFloat(form.head_circumference);

      await growthService.addRecord(groupId, payload);
      Toast.show({ type: 'success', text1: 'Medição registrada com sucesso!' });
      navigation.goBack();
    } catch (error) {
      console.error('AddGrowthRecordScreen:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao salvar medição.',
        text2: error?.response?.data?.message || '',
      });
    } finally {
      setLoading(false);
    }
  };

  const ageMonths = calcAgeMonths(form.date);
  const ageLabel  = ageMonths != null
    ? ageMonths < 12
      ? `${ageMonths} ${ageMonths === 1 ? 'mês' : 'meses'} de idade`
      : `${Math.floor(ageMonths / 12)} ano${Math.floor(ageMonths / 12) > 1 ? 's' : ''} e ${ageMonths % 12} meses de idade`
    : null;

  const formatDate = (date) =>
    date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

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
          <Text style={styles.headerTitle}>Nova Medição</Text>
          {groupName ? <Text style={styles.headerSubtitle}>{groupName}</Text> : null}
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>

          {/* Dica */}
          <View style={styles.tip}>
            <Ionicons name="information-circle-outline" size={16} color={KIDS_GREEN} />
            <Text style={styles.tipText}>
              Preencha ao menos uma das medidas abaixo. Todas são opcionais individualmente.
            </Text>
          </View>

          {/* Data da medição */}
          <Field label="Data da medição *">
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputText}>{formatDate(form.date)}</Text>
                {ageLabel && <Text style={styles.ageHint}>{ageLabel}</Text>}
              </View>
              <Ionicons name="calendar-outline" size={18} color={colors.textLight} />
            </TouchableOpacity>
          </Field>

          {showDatePicker && (
            <DateTimePicker
              value={form.date}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setField('date', date);
              }}
            />
          )}

          {/* Divisor de medidas */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>MEDIDAS ANTROPOMÉTRICAS</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Peso */}
          <Field label="Peso (kg)" hint="Ex: 7.5">
            <View style={styles.inputRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="barbell-outline" size={18} color={colors.primary} />
              </View>
              <TextInput
                style={styles.inputFlex}
                value={form.weight}
                onChangeText={(v) => setField('weight', v)}
                placeholder="0.000"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </Field>

          {/* Comprimento/Altura */}
          <Field label="Comprimento / Altura (cm)" hint="Ex: 67.0">
            <View style={styles.inputRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#7c3aed15' }]}>
                <Ionicons name="resize-outline" size={18} color="#7c3aed" />
              </View>
              <TextInput
                style={styles.inputFlex}
                value={form.height}
                onChangeText={(v) => setField('height', v)}
                placeholder="0.0"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
              />
              <Text style={styles.unit}>cm</Text>
            </View>
          </Field>

          {/* Perímetro cefálico */}
          <Field label="Perímetro cefálico (cm)" hint="Ex: 43.5">
            <View style={styles.inputRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#0891b215' }]}>
                <Ionicons name="ellipse-outline" size={18} color="#0891b2" />
              </View>
              <TextInput
                style={styles.inputFlex}
                value={form.head_circumference}
                onChangeText={(v) => setField('head_circumference', v)}
                placeholder="0.0"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
              />
              <Text style={styles.unit}>cm</Text>
            </View>
          </Field>

          {/* Observações */}
          <Field label="Observações">
            <TextInput
              style={[styles.inputBase, styles.textArea]}
              value={form.notes}
              onChangeText={(v) => setField('notes', v)}
              placeholder="Observações do pediatra, intercorrências..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Field>

          {/* Referência OMS */}
          {birthDate && ageMonths != null && ageMonths <= 24 && (
            <OmsReference ageMonths={ageMonths} />
          )}

        </View>
      </ScrollView>

      {/* Botão salvar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Salvar medição</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Referência OMS inline ────────────────────────────────────────────────────
// Valores aproximados WHO para meninos; serve como referência rápida no formulário
const WHO_REFERENCE = {
  //  [mês]: { weight: [P3, P50, P97], height: [P3, P50, P97], head: [P3, P50, P97] }
  0:  { weight: [2.5, 3.3, 4.4],    height: [46.1, 49.9, 53.7], head: [32.1, 34.5, 37.0] },
  1:  { weight: [3.4, 4.5, 5.8],    height: [50.8, 54.7, 58.6], head: [34.9, 37.3, 39.7] },
  2:  { weight: [4.3, 5.6, 7.1],    height: [54.4, 58.4, 62.4], head: [36.4, 38.9, 41.3] },
  3:  { weight: [5.0, 6.4, 8.0],    height: [57.3, 61.4, 65.5], head: [37.5, 40.0, 42.5] },
  4:  { weight: [5.6, 7.0, 8.7],    height: [59.7, 63.9, 68.0], head: [38.4, 41.0, 43.6] },
  5:  { weight: [6.1, 7.5, 9.3],    height: [61.7, 65.9, 70.1], head: [39.2, 41.8, 44.5] },
  6:  { weight: [6.4, 7.9, 9.8],    height: [63.3, 67.6, 71.9], head: [39.9, 42.6, 45.2] },
  7:  { weight: [6.7, 8.3, 10.3],   height: [64.8, 69.2, 73.5], head: [40.5, 43.2, 45.9] },
  8:  { weight: [7.0, 8.6, 10.7],   height: [66.2, 70.6, 75.0], head: [41.0, 43.8, 46.5] },
  9:  { weight: [7.2, 8.9, 11.0],   height: [67.5, 72.0, 76.5], head: [41.5, 44.3, 47.0] },
  10: { weight: [7.5, 9.2, 11.4],   height: [68.7, 73.3, 77.9], head: [41.9, 44.7, 47.5] },
  11: { weight: [7.7, 9.4, 11.7],   height: [69.9, 74.5, 79.2], head: [42.3, 45.1, 47.9] },
  12: { weight: [7.8, 9.6, 12.0],   height: [71.0, 75.7, 80.5], head: [42.6, 45.4, 48.2] },
  15: { weight: [8.4, 10.3, 12.8],  height: [74.0, 79.1, 84.2], head: [43.4, 46.3, 49.2] },
  18: { weight: [8.9, 10.9, 13.7],  height: [76.9, 82.3, 87.7], head: [44.1, 47.0, 49.9] },
  21: { weight: [9.2, 11.5, 14.5],  height: [79.7, 85.1, 90.6], head: [44.7, 47.5, 50.4] },
  24: { weight: [9.7, 12.2, 15.3],  height: [81.7, 87.8, 93.9], head: [45.2, 48.0, 50.8] },
};

function closestWhoBracket(ageMonths) {
  const keys = Object.keys(WHO_REFERENCE).map(Number).sort((a, b) => a - b);
  let best = keys[0];
  for (const k of keys) {
    if (Math.abs(k - ageMonths) < Math.abs(best - ageMonths)) best = k;
  }
  return WHO_REFERENCE[best];
}

const OmsReference = ({ ageMonths }) => {
  const ref = closestWhoBracket(ageMonths);
  if (!ref) return null;

  return (
    <View style={styles.omsCard}>
      <View style={styles.omsHeader}>
        <Ionicons name="globe-outline" size={15} color={KIDS_GREEN} />
        <Text style={styles.omsTitle}>Referência OMS — {ageMonths}m (meninos)</Text>
      </View>
      <View style={styles.omsRow}>
        <OmsCell label="Peso (kg)"  p3={ref.weight[0]} p50={ref.weight[1]} p97={ref.weight[2]} color={colors.primary} />
        <OmsCell label="Altura (cm)" p3={ref.height[0]} p50={ref.height[1]} p97={ref.height[2]} color="#7c3aed" />
        <OmsCell label="PC (cm)"    p3={ref.head[0]}   p50={ref.head[1]}   p97={ref.head[2]}   color="#0891b2" />
      </View>
    </View>
  );
};

const OmsCell = ({ label, p3, p50, p97, color }) => (
  <View style={styles.omsCell}>
    <Text style={[styles.omsCellLabel, { color }]}>{label}</Text>
    <Text style={styles.omsCellRow}><Text style={styles.omsCellP}>P3 </Text>{p3}</Text>
    <Text style={[styles.omsCellRow, { fontWeight: '700' }]}><Text style={styles.omsCellP}>P50 </Text>{p50}</Text>
    <Text style={styles.omsCellRow}><Text style={styles.omsCellP}>P97 </Text>{p97}</Text>
  </View>
);

// ─── Campo de formulário ──────────────────────────────────────────────────────
const Field = ({ label, hint, children }) => (
  <View style={styles.field}>
    <View style={styles.fieldLabelRow}>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
    {children}
  </View>
);

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.backgroundLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:         { padding: 4 },
  headerCenter:    { flex: 1, marginLeft: 8 },
  headerTitle:     { fontSize: 18, fontWeight: '700', color: colors.text },
  headerSubtitle:  { fontSize: 12, color: colors.textLight, marginTop: 1 },
  scroll:          { flex: 1 },
  form:            { padding: 16, gap: 16 },

  tip:             { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, backgroundColor: KIDS_GREEN + '12', borderRadius: 10 },
  tipText:         { flex: 1, fontSize: 12, color: colors.text, lineHeight: 18 },

  field:           { gap: 6 },
  fieldLabelRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:           { fontSize: 13, fontWeight: '600', color: colors.text },
  hint:            { fontSize: 11, color: colors.textLight },

  input:           { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  inputText:       { fontSize: 14, color: colors.text, flex: 1 },
  ageHint:         { fontSize: 11, color: KIDS_GREEN, marginTop: 2, fontWeight: '500' },

  inputRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  iconCircle:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inputFlex:       { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  unit:            { fontSize: 13, color: colors.textLight, fontWeight: '500' },

  inputBase:       { backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text },
  textArea:        { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },

  divider:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine:     { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText:     { fontSize: 10, color: colors.textLight, fontWeight: '600', letterSpacing: 0.5 },

  omsCard:         { padding: 14, backgroundColor: KIDS_GREEN + '08', borderWidth: 1, borderColor: KIDS_GREEN + '30', borderRadius: 12 },
  omsHeader:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  omsTitle:        { fontSize: 12, fontWeight: '700', color: KIDS_GREEN },
  omsRow:          { flexDirection: 'row', gap: 8 },
  omsCell:         { flex: 1, gap: 3 },
  omsCellLabel:    { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  omsCellRow:      { fontSize: 11, color: colors.text },
  omsCellP:        { color: colors.textLight, fontSize: 10 },

  footer:          { padding: 16, backgroundColor: colors.backgroundLight, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: KIDS_GREEN, borderRadius: 12, paddingVertical: 14 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default AddGrowthRecordScreen;
