import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import groupService from '../../services/groupService';
import KidsBackground from '../../components/KidsBackground';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Formata HH:MM ao digitar (aceita "14:32" ou "1432")
function formatTimeInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ':' + digits.slice(2);
}

// Normaliza o tempo para exibição — MySQL retorna "HH:MM:SS", mostramos só "HH:MM"
function displayTime(val) {
  if (!val) return '';
  // "14:32:00" → "14:32"
  return String(val).slice(0, 5);
}

// Formata peso/altura como decimal com vírgula
function formatDecimal(raw) {
  return raw.replace(/[^0-9,.]/, '');
}

export default function KidsProfileScreen({ route, navigation }) {
  const { groupId, groupName, isAdmin } = route.params || {};
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [fields, setFields] = useState({
    accompanied_name: '',
    mother_name: '',
    accompanied_birth_date: '',
    birth_time: '',
    birth_weight: '',
    birth_height: '',
    blood_type: '',
    allergies: '',
  });

  // Cópia para cancelar edição
  const [original, setOriginal] = useState({});

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const result = await groupService.getGroup(groupId);
      if (result.success && result.data) {
        const g = result.data;
        const data = {
          accompanied_name: g.accompanied_name || '',
          mother_name: g.mother_name || '',
          accompanied_birth_date: g.accompanied_birth_date || '',
          birth_time: displayTime(g.birth_time),
          birth_weight: g.birth_weight != null ? String(Math.round(Number(g.birth_weight))) : '',
          birth_height: g.birth_height != null ? String(g.birth_height).replace('.', ',') : '',
          blood_type: g.blood_type || '',
          allergies: g.allergies || '',
        };
        setFields(data);
        setOriginal(data);
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar perfil' });
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleEdit = () => {
    setOriginal({ ...fields });
    setEditing(true);
  };

  const handleCancel = () => {
    setFields({ ...original });
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        accompanied_name: fields.accompanied_name || null,
        mother_name: fields.mother_name || null,
        accompanied_birth_date: fields.accompanied_birth_date || null,
        birth_time: fields.birth_time || null,
        birth_weight: fields.birth_weight
          ? parseInt(fields.birth_weight, 10)
          : null,
        birth_height: fields.birth_height
          ? parseFloat(fields.birth_height.replace(',', '.'))
          : null,
        blood_type: fields.blood_type || null,
        allergies: fields.allergies || null,
      };

      const result = await groupService.updateGroup(groupId, payload);
      if (result.success) {
        Toast.show({ type: 'success', text1: 'Perfil salvo!' });
        setEditing(false);
        setOriginal({ ...fields });
        // Recarregar para confirmar dados salvos
        loadProfile();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro ao salvar',
          text2: result.error || 'Verifique sua conexão e tente novamente',
        });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erro ao salvar perfil', text2: e?.message || '' });
    } finally {
      setSaving(false);
    }
  };

  const set = (key, value) => setFields(prev => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <KidsBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      <KidsBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Perfil da Criança</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        {isAdmin && !editing && (
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="pencil" size={16} color="#fff" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        )}
        {editing && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar / ícone */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Ionicons name="happy" size={52} color="#a78bfa" />
            </View>
            <Text style={styles.childName}>
              {fields.accompanied_name || 'Nome da criança'}
            </Text>
          </View>

          {/* Seção: Identificação */}
          <SectionTitle title="Identificação" icon="person" />

          <Field
            label="Nome da Criança"
            value={fields.accompanied_name}
            editing={editing}
            onChangeText={v => set('accompanied_name', v)}
            placeholder="Nome completo"
          />
          <Field
            label="Nome da Mãe"
            value={fields.mother_name}
            editing={editing}
            onChangeText={v => set('mother_name', v)}
            placeholder="Nome completo da mãe"
          />

          {/* Seção: Nascimento */}
          <SectionTitle title="Nascimento" icon="calendar" />

          <Field
            label="Data de Nascimento"
            value={fields.accompanied_birth_date}
            editing={editing}
            onChangeText={v => set('accompanied_birth_date', v)}
            placeholder="AAAA-MM-DD"
            keyboardType="numeric"
            hint="Formato: AAAA-MM-DD"
          />
          <Field
            label="Hora do Nascimento"
            value={fields.birth_time}
            editing={editing}
            onChangeText={v => set('birth_time', formatTimeInput(v))}
            placeholder="HH:MM"
            keyboardType="numeric"
            maxLength={5}
            hint="Formato: HH:MM (ex: 14:32)"
          />
          <Field
            label="Peso ao Nascer (g)"
            value={fields.birth_weight}
            editing={editing}
            onChangeText={v => set('birth_weight', v.replace(/[^0-9]/g, ''))}
            placeholder="Ex: 3250"
            keyboardType="numeric"
            hint="Em gramas (ex: 3250)"
          />
          <Field
            label="Comprimento ao Nascer (cm)"
            value={fields.birth_height}
            editing={editing}
            onChangeText={v => set('birth_height', formatDecimal(v))}
            placeholder="Ex: 50,5"
            keyboardType="decimal-pad"
            hint="Em centímetros (ex: 50,5)"
          />

          {/* Seção: Saúde */}
          <SectionTitle title="Saúde" icon="medkit" />

          {/* Tipo sanguíneo: seletor visual */}
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Tipo Sanguíneo</Text>
            {editing ? (
              <View style={styles.bloodTypeGrid}>
                {BLOOD_TYPES.map(bt => (
                  <TouchableOpacity
                    key={bt}
                    style={[
                      styles.bloodTypeBtn,
                      fields.blood_type === bt && styles.bloodTypeBtnSelected,
                    ]}
                    onPress={() => set('blood_type', fields.blood_type === bt ? '' : bt)}
                  >
                    <Text
                      style={[
                        styles.bloodTypeBtnText,
                        fields.blood_type === bt && styles.bloodTypeBtnTextSelected,
                      ]}
                    >
                      {bt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.fieldValue, !fields.blood_type && styles.fieldValueEmpty]}>
                {fields.blood_type || 'Não informado'}
              </Text>
            )}
          </View>

          <Field
            label="Alergias"
            value={fields.allergies}
            editing={editing}
            onChangeText={v => set('allergies', v)}
            placeholder="Ex: Leite de vaca, amendoim…"
            multiline
            numberOfLines={3}
            hint="Separe por vírgula se houver mais de uma"
          />

          {/* Botão Salvar */}
          {editing && (
            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* Componentes auxiliares */

function SectionTitle({ title, icon }) {
  return (
    <View style={styles.sectionTitle}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.sectionTitleText}>{title}</Text>
    </View>
  );
}

function Field({ label, value, editing, onChangeText, placeholder, keyboardType, multiline, numberOfLines, hint, maxLength }) {
  return (
    <View style={styles.fieldCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing ? (
        <>
          <TextInput
            style={[styles.fieldInput, multiline && { height: 72, textAlignVertical: 'top' }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            keyboardType={keyboardType || 'default'}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
          />
          {hint && <Text style={styles.fieldHint}>{hint}</Text>}
        </>
      ) : (
        <Text style={[styles.fieldValue, !value && styles.fieldValueEmpty]}>
          {value || 'Não informado'}
        </Text>
      )}
    </View>
  );
}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textLight,
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  childName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  fieldValueEmpty: {
    color: colors.placeholder,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  fieldInput: {
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.gray50,
  },
  fieldHint: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  bloodTypeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.gray50,
  },
  bloodTypeBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bloodTypeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bloodTypeBtnTextSelected: {
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
