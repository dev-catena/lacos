import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import vaccinationService from '../../services/vaccinationService';

const AddVaccinationScreen = ({ route, navigation }) => {
  const { groupId, groupName, scheduleItem } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pniSchedule, setPniSchedule] = useState([]);

  const [form, setForm] = useState({
    vaccine_schedule_id: scheduleItem?.id || null,
    vaccine_name: scheduleItem?.vaccine_name || '',
    dose: scheduleItem?.dose || '',
    applied_at: new Date(),
    batch_number: '',
    location: '',
    professional_name: '',
    notes: '',
    document: null,
  });

  // Carregar calendário PNI para o picker
  useEffect(() => {
    vaccinationService
      .getSchedule(groupId)
      .then((res) => setPniSchedule(res.schedule || []))
      .catch(() => {});
  }, [groupId]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickDocument = async () => {
    Alert.alert('Comprovante', 'Como deseja adicionar o comprovante?', [
      {
        text: 'Câmera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!result.canceled && result.assets?.[0]) {
            setField('document', result.assets[0]);
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
          if (!result.canceled && result.assets?.[0]) {
            setField('document', result.assets[0]);
          }
        },
      },
      {
        text: 'PDF',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
          if (result.assets?.[0]) {
            setField('document', result.assets[0]);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!form.vaccine_name.trim()) {
      Toast.show({ type: 'error', text1: 'Informe o nome da vacina.' });
      return;
    }
    if (!form.dose.trim()) {
      Toast.show({ type: 'error', text1: 'Informe a dose.' });
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      if (form.vaccine_schedule_id) data.append('vaccine_schedule_id', String(form.vaccine_schedule_id));
      data.append('vaccine_name', form.vaccine_name.trim());
      data.append('dose', form.dose.trim());
      data.append('applied_at', form.applied_at.toISOString().split('T')[0]);
      if (form.batch_number) data.append('batch_number', form.batch_number);
      if (form.location) data.append('location', form.location);
      if (form.professional_name) data.append('professional_name', form.professional_name);
      if (form.notes) data.append('notes', form.notes);

      if (form.document) {
        const uri = form.document.uri;
        const mimeType = form.document.mimeType || (uri.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
        const ext = mimeType === 'application/pdf' ? 'pdf' : 'jpg';
        data.append('document', {
          uri,
          name: `comprovante_vacina.${ext}`,
          type: mimeType,
        });
      }

      await vaccinationService.addRecord(groupId, data);
      Toast.show({ type: 'success', text1: 'Vacina registrada com sucesso!' });
      navigation.goBack();
    } catch (error) {
      console.error('AddVaccinationScreen:', error);
      Toast.show({ type: 'error', text1: 'Erro ao registrar vacina.', text2: error?.response?.data?.message || '' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Registrar Vacina</Text>
          {groupName ? <Text style={styles.headerSubtitle}>{groupName}</Text> : null}
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>

          {/* Vacina */}
          <Field label="Vacina *">
            <TextInput
              style={styles.input}
              value={form.vaccine_name}
              onChangeText={(v) => setField('vaccine_name', v)}
              placeholder="Nome da vacina"
              placeholderTextColor={colors.placeholder}
            />
          </Field>

          {/* Dose */}
          <Field label="Dose *">
            <TextInput
              style={styles.input}
              value={form.dose}
              onChangeText={(v) => setField('dose', v)}
              placeholder="Ex: 1ª dose, Reforço"
              placeholderTextColor={colors.placeholder}
            />
          </Field>

          {/* Data de aplicação */}
          <Field label="Data de aplicação *">
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.inputText}>{formatDate(form.applied_at)}</Text>
              <Ionicons name="calendar-outline" size={18} color={colors.textLight} />
            </TouchableOpacity>
          </Field>

          {showDatePicker && (
            <DateTimePicker
              value={form.applied_at}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setField('applied_at', date);
              }}
            />
          )}

          {/* Número do lote */}
          <Field label="Número do lote">
            <TextInput
              style={styles.input}
              value={form.batch_number}
              onChangeText={(v) => setField('batch_number', v)}
              placeholder="Opcional"
              placeholderTextColor={colors.placeholder}
            />
          </Field>

          {/* Local */}
          <Field label="Local de aplicação">
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText={(v) => setField('location', v)}
              placeholder="UBS, Clínica, Hospital..."
              placeholderTextColor={colors.placeholder}
            />
          </Field>

          {/* Profissional */}
          <Field label="Profissional responsável">
            <TextInput
              style={styles.input}
              value={form.professional_name}
              onChangeText={(v) => setField('professional_name', v)}
              placeholder="Nome do profissional"
              placeholderTextColor={colors.placeholder}
            />
          </Field>

          {/* Observações */}
          <Field label="Observações">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.notes}
              onChangeText={(v) => setField('notes', v)}
              placeholder="Observações adicionais..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Field>

          {/* Comprovante */}
          <Field label="Comprovante (foto/PDF)">
            {form.document ? (
              <View style={styles.docPreview}>
                {form.document.mimeType === 'application/pdf' ? (
                  <View style={styles.pdfPreview}>
                    <Ionicons name="document-text" size={32} color={colors.error} />
                    <Text style={styles.pdfName} numberOfLines={1}>{form.document.name || 'arquivo.pdf'}</Text>
                  </View>
                ) : (
                  <Image source={{ uri: form.document.uri }} style={styles.docImage} />
                )}
                <TouchableOpacity style={styles.removeDoc} onPress={() => setField('document', null)}>
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
                <Text style={styles.uploadText}>Adicionar comprovante</Text>
              </TouchableOpacity>
            )}
          </Field>

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
              <Text style={styles.saveBtnText}>Salvar registro</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const Field = ({ label, children }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.backgroundLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:         { padding: 4 },
  headerCenter:    { flex: 1, marginLeft: 8 },
  headerTitle:     { fontSize: 18, fontWeight: '700', color: colors.text },
  headerSubtitle:  { fontSize: 12, color: colors.textLight, marginTop: 1 },
  scroll:          { flex: 1 },
  form:            { padding: 16, gap: 16 },

  field:           { gap: 6 },
  label:           { fontSize: 13, fontWeight: '600', color: colors.text },
  input:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text },
  inputText:       { fontSize: 14, color: colors.text, flex: 1 },
  textArea:        { minHeight: 80, paddingTop: 12 },

  uploadBtn:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primary + '12', borderWidth: 1, borderColor: colors.primary + '40', borderRadius: 10, padding: 14, borderStyle: 'dashed' },
  uploadText:      { fontSize: 14, color: colors.primary, fontWeight: '600' },

  docPreview:      { position: 'relative' },
  docImage:        { width: '100%', height: 180, borderRadius: 10, resizeMode: 'cover' },
  pdfPreview:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.gray100, borderRadius: 10, padding: 14 },
  pdfName:         { flex: 1, fontSize: 13, color: colors.text },
  removeDoc:       { position: 'absolute', top: 8, right: 8 },

  footer:          { padding: 16, backgroundColor: colors.backgroundLight, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default AddVaccinationScreen;
