import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeIcon from '../../components/SafeIcon';
// Removidos imports de ícones SVG customizados - usando Ionicons diretamente para compatibilidade Android
import colors from '../../constants/colors';
import Toast from 'react-native-toast-message';
import apiService from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import documentService from '../../services/documentService';
import planService from '../../services/planService';
import API_CONFIG from '../../config/api';
import appointmentService from '../../services/appointmentService';

const ClientDetailsScreen = ({ route, navigation }) => {
  const { client: clientParam } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [client, setClient] = useState(clientParam);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [userPlan, setUserPlan] = useState(null);
  const [photoError, setPhotoError] = useState(false); // Estado para controlar erro na foto

  // Resetar erro de foto quando o cliente mudar
  useEffect(() => {
    setPhotoError(false);
    console.log('🔄 ClientDetailsScreen - Cliente mudou, resetando photoError');
  }, [client?.id, client?.photo_url, client?.photo]);

  useFocusEffect(
    React.useCallback(() => {
      if (clientParam?.id) {
        loadClientDetails();
      }
    }, [clientParam?.id])
  );

  const loadClientDetails = async () => {
    if (!clientParam?.id) return;

    try {
      setLoading(true);
      const response = await apiService.get(`/caregivers/clients/${clientParam.id}`);
      
      if (response && response.success && response.data) {
        console.log('📥 ClientDetailsScreen - Dados do cliente recebidos:', {
          id: response.data.id,
          name: response.data.name,
          photo_url: response.data.photo_url,
          photo: response.data.photo,
          gender: response.data.gender,
          group_id: response.data.group_id
        });
        setClient(response.data);
        setPhotoError(false); // Resetar erro ao carregar novo cliente
        setReviews(response.data.reviews || []);
        
        let groupId = response.data.group_id;
        
        // Se for médico, buscar documentos diretamente do paciente (independente do grupo)
        if (user?.profile === 'doctor') {
          console.log('🔍 ClientDetailsScreen - Médico acessando paciente, buscando documentos diretamente...');
          // Buscar documentos do paciente usando patient_id
          loadDocumentsForDoctor(clientParam.id);
        } else {
          // Para outros perfis, usar lógica normal (por grupo)
          if (groupId) {
            loadDocuments(groupId);
          }
        }
        
        // Carregar plano do usuário para verificar se arquivos está habilitado
        loadUserPlan();
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do cliente:', error);
      if (clientParam) {
        setClient(clientParam);
      }
    } finally {
      setLoading(false);
    }
  };

  const findGroupIdFromAppointments = async (patientId) => {
    try {
      console.log('🔍 ClientDetailsScreen - Buscando group_id para paciente:', patientId);
      
      // Buscar consultas do médico atual com este paciente
      const result = await appointmentService.getAppointments();
      
      if (result.success && result.data) {
        console.log('📋 ClientDetailsScreen - Total de consultas encontradas:', result.data.length);
        
        // Filtrar consultas do médico atual
        const currentDoctorId = Number(user?.id);
        const doctorAppointments = result.data.filter((appointment) => {
          const appointmentDoctorId = appointment.doctor_id ? Number(appointment.doctor_id) : null;
          const doctorUserId = appointment.doctorUser?.id ? Number(appointment.doctorUser.id) : null;
          const doctorId = appointment.doctor?.id ? Number(appointment.doctor.id) : null;
          
          return appointmentDoctorId === currentDoctorId ||
                 doctorUserId === currentDoctorId ||
                 doctorId === currentDoctorId;
        });

        console.log('👨‍⚕️ ClientDetailsScreen - Consultas do médico:', doctorAppointments.length);

        // Buscar consulta que tenha group_id e onde o paciente seja membro
        for (const appointment of doctorAppointments) {
          if (appointment.group_id) {
            console.log('🔍 ClientDetailsScreen - Verificando grupo:', appointment.group_id);
            
            // Verificar se o paciente é membro deste grupo
            try {
              const groupMembersResult = await apiService.get(`/groups/${appointment.group_id}/members`);
              if (groupMembersResult && groupMembersResult.success && groupMembersResult.data) {
                console.log('👥 ClientDetailsScreen - Membros do grupo:', groupMembersResult.data.length);
                
                const patientMember = groupMembersResult.data.find(
                  member => {
                    const memberUserId = member.user_id || member.user?.id;
                    const isPatient = member.role === 'patient' || member.role === 'Patient';
                    const matchesId = Number(memberUserId) === Number(patientId);
                    
                    console.log('🔍 Verificando membro:', {
                      memberUserId,
                      patientId: Number(patientId),
                      role: member.role,
                      isPatient,
                      matchesId
                    });
                    
                    return isPatient && matchesId;
                  }
                );
                
                if (patientMember) {
                  console.log('✅ ClientDetailsScreen - group_id encontrado através das consultas:', appointment.group_id);
                  return appointment.group_id;
                } else {
                  console.log('⚠️ ClientDetailsScreen - Paciente não encontrado como membro do grupo:', appointment.group_id);
                }
              }
            } catch (err) {
              console.log('⚠️ ClientDetailsScreen - Erro ao verificar membros do grupo:', err);
            }
          } else {
            console.log('⚠️ ClientDetailsScreen - Consulta sem group_id:', appointment.id);
          }
        }
      } else {
        console.log('⚠️ ClientDetailsScreen - Nenhuma consulta encontrada');
      }
      
      return null;
    } catch (error) {
      console.error('❌ ClientDetailsScreen - Erro ao buscar group_id através das consultas:', error);
      return null;
    }
  };

  const loadDocuments = async (groupId) => {
    try {
      setLoadingDocuments(true);
      console.log('📂 ClientDetailsScreen - Carregando documentos do grupo:', groupId);
      
      if (!groupId) {
        console.log('⚠️ ClientDetailsScreen - groupId não disponível para buscar documentos');
        setDocuments([]);
        return;
      }

      const docs = await documentService.getDocumentsByGroup(groupId);
      
      // Ordenar por data (mais recentes primeiro) e manter todos para contagem correta
      const sortedDocs = docs.sort((a, b) => new Date(b.document_date || b.date) - new Date(a.document_date || a.date));
      
      setDocuments(sortedDocs);
      console.log('✅ ClientDetailsScreen - Documentos carregados:', sortedDocs.length);
    } catch (error) {
      console.error('❌ ClientDetailsScreen - Erro ao carregar documentos:', error);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadDocumentsForDoctor = async (patientId) => {
    try {
      setLoadingDocuments(true);
      console.log('📂 ClientDetailsScreen - Carregando documentos do paciente para médico:', patientId);
      
      // Buscar documentos diretamente do paciente usando patient_id
      const docs = await documentService.getDocumentsByPatient(patientId);
      console.log('✅ ClientDetailsScreen - Documentos do paciente carregados:', docs.length);
      
      // Ordenar por data (mais recentes primeiro) e manter todos para contagem correta
      const sortedDocs = docs.sort((a, b) => new Date(b.document_date || b.date) - new Date(a.document_date || a.date));
      
      setDocuments(sortedDocs);
      console.log('✅ ClientDetailsScreen - Documentos do paciente exibidos:', sortedDocs.length);
    } catch (error) {
      console.error('❌ ClientDetailsScreen - Erro ao carregar documentos do paciente:', error);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadUserPlan = async () => {
    try {
      const plan = await planService.getUserPlan();
      setUserPlan(plan);
    } catch (error) {
      console.error('❌ ClientDetailsScreen - Erro ao carregar plano:', error);
    }
  };

  const getDocumentIcon = (type) => {
    const iconMap = {
      exam_lab: 'flask',
      exam_image: 'image',
      prescription: 'document-text',
      medical_leave: 'calendar',
      medical_certificate: 'calendar',
      report: 'document',
      other: 'document-attach',
    };
    return iconMap[type] || 'document';
  };

  const getDocumentIconComponent = (type) => {
    // Usar Ionicons diretamente para garantir que os ícones apareçam
    const iconMap = {
      prescription: 'receipt',
      medical_leave: 'calendar',
      medical_certificate: 'calendar',
      report: 'document-text',
      exam_lab: 'flask',
      exam_image: 'image',
      other: 'document',
    };
    return iconMap[type] || 'document';
  };

  const getDocumentColor = (type) => {
    const colorMap = {
      exam_lab: colors.info,
      exam_image: colors.success,
      prescription: '#FFB6C1', // Rosa pastel para receitas
      medical_leave: '#B0E0E6', // Azul pastel para afastamentos
      medical_certificate: '#B0E0E6', // Azul pastel para afastamentos
      report: colors.warning,
      other: colors.gray600,
    };
    return colorMap[type] || colors.gray600;
  };

  const formatDocumentDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isFilesFeatureEnabled = () => {
    // Se não tem plano ainda, mostrar (enquanto carrega)
    if (!userPlan) {
      console.log('📋 ClientDetailsScreen - userPlan não carregado ainda, mostrando card');
      return true;
    }
    const enabled = planService.isFeatureEnabled(userPlan, 'arquivos');
    console.log('📋 ClientDetailsScreen - Feature arquivos habilitada?', enabled, 'userPlan:', userPlan);
    return enabled;
  };

  const handleAddReview = () => {
    setShowReviewModal(true);
    setReviewRating(0);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert('Atenção', 'Por favor, selecione uma avaliação (estrelas)');
      return;
    }

    if (reviewComment.trim().length < 10) {
      Alert.alert('Atenção', 'O comentário deve ter pelo menos 10 caracteres');
      return;
    }

    if (reviewComment.trim().length > 500) {
      Alert.alert('Atenção', 'O comentário deve ter no máximo 500 caracteres');
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await apiService.request(`/caregivers/clients/${client.id}/reviews`, {
        method: 'POST',
        body: {
          rating: reviewRating,
          comment: reviewComment.trim(),
        },
      });

      if (response && response.success) {
        Toast.show({
          type: 'success',
          text1: 'Avaliação enviada!',
          text2: 'Sua avaliação foi publicada com sucesso',
        });

        await loadClientDetails();
        
        setShowReviewModal(false);
        setReviewRating(0);
        setReviewComment('');
      } else {
        throw new Error(response?.message || 'Erro ao enviar avaliação');
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível enviar a avaliação. Tente novamente.'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={20} color={colors.warning} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={20} color={colors.warning} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={20} color={colors.gray400} />
      );
    }

    return stars;
  };

  const renderStarSelector = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setReviewRating(i)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={i <= reviewRating ? "star" : "star-outline"}
            size={40}
            color={i <= reviewRating ? colors.warning : colors.gray400}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  if (!client) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Cliente não encontrado</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
          {user?.profile === 'doctor' ? 'Detalhes do Paciente' : 'Detalhes do Cliente'}
        </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const clientDetails = {
    ...client,
    reviews: reviews,
    rating: client?.rating || 0,
    reviews_count: client?.reviews_count || reviews.length,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text || '#1e293b'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {user?.profile === 'doctor' ? 'Detalhes do Paciente' : 'Detalhes do Cliente'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Principal */}
        <View style={styles.mainCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {(() => {
                const photoUrl = client.photo_url || client.photo;
                
                // Se não há foto ou houve erro, mostrar ícone baseado no gênero
                if (!photoUrl || photoError) {
                  const gender = client.gender || client.user?.gender;
                  if (gender === 'male' || gender === 'Masculino') {
                    return <Ionicons name="male" size={48} color={colors.primary} />;
                  } else if (gender === 'female' || gender === 'Feminino') {
                    return <Ionicons name="female" size={48} color={colors.primary} />;
                  }
                  return <Ionicons name="person" size={48} color={colors.primary} />;
                }
                
                // Construir URL da foto
                let imageUri = photoUrl;
                if (!photoUrl.startsWith('http://') && !photoUrl.startsWith('https://')) {
                  const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
                  imageUri = photoUrl.startsWith('/') 
                    ? `${baseUrl}${photoUrl}` 
                    : `${baseUrl}/${photoUrl}`;
                }
                
                console.log('📸 ClientDetailsScreen - Tentando carregar foto:', imageUri);
                console.log('📸 ClientDetailsScreen - photo_url:', client.photo_url);
                console.log('📸 ClientDetailsScreen - photo:', client.photo);
                
                return (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.avatarImage}
                    onError={(error) => {
                      console.log('❌ ClientDetailsScreen - Erro ao carregar foto:', error);
                      console.log('❌ ClientDetailsScreen - URI tentada:', imageUri);
                      setPhotoError(true);
                    }}
                    onLoadStart={() => {
                      setPhotoError(false);
                      console.log('📸 ClientDetailsScreen - Iniciando carregamento da foto');
                    }}
                    onLoad={() => {
                      console.log('✅ ClientDetailsScreen - Foto carregada com sucesso');
                      setPhotoError(false);
                    }}
                    resizeMode="cover"
                  />
                );
              })()}
            </View>
          </View>
          
          <Text style={styles.name}>{client.name}</Text>
          
          {client.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={colors.textLight} />
              <Text style={styles.locationText}>
                {client.neighborhood || ''}, {client.city}
              </Text>
            </View>
          )}

          {clientDetails.reviews_count > 0 && (
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {renderStars(clientDetails.rating)}
              </View>
              <Text style={styles.ratingText}>{(clientDetails.rating || 0).toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({clientDetails.reviews_count || 0} avaliações)</Text>
            </View>
          )}
        </View>

        {/* Informações de Contato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações de Contato</Text>
          <View style={styles.infoCard}>
            {client.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Telefone</Text>
                  <Text style={styles.infoValue}>{client.phone}</Text>
                </View>
              </View>
            )}
            {client.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>E-mail</Text>
                  <Text style={styles.infoValue}>{client.email}</Text>
                </View>
              </View>
            )}
            {client.group_name && (
              <View style={styles.infoRow}>
                <Ionicons name="people" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Grupo</Text>
                  <Text style={styles.infoValue}>{client.group_name}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Card de Arquivos - ANTES das avaliações */}
        {/* Para médicos: sempre mostrar. Para outros: verificar plano e group_id */}
        {(() => {
          const isDoctor = user?.profile === 'doctor';
          const shouldShow = isDoctor || (isFilesFeatureEnabled() && !!client?.group_id);
          
          console.log('📋 ClientDetailsScreen - Card Arquivos:', {
            isDoctor,
            userProfile: user?.profile,
            shouldShow,
            hasGroupId: !!client?.group_id,
            groupId: client?.group_id
          });
          
          return shouldShow;
        })() && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.filesCard}
              onPress={async () => {
                // Para médicos, navegar para documentos do paciente usando patient_id
                if (user?.profile === 'doctor' && client.id) {
                  navigation.navigate('Documents', {
                    patientId: client.id,
                    patientName: client.name || 'Paciente',
                  });
                } else if (client.group_id) {
                  // Para outros perfis, usar lógica normal (por grupo)
                  navigation.navigate('Documents', {
                    groupId: client.group_id,
                    groupName: client.group_name || 'Grupo',
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.filesCardHeader, documents.length > 0 && { marginBottom: 16 }]}>
                <View style={styles.filesIconContainer}>
                  <SafeIcon name="folder" size={32} color="#9C27B0" />
                </View>
                <View style={styles.filesContent}>
                  <Text style={styles.filesCardTitle}>Arquivos</Text>
                  <Text style={styles.filesCardSubtitle}>Exames, receitas e laudos</Text>
                </View>
                {client.group_id && (
                  <SafeIcon name="chevron-forward" size={24} color={colors.gray400} />
                )}
              </View>

              {/* Preview de documentos dentro do card */}
              {loadingDocuments ? (
                <View style={styles.filesLoading} pointerEvents="none">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.filesLoadingText}>Carregando arquivos...</Text>
                </View>
              ) : documents.length === 0 ? (
                <View style={styles.filesEmpty} pointerEvents="none">
                  <SafeIcon name="folder" size={32} color={colors.gray300} />
                  <Text style={styles.filesEmptyText}>Nenhum arquivo disponível</Text>
                </View>
              ) : (
                <View style={styles.filesList} pointerEvents="box-none">
                  {documents.slice(0, 3).map((doc, index) => (
                    <TouchableOpacity
                      key={doc.id || index}
                      style={styles.fileItem}
                      onPress={() => {
                        navigation.navigate('DocumentDetails', {
                          document: doc,
                          groupId: client.group_id,
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.fileIcon, { backgroundColor: getDocumentColor(doc.type) + '20' }]}>
                        <SafeIcon 
                          name={getDocumentIconComponent(doc.type)} 
                          size={20} 
                          color={getDocumentColor(doc.type)} 
                        />
                      </View>
                      <View style={styles.fileContent}>
                        <Text style={styles.fileTitle} numberOfLines={1}>
                          {doc.title || 'Documento sem título'}
                        </Text>
                        <Text style={styles.fileMeta}>
                          {formatDocumentDate(doc.document_date || doc.date)}
                          {doc.doctor_name && ` • ${doc.doctor_name}`}
                        </Text>
                      </View>
                      <View style={{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
                      </View>
                    </TouchableOpacity>
                  ))}
                  {documents.length > 3 && (
                    <View style={styles.moreFilesIndicator} pointerEvents="none">
                      <Text style={styles.moreFilesText}>
                        +{documents.length - 3} {documents.length - 3 === 1 ? 'arquivo' : 'arquivos'}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Avaliações */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Avaliações</Text>
              <Text style={styles.reviewsCount}>
                {clientDetails.reviews_count || 0} avaliações
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addReviewButton}
              onPress={handleAddReview}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color="#C8A8E9" />
              <Text style={styles.addReviewButtonText}>Avaliar</Text>
            </TouchableOpacity>
          </View>
          
          {clientDetails.reviews && clientDetails.reviews.length > 0 ? (
            clientDetails.reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAuthorInfo}>
                    <View style={styles.reviewAvatar}>
                      <Ionicons name="person" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.reviewAuthorDetails}>
                      <Text style={styles.reviewAuthorName}>{user?.name || 'Cuidador Profissional'}</Text>
                      <Text style={styles.reviewAuthorRole}>
                        {review.group && review.group.name ? `Grupo: ${review.group.name}` : 'Cuidador Profissional'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reviewRating}>
                    {renderStars(review.rating)}
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <Text style={styles.reviewDate}>
                  {review.created_at ? new Date(review.created_at).toLocaleDateString('pt-BR') : ''}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhuma avaliação ainda</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Avaliação */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avaliar Cliente</Text>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBodyScroll}
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalLabel}>Avaliação</Text>
              <View style={styles.starSelectorContainer}>
                {renderStarSelector()}
              </View>
              {reviewRating > 0 && (
                <Text style={styles.ratingText}>
                  {reviewRating} {reviewRating === 1 ? 'estrela' : 'estrelas'}
                </Text>
              )}

              <Text style={[styles.modalLabel, { marginTop: 24 }]}>Comentário</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Descreva sua experiência com este cliente..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={6}
                value={reviewComment}
                onChangeText={setReviewComment}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {reviewComment.length}/500 caracteres
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowReviewModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (reviewRating === 0 || reviewComment.trim().length < 10 || submittingReview) &&
                  styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitReview}
                disabled={reviewRating === 0 || reviewComment.trim().length < 10 || submittingReview}
                activeOpacity={0.7}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#2D1B3D" />
                ) : (
                  <Text style={styles.submitButtonText}>Enviar Avaliação</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'hidden',
    ...(Platform.OS === 'android' ? {
      elevation: 0,
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: colors.textLight,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  ratingCount: {
    fontSize: 14,
    color: colors.textLight,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  filesCard: {
    backgroundColor: colors.backgroundLight,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filesCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filesIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#9C27B020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  filesContent: {
    flex: 1,
  },
  filesCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  filesCardSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewsCount: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '600',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#C8A8E9' + '20',
  },
  addReviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8A8E9',
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'hidden',
    ...(Platform.OS === 'android' ? {
      elevation: 0,
    } : {}),
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAuthorDetails: {
    flex: 1,
  },
  reviewAuthorName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  reviewAuthorRole: {
    fontSize: 13,
    color: colors.textLight,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyState: {
    backgroundColor: colors.backgroundLight,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  filesLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  filesLoadingText: {
    fontSize: 14,
    color: colors.textLight,
  },
  filesEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  filesEmptyText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
  },
  filesList: {
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 0, // Remover bordas grossas
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileContent: {
    flex: 1,
  },
  fileTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 12,
    color: colors.textLight,
  },
  moreFilesIndicator: {
    paddingTop: 8,
    alignItems: 'center',
  },
  moreFilesText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBodyScroll: {
    flex: 1,
  },
  modalBody: {
    padding: 20,
    paddingBottom: 10,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  starSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  commentInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.text,
    minHeight: 120,
    maxHeight: 200,
  },
  charCount: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#C8A8E9',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray300,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B3D',
  },
});

export default ClientDetailsScreen;

