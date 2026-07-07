import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import KidsBackground from '../../components/KidsBackground';
import { isKidsGroup } from '../../stores/currentGroupStore';
import groupService from '../../services/groupService';
import colors from '../../constants/colors';
import {
  formatDateInputBR,
  formatDateToBR,
  isValidBirthDateBR,
  birthDateBRToISO,
} from '../../utils/dateInputMask';

const KIDS_GREEN = '#16a34a';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const KidsBabyProfileScreen = ({ route, navigation }) => {
  const { groupId, groupName, isAdmin = false } = route.params || {};

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState(false);
  const [groupData, setGroupData] = useState(null);

  const [form, setForm] = useState({
    accompanied_name:       '',
    accompanied_birth_date: '',
    birth_time:             '',
    birth_weight:           '',
    birth_height:           '',
    blood_type:             '',
    allergies:              '',
    mother_name:            '',
  });

  useFocusEffect(
    useCallback(() => {
      loadGroup();
    }, [groupId])
  );

  const loadGroup = async () => {
    setLoading(true);
    try {
      const result = await groupService.getGroup(groupId);
      if (result.success) {
        const g = result.data;
        setGroupData(g);
        setForm({
          accompanied_name:       g.accompanied_name        || g.name || '',
          accompanied_birth_date: g.accompanied_birth_date ? formatDateToBR(g.accompanied_birth_date) : '',
          birth_time:             g.birth_time              || '',
          birth_weight:           g.birth_weight            ? String(g.birth_weight)  : '',
          birth_height:           g.birth_height            ? String(g.birth_height)  : '',
          blood_type:             g.blood_type              || '',
          allergies:              g.allergies               || '',
          mother_name:            g.mother_name             || '',
        });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar perfil do bebê.' });
    } finally {
      setLoading(false);
    }
  };

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.accompanied_name.trim()) {
      Toast.show({ type: 'error', text1: 'Informe o nome do bebê.' });
      return;
    }
    if (form.accompanied_birth_date && !isValidBirthDateBR(form.accompanied_birth_date)) {
      Toast.show({ type: 'error', text1: 'Data de nascimento inválida.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        accompanied_name: form.accompanied_name.trim(),
        accompanied_birth_date: form.accompanied_birth_date
          ? birthDateBRToISO(form.accompanied_birth_date)
          : null,
        birth_time:   form.birth_time   || null,
        birth_weight: form.birth_weight ? parseFloat(form.birth_weight) : null,
        birth_height: form.birth_height ? parseFloat(form.birth_height) : null,
        blood_type:   form.blood_type   || null,
        allergies:    form.allergies    || null,
        mother_name:  form.mother_name  || null,
      };

      await groupService.updateGroup(groupId, payload);
      Toast.show({ type: 'success', text1: 'Perfil atualizado com sucesso!' });
      setEditing(false);
      loadGroup();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erro ao salvar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    loadGroup();
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
          <Text style={styles.headerTitle}>Perfil do Bebê</Text>
          {groupName ? <Text style={styles.headerSubtitle}>{groupName}</Text> : null}
        </View>
        {isAdmin && !editing && (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={22} color={KIDS_GREEN} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KIDS_GREEN} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Avatar placeholder */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Ionicons name="happy" size={48} color={KIDS_GREEN} />
            </View>
            {!editing && (
              <Text style={styles.babyName}>{form.accompanied_name || '—'}</Text>
            )}
          </View>

          {editing ? (
            /* ── Modo edição ── */
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Editar Informações</Text>

              <Field label="Nome do bebê *">
                <TextInput style={styles.input} value={form.accompanied_name}
                  onChangeText={v => setField('accompanied_name', v)} placeholder="Nome completo" placeholderTextColor={colors.placeholder} />
              </Field>

              <Field label="Data de nascimento">
                <TextInput style={styles.input} value={form.accompanied_birth_date}
                  onChangeText={v => setField('accompanied_birth_date', formatDateInputBR(v))}
                  placeholder="DD/MM/AAAA" placeholderTextColor={colors.placeholder} keyboardType="numeric" maxLength={10} />
              </Field>

              <Field label="Hora de nascimento">
                <TextInput style={styles.input} value={form.birth_time}
                  onChangeText={v => setField('birth_time', v)}
                  placeholder="HH:MM" placeholderTextColor={colors.placeholder} keyboardType="numbers-and-punctuation" maxLength={5} />
              </Field>

              <Field label="Peso ao nascer (g)">
                <TextInput style={styles.input} value={form.birth_weight}
                  onChangeText={v => setField('birth_weight', v)}
                  placeholder="Ex: 3250" placeholderTextColor={colors.placeholder} keyboardType="decimal-pad" />
              </Field>

              <Field label="Comprimento ao nascer (cm)">
                <TextInput style={styles.input} value={form.birth_height}
                  onChangeText={v => setField('birth_height', v)}
                  placeholder="Ex: 49.5" placeholderTextColor={colors.placeholder} keyboardType="decimal-pad" />
              </Field>

              <Field label="Tipo sanguíneo">
                <View style={styles.bloodTypeRow}>
                  {BLOOD_TYPES.map(bt => (
                    <TouchableOpacity key={bt}
                      style={[styles.bloodTypeBtn, form.blood_type === bt && styles.bloodTypeBtnActive]}
                      onPress={() => setField('blood_type', form.blood_type === bt ? '' : bt)}>
                      <Text style={[styles.bloodTypeBtnText, form.blood_type === bt && styles.bloodTypeBtnTextActive]}>{bt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>

              <Field label="Alergias">
                <TextInput style={[styles.input, styles.textArea]} value={form.allergies}
                  onChangeText={v => setField('allergies', v)}
                  placeholder="Descreva alergias conhecidas..." placeholderTextColor={colors.placeholder}
                  multiline numberOfLines={3} textAlignVertical="top" />
              </Field>

              <Field label="Nome da mãe">
                <TextInput style={styles.input} value={form.mother_name}
                  onChangeText={v => setField('mother_name', v)}
                  placeholder="Nome completo da mãe" placeholderTextColor={colors.placeholder} />
              </Field>

              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveBtnText}>Salvar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ── Modo visualização ── */
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informações de Nascimento</Text>

              <InfoRow icon="calendar-outline"     color={KIDS_GREEN}   label="Data de nascimento" value={form.accompanied_birth_date || '—'} />
              <InfoRow icon="time-outline"          color={KIDS_GREEN}   label="Hora de nascimento" value={form.birth_time     ? formatTime(form.birth_time) : '—'} />
              <InfoRow icon="barbell-outline"       color={colors.primary} label="Peso ao nascer"   value={form.birth_weight  ? `${form.birth_weight} g`  : '—'} />
              <InfoRow icon="resize-outline"        color="#7c3aed"      label="Comprimento"        value={form.birth_height  ? `${form.birth_height} cm` : '—'} />
              <InfoRow icon="water-outline"         color="#0891b2"      label="Tipo sanguíneo"     value={form.blood_type    || '—'} />
              <InfoRow icon="warning-outline"       color={colors.warning} label="Alergias"         value={form.allergies     || 'Nenhuma registrada'} />
              <InfoRow icon="person-outline"        color={colors.secondary} label="Nome da mãe"   value={form.mother_name   || '—'} />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────
const InfoRow = ({ icon, color, label, value }) => (
  <View style={styles.infoRow}>
    <View style={[styles.infoIconWrap, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View style={styles.infoText}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const Field = ({ label, children }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

const formatTime = (t) => {
  if (!t) return '—';
  return t.substring(0, 5);
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.backgroundLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:          { padding: 4 },
  headerCenter:     { flex: 1, marginLeft: 8 },
  headerTitle:      { fontSize: 18, fontWeight: '700', color: colors.text },
  headerSubtitle:   { fontSize: 12, color: colors.textLight, marginTop: 1 },
  editBtn:          { padding: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:           { padding: 16, paddingBottom: 40 },

  avatarSection:    { alignItems: 'center', marginBottom: 20 },
  avatar:           { width: 88, height: 88, borderRadius: 44, backgroundColor: KIDS_GREEN + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  babyName:         { fontSize: 22, fontWeight: '800', color: colors.text },

  card:             { backgroundColor: colors.backgroundLight, borderRadius: 16, padding: 18, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  sectionTitle:     { fontSize: 14, fontWeight: '700', color: KIDS_GREEN, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },

  infoRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoIconWrap:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoText:         { flex: 1, gap: 2 },
  infoLabel:        { fontSize: 11, color: colors.textLight, fontWeight: '600', textTransform: 'uppercase' },
  infoValue:        { fontSize: 15, fontWeight: '600', color: colors.text },

  field:            { gap: 6, marginBottom: 14 },
  fieldLabel:       { fontSize: 13, fontWeight: '600', color: colors.text },
  input:            { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text },
  textArea:         { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },

  bloodTypeRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bloodTypeBtn:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.backgroundLight },
  bloodTypeBtnActive: { borderColor: KIDS_GREEN, backgroundColor: KIDS_GREEN + '15' },
  bloodTypeBtnText: { fontSize: 13, fontWeight: '600', color: colors.textLight },
  bloodTypeBtnTextActive: { color: KIDS_GREEN },

  editActions:      { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn:        { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  cancelBtnText:    { fontSize: 14, fontWeight: '600', color: colors.textLight },
  saveBtn:          { flex: 2, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: KIDS_GREEN },
  saveBtnText:      { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default KidsBabyProfileScreen;
