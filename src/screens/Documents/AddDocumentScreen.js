import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
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

const AddDocumentScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  const documentTypes = [
    { id: 'exam_lab', label: 'Exame Laboratorial', icon: 'flask' },
    { id: 'exam_image', label: 'Exame de Imagem', icon: 'image' },
    { id: 'prescription', label: 'Receita', icon: 'document-text' },
    { id: 'report', label: 'Laudo', icon: 'document' },
    { id: 'other', label: 'Outro', icon: 'document-attach' },
  ];

  const [formData, setFormData] = useState({
    type: '',
    typeLabel: '',
    title: '',
    date: new Date().toISOString(),
    consultation_id: null,
    consultationLabel: '',
    notes: '',
    file: null,
  });

  const [consultations, setConsultations] = useState([
    // Mock data
    { id: 1, title: 'Consulta - Cardiologia', doctor: 'Dr. João Silva', date: '2025-11-20' },
    { id: 2, title: 'Consulta - Dermatologia', doctor: 'Dra. Maria Santos', date: '2025-11-18' },
  ]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeSelect = (type) => {
    updateField('type', type.id);
    updateField('typeLabel', type.label);
    setShowTypeModal(false);
  };

  const handleConsultationSelect = (consultation) => {
    updateField('consultation_id', consultation.id);
    updateField('consultationLabel', `${consultation.title} - ${consultation.doctor}`);
    setShowConsultationModal(false);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      updateField('date', date.toISOString());
    }
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para usar a câmera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      updateField('file', {
        uri: result.assets[0].uri,
        type: 'image',
        name: `document_${Date.now()}.jpg`,
      });
    }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar a galeria');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      updateField('file', {
        uri: result.assets[0].uri,
        type: 'image',
        name: `document_${Date.now()}.jpg`,
      });
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        updateField('file', {
          uri: result.uri,
          type: result.mimeType?.includes('pdf') ? 'pdf' : 'image',
          name: result.name,
        });
      }
    } catch (error) {
      console.error('Erro ao selecionar documento:', error);
    }
  };

  const showUploadOptions = () => {
    Alert.alert(
      'Selecionar Arquivo',
      'Escolha uma opção:',
      [
        { text: 'Tirar Foto', onPress: pickImageFromCamera },
        { text: 'Escolher da Galeria', onPress: pickImageFromGallery },
        { text: 'Escolher Arquivo (PDF)', onPress: pickDocument },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const validateForm = () => {
    if (!formData.file) {
      Toast.show({
        type: 'error',
        text1: 'Arquivo obrigatório',
        text2: 'Selecione um arquivo para enviar',
      });
      return false;
    }

    if (!formData.type) {
      Toast.show({
        type: 'error',
        text1: 'Tipo obrigatório',
        text2: 'Selecione o tipo de documento',
      });
      return false;
    }

    if (!formData.title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Título obrigatório',
        text2: 'Informe um título para o documento',
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar upload
      // const documentService = require('../../services/documentService').default;
      // const formDataUpload = new FormData();
      // formDataUpload.append('file', {
      //   uri: formData.file.uri,
      //   type: formData.file.type === 'pdf' ? 'application/pdf' : 'image/jpeg',
      //   name: formData.file.name,
      // });
      // formDataUpload.append('group_id', groupId);
      // formDataUpload.append('type', formData.type);
      // formDataUpload.append('title', formData.title);
      // formDataUpload.append('document_date', formData.date);
      // formDataUpload.append('consultation_id', formData.consultation_id || '');
      // formDataUpload.append('notes', formData.notes);
      // 
      // await documentService.uploadDocument(formDataUpload);

      Toast.show({
        type: 'success',
        text1: 'Documento enviado',
        text2: 'Arquivo adicionado com sucesso',
      });

      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao enviar',
        text2: 'Não foi possível enviar o documento',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Adicionar Documento</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={styles.saveButton}
        >
          <Text style={[styles.saveButtonText, loading && styles.saveButtonTextDisabled]}>
            {loading ? 'Enviando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Upload de Arquivo */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Arquivo *</Text>
          
          {formData.file ? (
            <View style={styles.filePreview}>
              {formData.file.type === 'image' ? (
                <Image source={{ uri: formData.file.uri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.pdfPreview}>
                  <Ionicons name="document-text" size={60} color={colors.primary} />
                  <Text style={styles.fileName}>{formData.file.name}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.changeFileButton}
                onPress={showUploadOptions}
              >
                <Text style={styles.changeFileText}>Trocar Arquivo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={showUploadOptions}>
              <Ionicons name="cloud-upload-outline" size={48} color={colors.primary} />
              <Text style={styles.uploadText}>Toque para selecionar arquivo</Text>
              <Text style={styles.uploadSubtext}>Foto, imagem ou PDF</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tipo de Documento */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tipo de Documento *</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowTypeModal(true)}
          >
            <Ionicons name="folder-open" size={20} color={colors.gray400} />
            <Text style={[
              styles.input,
              !formData.typeLabel && styles.placeholder
            ]}>
              {formData.typeLabel || 'Selecione o tipo...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Título */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Título do Documento *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="document-text-outline" size={20} color={colors.gray400} />
            <TextInput
              style={styles.input}
              placeholder="Ex: Hemograma Completo"
              value={formData.title}
              onChangeText={(value) => updateField('title', value)}
              placeholderTextColor={colors.gray400}
            />
          </View>
        </View>

        {/* Data do Documento */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Data de Realização *</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.gray400} />
            <Text style={styles.dateText}>{formatDate(formData.date)}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.gray400} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(formData.date)}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Consulta Relacionada */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Consulta Relacionada (opcional)</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowConsultationModal(true)}
          >
            <Ionicons name="medical-outline" size={20} color={colors.gray400} />
            <Text style={[
              styles.input,
              !formData.consultationLabel && styles.placeholder
            ]}>
              {formData.consultationLabel || 'Selecionar consulta...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Observações */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Observações</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <Ionicons name="chatbox-outline" size={20} color={colors.gray400} style={{ alignSelf: 'flex-start', marginTop: 12 }} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Informações adicionais (opcional)..."
              value={formData.notes}
              onChangeText={(value) => updateField('notes', value)}
              placeholderTextColor={colors.gray400}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Tipos */}
      <Modal
        visible={showTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tipo de Documento</Text>
              <TouchableOpacity
                onPress={() => setShowTypeModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={documentTypes}
              keyExtractor={(item) => item.id}
              style={styles.flatList}
              contentContainerStyle={styles.flatListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.typeItem,
                    formData.type === item.id && styles.typeItemSelected
                  ]}
                  onPress={() => handleTypeSelect(item)}
                >
                  <Ionicons name={item.icon} size={24} color={formData.type === item.id ? colors.primary : colors.gray600} />
                  <Text style={[
                    styles.typeItemText,
                    formData.type === item.id && styles.typeItemTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {formData.type === item.id && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Consultas */}
      <Modal
        visible={showConsultationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConsultationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Consulta Relacionada</Text>
              <TouchableOpacity
                onPress={() => setShowConsultationModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: null, title: 'Nenhuma consulta', doctor: '', date: '' }, ...consultations]}
              keyExtractor={(item) => item.id?.toString() || 'none'}
              style={styles.flatList}
              contentContainerStyle={styles.flatListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.consultationItem,
                    formData.consultation_id === item.id && styles.typeItemSelected
                  ]}
                  onPress={() => handleConsultationSelect(item)}
                >
                  <View style={styles.consultationInfo}>
                    <Text style={styles.consultationTitle}>{item.title}</Text>
                    {item.doctor && (
                      <Text style={styles.consultationDoctor}>{item.doctor} - {item.date}</Text>
                    )}
                  </View>
                  {formData.consultation_id === item.id && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 2,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  saveButtonTextDisabled: {
    color: colors.gray400,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  uploadSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: colors.primary + '10',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 4,
  },
  filePreview: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  pdfPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    marginTop: 12,
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
  },
  changeFileButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  changeFileText: {
    color: colors.white,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    color: colors.gray400,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  flatList: {
    backgroundColor: '#FFFFFF',
  },
  flatListContent: {
    backgroundColor: '#FFFFFF',
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  typeItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  typeItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  typeItemTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  consultationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  consultationInfo: {
    flex: 1,
  },
  consultationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  consultationDoctor: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray100,
  },
});

export default AddDocumentScreen;

