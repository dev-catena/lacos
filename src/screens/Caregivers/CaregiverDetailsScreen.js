import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SafeIcon from '../../components/SafeIcon';
import colors from '../../constants/colors';
import Toast from 'react-native-toast-message';
import apiService from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const CaregiverDetailsScreen = ({ route, navigation }) => {
  const { caregiver: caregiverParam } = route.params || {};
  const { user } = useAuth();
  const [caregiver, setCaregiver] = useState(caregiverParam);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState([]);

  // Carregar detalhes completos do cuidador ao abrir a tela
  useFocusEffect(
    React.useCallback(() => {
      if (caregiverParam?.id) {
        loadCaregiverDetails();
      }
    }, [caregiverParam?.id])
  );

  const loadCaregiverDetails = async () => {
    if (!caregiverParam?.id) return;

    try {
      setLoading(true);
      const response = await apiService.get(`/caregivers/${caregiverParam.id}`);
      
      console.log('📥 Resposta da API de detalhes:', response);
      
      if (response && response.success && response.data) {
        console.log('✅ Dados do cuidador:', {
          id: response.data.id,
          name: response.data.name,
          formation: response.data.formation,
          formation_details: response.data.formation_details,
          courses: response.data.courses?.length || 0,
          reviews: response.data.reviews?.length || 0,
        });
        
        setCaregiver(response.data);
        setReviews(response.data.reviews || []);
      } else {
        console.warn('⚠️ Resposta da API não contém dados esperados:', response);
        // Se falhar, usar dados do parâmetro
        if (caregiverParam) {
          setCaregiver(caregiverParam);
        }
      }
    } catch (error) {
      const is404 = error?.status === 404 || error?._rawErrorData?.status === 404;
      if (is404) {
        // Cuidador não encontrado (ex: perfil alterado para cuidador amigo) - não usar fallback
        setCaregiver(null);
      } else {
        // Erro de rede: usar dados do parâmetro como fallback
        if (caregiverParam) {
          setCaregiver(caregiverParam);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!caregiver) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <SafeIcon name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>Cuidador não encontrado</Text>
          <Text style={styles.errorSubtext}>
            Este cuidador não está mais disponível na lista de profissionais.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <SafeIcon key={i} name="star" size={20} color={colors.warning} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <SafeIcon key="half" name="star-half" size={20} color={colors.warning} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <SafeIcon key={`empty-${i}`} name="star-outline" size={20} color={colors.gray400} />
      );
    }

    return stars;
  };

  const handleContact = () => {
    navigation.navigate('CaregiverChat', {
      caregiverId: caregiver.id,
      caregiverName: caregiver.name,
      caregiver: caregiver, // Passar objeto completo para ter acesso à foto
    });
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
      const response = await apiService.request(`/caregivers/${caregiver.id}/reviews`, {
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

        // Adicionar nova avaliação à lista
        const newReview = {
          id: Date.now(),
          author: user?.name || 'Você',
          role: user?.profile === 'caregiver' ? 'Amigo/Cuidador' : 'Admin',
          group: 'Meu Grupo',
          rating: reviewRating,
          comment: reviewComment.trim(),
          date: new Date().toISOString(),
        };

        // Recarregar detalhes do cuidador para atualizar avaliações
        await loadCaregiverDetails();
        
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

  const renderStarSelector = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setReviewRating(i)}
          activeOpacity={0.7}
        >
          <SafeIcon
            name={i <= reviewRating ? 'star' : 'star-outline'}
            size={40}
            color={i <= reviewRating ? colors.warning : colors.gray400}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  // Se ainda estiver carregando, mostrar loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <SafeIcon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Cuidador</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Formatar sexo para exibição (male/feminino -> Masculino/Feminino)
  const formatGenderDisplay = (val) => {
    if (!val) return null;
    const g = String(val).toLowerCase();
    if (g === 'male' || g === 'masculino' || g === 'm') return 'Masculino';
    if (g === 'female' || g === 'feminino' || g === 'f') return 'Feminino';
    if (g === 'other' || g === 'outro') return 'Outro';
    return val;
  };

  // Sexo: priorizar API; se vazio e for o próprio perfil, usar dados do contexto
  const isOwnProfile = user?.id === caregiver?.id;
  const genderDisplay = caregiver?.gender
    ? formatGenderDisplay(caregiver.gender)
    : (isOwnProfile && user?.gender ? formatGenderDisplay(user.gender) : null);

  // Usar dados da API ou dados do parâmetro como fallback
  const caregiverDetails = {
    ...caregiver,
    courses: caregiver?.courses || [],
    reviews: reviews,
    rating: caregiver?.rating || 0,
    reviews_count: caregiver?.reviews_count || reviews.length,
    formation_details: caregiver?.formation_details || caregiver?.formation || 'Não informado',
    gender: genderDisplay || caregiver?.gender,
  };
  
  console.log('🔍 caregiverDetails:', {
    formation_details: caregiverDetails.formation_details,
    courses_count: caregiverDetails.courses?.length || 0,
    courses: caregiverDetails.courses,
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Cuidador</Text>
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
              {caregiver.photo_url || caregiver.photo || caregiverDetails?.photo_url || caregiverDetails?.photo ? (
                <Image
                  source={{ uri: caregiver.photo_url || caregiver.photo || caregiverDetails?.photo_url || caregiverDetails?.photo }}
                  style={styles.avatarImage}
                />
              ) : (
                <SafeIcon
                  name={genderDisplay === 'Feminino' ? 'person' : 'person-outline'}
                  size={48}
                  color={colors.primary}
                />
              )}
            </View>
          </View>
          
          <Text style={styles.name}>{caregiver.name}</Text>
          
          <View style={styles.locationRow}>
            <SafeIcon name="location-outline" size={16} color={colors.textLight} />
            <Text style={styles.locationText}>
              {caregiver.neighborhood}, {caregiver.city}
            </Text>
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(caregiver.rating)}
            </View>
            <Text style={styles.ratingText}>{(caregiverDetails.rating || 0).toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({caregiverDetails.reviews_count || 0} avaliações)</Text>
          </View>
        </View>

        {/* Informações Básicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <SafeIcon name="medical-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Formação</Text>
                <Text style={styles.infoValue}>{caregiver?.formation || caregiver?.formation_details || 'Não informado'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <SafeIcon name="cash-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Valor/Hora</Text>
                <Text style={styles.infoValue}>R$ {Number(caregiver?.hourly_rate || caregiver?.hourlyRate || 0).toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <SafeIcon name="time-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Disponibilidade</Text>
                <Text style={styles.infoValue}>{caregiver?.availability || 'Não informado'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <SafeIcon name="person-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Sexo</Text>
                <Text style={styles.infoValue}>{genderDisplay || 'Não informado'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detalhes de Formação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes de formação</Text>
          <View style={styles.formationCard}>
            <Text style={styles.formationText}>
              {caregiver?.formation_description || caregiver?.formation_details || 'Não informado'}
            </Text>
          </View>
        </View>

        {/* Cursos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cursos e Certificações</Text>
          {caregiverDetails.courses && caregiverDetails.courses.length > 0 ? (
            caregiverDetails.courses.map((course) => (
              <View key={course.id} style={styles.courseCard}>
                <View style={styles.courseIcon}>
                  <SafeIcon name="school-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.courseContent}>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <Text style={styles.courseInstitution}>{course.institution}</Text>
                  <Text style={styles.courseYear}>{course.year}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhum curso cadastrado</Text>
            </View>
          )}
        </View>

        {/* Avaliações e Comentários */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Avaliações</Text>
            <View style={styles.sectionHeaderRight}>
              <Text style={styles.reviewsCount}>
                {caregiverDetails.reviews.length} avaliação(ões)
              </Text>
              {caregiver?.can_review && (
                <TouchableOpacity
                  style={styles.addReviewButton}
                  onPress={handleAddReview}
                  activeOpacity={0.7}
                >
                  <SafeIcon name="add-circle-outline" size={20} color="#C8A8E9" />
                  <Text style={styles.addReviewButtonText}>Avaliar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {caregiverDetails.reviews && caregiverDetails.reviews.length > 0 ? (
            caregiverDetails.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAuthorInfo}>
                  <View style={styles.reviewAvatar}>
                    <SafeIcon name="person" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.reviewAuthorDetails}>
                    <Text style={styles.reviewAuthorName}>{review.author}</Text>
                    <Text style={styles.reviewAuthorRole}>
                      {review.role}{review.group ? ` • ${review.group}` : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.reviewRating}>
                  {renderStars(review.rating)}
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>
                {review.date ? new Date(review.date).toLocaleDateString('pt-BR') : ''}
              </Text>
            </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhuma avaliação ainda</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
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
              <Text style={styles.modalTitle}>Avaliar Cuidador</Text>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                activeOpacity={0.7}
              >
                <SafeIcon name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBodyScroll}
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalLabel}>Sua avaliação</Text>
              <View style={styles.starSelectorContainer}>
                {renderStarSelector()}
              </View>
              {reviewRating > 0 && (
                <Text style={styles.ratingText}>
                  {reviewRating === 1 && 'Péssimo'}
                  {reviewRating === 2 && 'Ruim'}
                  {reviewRating === 3 && 'Regular'}
                  {reviewRating === 4 && 'Bom'}
                  {reviewRating === 5 && 'Excelente'}
                </Text>
              )}

              <Text style={[styles.modalLabel, { marginTop: 24 }]}>Comentário</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Descreva sua experiência com este cuidador..."
                placeholderTextColor={colors.textLight}
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                numberOfLines={6}
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

      {/* Botão Flutuante de Contato */}
      <TouchableOpacity
        style={styles.contactButton}
        onPress={handleContact}
        activeOpacity={0.8}
      >
        <SafeIcon name="chatbubble-ellipses" size={24} color="#2D1B3D" />
        <Text style={styles.contactButtonText}>Contatar Cuidador</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
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
    paddingBottom: 20,
  },
  mainCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: Platform.OS === 'android' ? 0 : 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    gap: 6,
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
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#C8A8E9' + '20',
  },
  addReviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8A8E9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  reviewsCount: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 16,
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
  formationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
  },
  formationText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseContent: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  courseInstitution: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 2,
  },
  courseYear: {
    fontSize: 13,
    color: colors.textLight,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  contactButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C8A8E9', // Roxo pastel suave
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B3D', // Texto escuro para contraste com roxo pastel
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Transparência padrão
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF', // Fundo branco sólido explícito
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
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: '#C8A8E9', // Roxo pastel
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray300,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B3D', // Texto escuro para contraste
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
});

export default CaregiverDetailsScreen;

