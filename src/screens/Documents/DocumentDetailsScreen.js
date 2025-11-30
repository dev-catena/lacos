import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import documentService from '../../services/documentService';
import API_CONFIG from '../../config/api';

const DocumentDetailsScreen = ({ route, navigation }) => {
  const { document } = route.params || {};
  const [downloading, setDownloading] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não informada';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleDownload = async () => {
    if (!document || !document.id) {
      Alert.alert('Erro', 'Documento inválido');
      return;
    }

    Alert.alert(
      'Download',
      'Deseja baixar este documento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Baixar', 
          onPress: async () => {
            try {
              setDownloading(true);
              
              // Usar o endpoint de download do backend (que requer autenticação)
              const downloadUrl = `${API_CONFIG.BASE_URL}/documents/${document.id}/download`;
              
              console.log('📥 Download - URL:', downloadUrl);
              console.log('📥 Download - Document:', JSON.stringify(document, null, 2));

              // Obter token de autenticação
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              const token = await AsyncStorage.getItem('@lacos:token');
              
              if (!token) {
                throw new Error('Usuário não autenticado');
              }

              // Determinar nome e tipo do arquivo
              const fileExtension = document.file_name?.split('.').pop() || 
                                   (document.file_type?.includes('jpeg') || document.file_type?.includes('jpg') ? 'jpg' : 
                                    document.file_type?.includes('png') ? 'png' : 
                                    document.file_type?.includes('pdf') ? 'pdf' : 'jpg');
              const fileName = document.file_name || `documento_${document.id}.${fileExtension}`;
              const fileUri = `${FileSystem.documentDirectory}${fileName}`;
              
              // Fazer download do arquivo com autenticação
              const downloadResult = await FileSystem.downloadAsync(
                downloadUrl,
                fileUri,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );
              
              console.log('📥 Download - Arquivo salvo em:', downloadResult.uri);
              console.log('📥 Download - Status:', downloadResult.status);
              
              if (downloadResult.status !== 200) {
                throw new Error(`Erro ao baixar arquivo: Status ${downloadResult.status}`);
              }
              
              // Compartilhar/abrir o arquivo
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(downloadResult.uri, {
                  mimeType: document.file_type || 'image/jpeg',
                  dialogTitle: 'Compartilhar Documento',
                });
                
                Toast.show({
                  type: 'success',
                  text1: 'Download concluído',
                  text2: 'Arquivo pronto para compartilhar',
                });
              } else {
                Alert.alert('Sucesso', `Arquivo salvo em: ${downloadResult.uri}`);
              }
            } catch (error) {
              console.error('Erro ao fazer download:', error);
              Alert.alert(
                'Erro ao baixar',
                error.message || 'Não foi possível baixar o documento. Tente novamente.'
              );
            } finally {
              setDownloading(false);
            }
          }
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Documento',
      'Tem certeza que deseja excluir este documento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implementar exclusão
            navigation.goBack();
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Documento</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview do Arquivo */}
        <View style={styles.previewSection}>
          {(() => {
            // Construir URL do arquivo para preview
            const fileUrl = document.file_path 
              ? `${API_CONFIG.BASE_URL.replace('/api', '')}/storage/${document.file_path}`
              : document.url || document.file_url;
            
            const isImage = document.file_type && (
              document.file_type.includes('image') || 
              document.file_type.includes('jpeg') || 
              document.file_type.includes('jpg') || 
              document.file_type.includes('png')
            );
            
            return isImage && fileUrl ? (
              <Image 
                source={{ uri: fileUrl }} 
                style={styles.imagePreview}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.pdfPreview}>
                <Ionicons name="document-text" size={80} color={colors.primary} />
                <Text style={styles.pdfText}>
                  {document.file_type === 'pdf' ? 'Documento PDF' : 'Documento'}
                </Text>
              </View>
            );
          })()}
        </View>

        {/* Informações */}
        <View style={styles.infoSection}>
          <Text style={styles.documentTitle}>{document.title}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="folder" size={20} color={colors.gray600} />
            <Text style={styles.infoLabel}>Tipo:</Text>
            <Text style={styles.infoValue}>{document.type}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color={colors.gray600} />
            <Text style={styles.infoLabel}>Data:</Text>
            <Text style={styles.infoValue}>{formatDate(document.document_date || document.date)}</Text>
          </View>

          {document.doctor_name && (
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={colors.gray600} />
              <Text style={styles.infoLabel}>Médico:</Text>
              <Text style={styles.infoValue}>{document.doctor_name}</Text>
            </View>
          )}
        </View>

        {/* Ações */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.actionButton, downloading && styles.actionButtonDisabled]} 
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="download-outline" size={24} color={colors.white} />
            )}
            <Text style={styles.actionButtonText}>
              {downloading ? 'Baixando...' : 'Baixar Documento'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]} 
            onPress={() => Alert.alert('Compartilhar', 'Funcionalidade em breve')}
          >
            <Ionicons name="share-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Compartilhar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  previewSection: {
    backgroundColor: colors.white,
    padding: 20,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  pdfPreview: {
    width: '100%',
    height: 300,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray600,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: colors.white,
    marginTop: 12,
    padding: 20,
  },
  documentTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.gray600,
    marginLeft: 12,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  actionsSection: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
});

export default DocumentDetailsScreen;

