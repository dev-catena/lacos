import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

const DocumentDetailsScreen = ({ route, navigation }) => {
  const { document } = route.params || {};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleDownload = () => {
    Alert.alert(
      'Download',
      'Deseja baixar este documento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Baixar', 
          onPress: () => {
            // TODO: Implementar download
            console.log('Download:', document.file_url);
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
        <Text style={styles.headerTitle}>Detalhes do Documento</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview do Arquivo */}
        <View style={styles.previewSection}>
          {document.file_type === 'image' ? (
            <Image 
              source={{ uri: document.file_url }} 
              style={styles.imagePreview}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.pdfPreview}>
              <Ionicons name="document-text" size={80} color={colors.primary} />
              <Text style={styles.pdfText}>Documento PDF</Text>
            </View>
          )}
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
            <Text style={styles.infoValue}>{formatDate(document.date)}</Text>
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
          <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
            <Ionicons name="download-outline" size={24} color={colors.white} />
            <Text style={styles.actionButtonText}>Baixar Documento</Text>
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
});

export default DocumentDetailsScreen;

