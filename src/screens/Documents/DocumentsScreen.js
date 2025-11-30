import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import documentService from '../../services/documentService';

const DocumentsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [filterType, setFilterType] = useState('all');

  const documentTypes = [
    { id: 'all', label: 'Todos', icon: 'folder' },
    { id: 'exam_lab', label: 'Exame Lab', icon: 'flask' },
    { id: 'exam_image', label: 'Imagem', icon: 'image' },
    { id: 'prescription', label: 'Receita', icon: 'document-text' },
    { id: 'report', label: 'Laudo', icon: 'document' },
    { id: 'other', label: 'Outro', icon: 'document-attach' },
  ];

  useFocusEffect(
    React.useCallback(() => {
      loadDocuments();
    }, [groupId])
  );

  const loadDocuments = async () => {
    setLoading(true);
    try {
      console.log('📂 DocumentsScreen - Carregando documentos do grupo:', groupId);
      
      if (!groupId) {
        console.error('❌ DocumentsScreen - groupId não fornecido');
        setDocuments([]);
        return;
      }

      // Chamar API real
      const result = await documentService.getDocumentsByGroup(groupId);
      
      console.log('✅ DocumentsScreen - Documentos carregados:', result.length);
      
      // Mapear para formato esperado (ajustar campos se necessário)
      const mappedDocs = result.map(doc => ({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        date: doc.document_date,
        consultation_id: doc.consultation_id,
        doctor_name: doc.doctor_name || 'Não especificado',
        file_url: doc.file_url,
        file_type: doc.file_type,
        notes: doc.notes,
        user_name: doc.user_name,
        group_name: doc.group_name,
      }));

      setDocuments(mappedDocs);
    } catch (error) {
      console.error('❌ DocumentsScreen - Erro ao carregar documentos:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentIcon = (type) => {
    const typeObj = documentTypes.find(t => t.id === type);
    return typeObj ? typeObj.icon : 'document';
  };

  const getDocumentColor = (type) => {
    const colors_map = {
      exam_lab: colors.info,
      exam_image: colors.success,
      prescription: colors.secondary,
      report: colors.warning,
      other: colors.gray600,
    };
    return colors_map[type] || colors.gray600;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredDocuments = filterType === 'all'
    ? documents
    : documents.filter(doc => doc.type === filterType);

  const renderDocumentCard = ({ item }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => navigation.navigate('DocumentDetails', { document: item, groupId })}
    >
      <View style={[styles.docIcon, { backgroundColor: getDocumentColor(item.type) + '20' }]}>
        <Ionicons name={getDocumentIcon(item.type)} size={28} color={getDocumentColor(item.type)} />
      </View>
      
      <View style={styles.docContent}>
        <Text style={styles.docTitle}>{item.title}</Text>
        {item.doctor_name && (
          <Text style={styles.docDoctor}>
            <Ionicons name="person" size={14} color={colors.gray600} /> {item.doctor_name}
          </Text>
        )}
        <Text style={styles.docDate}>
          <Ionicons name="calendar-outline" size={14} color={colors.gray600} /> {formatDate(item.date)}
        </Text>
      </View>

      <View style={styles.docFileType}>
        <Ionicons
          name={item.file_type === 'pdf' ? 'document-text' : 'image'}
          size={20}
          color={colors.gray400}
        />
      </View>
    </TouchableOpacity>
  );

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
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Arquivos</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={documentTypes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === item.id && styles.filterChipActive
              ]}
              onPress={() => setFilterType(item.id)}
            >
              <Ionicons 
                name={item.icon} 
                size={16} 
                color={filterType === item.id ? colors.white : colors.gray600} 
              />
              <Text style={[
                styles.filterChipText,
                filterType === item.id && styles.filterChipTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Lista de Documentos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando documentos...</Text>
        </View>
      ) : filteredDocuments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={80} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Nenhum documento</Text>
          <Text style={styles.emptyText}>
            {filterType === 'all'
              ? 'Adicione documentos clicando no botão +'
              : 'Nenhum documento deste tipo'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDocuments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDocumentCard}
          contentContainerStyle={styles.documentsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Botão Flutuante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddDocument', { groupId, groupName })}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 2,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  filtersList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    gap: 6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray600,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray600,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: 8,
  },
  documentsList: {
    padding: 20,
    paddingBottom: 100,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  docIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  docContent: {
    flex: 1,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  docDoctor: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 2,
  },
  docDate: {
    fontSize: 14,
    color: colors.gray600,
  },
  docFileType: {
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default DocumentsScreen;

