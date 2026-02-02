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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import documentService from '../../services/documentService';
import { useAuth } from '../../contexts/AuthContext';
import SafeIcon from '../../components/SafeIcon';

const DocumentsScreen = ({ route, navigation }) => {
  const { groupId, groupName, patientId, patientName } = route.params || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [filterType, setFilterType] = useState('all');

  const documentTypes = [
    { id: 'all', label: 'Todos', icon: 'folder' },
    { id: 'exam_lab', label: 'Exame Lab', icon: 'flask' },
    { id: 'exam_image', label: 'Imagem', icon: 'image' },
    { id: 'prescription', label: 'Receita', icon: 'receipt' },
    { id: 'medical_leave', label: 'Afastamento', icon: 'calendar' },
    { id: 'medical_certificate', label: 'Afastamento', icon: 'calendar' },
    { id: 'report', label: 'Atestado', icon: 'document-text' },
    { id: 'other', label: 'Outro', icon: 'document' },
  ];

  useFocusEffect(
    React.useCallback(() => {
      loadDocuments();
    }, [groupId, patientId])
  );

  const loadDocuments = async () => {
    setLoading(true);
    try {
      let result = [];
      
      // Se for médico e tiver patientId, buscar documentos do paciente
      if (user?.profile === 'doctor' && patientId) {
        console.log('📂 DocumentsScreen - Carregando documentos do paciente:', patientId);
        result = await documentService.getDocumentsByPatient(patientId);
      } else if (groupId) {
        console.log('📂 DocumentsScreen - Carregando documentos do grupo:', groupId);
        result = await documentService.getDocumentsByGroup(groupId);
      } else {
        console.error('❌ DocumentsScreen - groupId ou patientId não fornecido');
        setDocuments([]);
        return;
      }
      
      console.log('✅ DocumentsScreen - Documentos carregados:', result.length);
      if (result.length > 0) {
        console.log('📋 DocumentsScreen - Primeiro documento (exemplo):', JSON.stringify(result[0], null, 2));
        // Verificar especificamente campos de afastamento
        const afastamentos = result.filter(doc => 
          doc.type === 'medical_leave' || doc.type === 'medical_certificate' || doc.type === 'report'
        );
        if (afastamentos.length > 0) {
          console.log('📅 DocumentsScreen - Afastamentos encontrados:', afastamentos.map(doc => ({
            id: doc.id,
            type: doc.type,
            title: doc.title,
            days: doc.days,
            daysType: typeof doc.days
          })));
        }
      }
      
      // Mapear para formato esperado (ajustar campos se necessário)
      const mappedDocs = result.map(doc => ({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        date: doc.document_date,
        consultation_id: doc.consultation_id,
        doctor_name: doc.doctor_name || null, // null em vez de 'Não especificado' para não exibir quando não houver médico
        days: doc.days !== undefined && doc.days !== null ? parseInt(doc.days, 10) : null, // Quantidade de dias de afastamento (preservar 0)
        start_date: doc.start_date || null,
        end_date: doc.end_date || null,
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

  const getDocumentIconComponent = (type) => {
    // Retornar null para usar Ionicons diretamente no Android
    return null;
  };

  const getDocumentIconName = (type) => {
    const iconMap = {
      'prescription': 'receipt',
      'medical_leave': 'calendar',
      'medical_certificate': 'calendar',
      'report': 'document-text',
      'exam_lab': 'flask',
      'exam_image': 'image',
      'other': 'document',
    };
    return iconMap[type] || 'document';
  };

  const getDocumentColor = (type) => {
    const colors_map = {
      exam_lab: colors.info,
      exam_image: colors.success,
      prescription: '#FFB6C1', // Rosa pastel para receitas
      medical_leave: '#B0E0E6', // Azul pastel para afastamentos
      medical_certificate: '#B0E0E6', // Azul pastel para afastamentos
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
        <SafeIcon 
          name={getDocumentIconName(item.type)} 
          size={28} 
          color={getDocumentColor(item.type)} 
        />
      </View>
      
      <View style={styles.docContent}>
        <Text style={styles.docTitle}>{item.title}</Text>
        {/* Mostrar quantidade de dias para afastamentos */}
        {(() => {
          const isAfastamento = item.type === 'medical_leave' || item.type === 'medical_certificate' || item.type === 'report';
          // Verificar se days existe e é um número válido (incluindo 0)
          const daysValue = item.days != null && item.days !== undefined && item.days !== '' 
            ? (typeof item.days === 'string' ? parseInt(item.days, 10) : item.days)
            : null;
          const hasDays = daysValue !== null && !isNaN(daysValue);
          
          // Debug log apenas para afastamentos
          if (isAfastamento) {
            console.log('📅 DocumentsScreen - Afastamento renderizando:', {
              type: item.type,
              daysRaw: item.days,
              daysValue,
              hasDays,
              title: item.title
            });
          }
          
          if (isAfastamento && hasDays) {
            return (
              <View style={styles.docInfoRow}>
                <Text style={styles.docDays}>{daysValue} {daysValue === 1 ? 'dia' : 'dias'}</Text>
              </View>
            );
          }
          return null;
        })()}
        <View style={styles.docInfoRow}>
          <SafeIcon name="calendar" size={14} color={colors.gray600} />
          <Text style={styles.docDate}>{formatDate(item.date)}</Text>
        </View>
      </View>

      <View style={styles.docFileType}>
        {item.file_type === 'pdf' ? (
          <SafeIcon name="document-text" size={20} color={colors.gray400} />
        ) : (
          <SafeIcon name="image" size={20} color={colors.gray400} />
        )}
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
          activeOpacity={0.7}
        >
          <SafeIcon name="arrow-back" size={24} color={colors.text || '#1e293b'} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Arquivos</Text>
          <Text style={styles.subtitle}>{patientName || groupName}</Text>
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
              <SafeIcon 
                  name={item.icon} 
                  size={16} 
                  color={filterType === item.id ? '#2C5F7C' : colors.gray600} 
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
          <SafeIcon name="folder" size={80} color={colors.gray300} />
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
        activeOpacity={0.8}
      >
        <SafeIcon name="add" size={28} color="#8B4A6B" />
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
    backgroundColor: '#F0F0F0', // Cinza pastel
    gap: 6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#B0E0E6', // Azul pastel
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray600,
  },
  filterChipTextActive: {
    color: '#2C5F7C', // Azul escuro para contraste com fundo pastel
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
    // Remover todas as sombras e bordas
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 0,
    borderColor: 'transparent',
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
  docInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  docDoctor: {
    fontSize: 14,
    color: colors.gray600,
    marginLeft: 4,
  },
  docDays: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  docDate: {
    fontSize: 14,
    color: colors.gray600,
    marginLeft: 4,
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
    backgroundColor: '#FFB6C1', // Rosa pastel
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default DocumentsScreen;

