import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import appointmentService from '../../services/appointmentService';
import { MedicalIcon, CalendarIcon } from '../../components/CustomIcons';

const AppointmentDetailsScreen = ({ route, navigation }) => {
  const { appointmentId, appointment: initialAppointment, groupId } = route.params || {};
  const [appointment, setAppointment] = useState(initialAppointment);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (appointmentId) {
        loadAppointment();
      } else if (initialAppointment) {
        setAppointment(initialAppointment);
      }
    }, [appointmentId])
  );

  const loadAppointment = async () => {
    if (!appointmentId) return;

    try {
      setLoading(true);
      const result = await appointmentService.getAppointment(appointmentId);
      
      if (result.success) {
        setAppointment(result.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'Não foi possível carregar os detalhes do compromisso',
          position: 'bottom',
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erro ao carregar compromisso:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar os detalhes do compromisso',
        position: 'bottom',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Não informado';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Não informado';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Não informado';
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type) => {
    const labels = {
      common: 'Compromisso',
      medical: 'Consulta Médica',
      fisioterapia: 'Fisioterapia',
      exames: 'Exames',
    };
    return labels[type] || 'Compromisso';
  };

  const getRecurrenceLabel = (recurrenceType) => {
    const labels = {
      none: 'Não se repete',
      daily: 'Diariamente',
      weekdays: 'Segunda a Sexta',
      custom: 'Personalizado',
    };
    return labels[recurrenceType] || 'Não se repete';
  };

  const handleEdit = () => {
    if (!appointment) return;
    
    const appointmentIdToEdit = appointment.isRecurringInstance 
      ? appointment.originalAppointmentId 
      : appointment.id;
    
    navigation.navigate('AddAppointment', {
      groupId,
      appointmentId: appointmentIdToEdit,
      appointment: appointment,
    });
  };

  const handleDelete = () => {
    if (!appointment) return;

    // Verificar se está excluindo com menos de 1 hora de antecedência
    const appointmentDate = new Date(appointment.appointment_date || appointment.scheduled_at);
    const now = new Date();
    const timeDifference = appointmentDate.getTime() - now.getTime();
    const oneHourInMs = 60 * 60 * 1000; // 1 hora em milissegundos
    const isLessThanOneHour = timeDifference > 0 && timeDifference < oneHourInMs;
    
    // Verificar se a consulta foi paga
    const paymentStatus = appointment.payment_status || appointment.paymentStatus;
    const isPaid = paymentStatus === 'paid_held' || 
                   paymentStatus === 'paid' || 
                   paymentStatus === 'released';
    const isTeleconsultation = appointment.is_teleconsultation || appointment.isTeleconsultation || false;
    
    // Se for consulta médica (type === 'medical'), também considerar como possível teleconsulta
    const isMedicalAppointment = appointment.type === 'medical';
    
    // Log para debug
    console.log('🔍 AppointmentDetailsScreen - handleDelete:', {
      appointmentId: appointment.id,
      appointmentDate: appointmentDate.toISOString(),
      now: now.toISOString(),
      timeDifferenceMs: timeDifference,
      timeDifferenceMinutes: Math.floor(timeDifference / (60 * 1000)),
      isLessThanOneHour,
      paymentStatus,
      isPaid,
      isTeleconsultation,
    });

    const isRecurringInstance = appointment.isRecurringInstance;
    const hasRecurrence = appointment.recurrence_type && appointment.recurrence_type !== 'none';
    
    // Montar mensagem de aviso sobre não reembolso se aplicável
    // IMPORTANTE: Para teleconsultas ou consultas médicas pagas, sempre avisar se for menos de 1 hora
    let refundWarning = '';
    if (isLessThanOneHour) {
      if (isTeleconsultation || (isMedicalAppointment && isPaid)) {
        // Teleconsulta ou consulta médica paga: sempre avisar sobre não reembolso
        refundWarning = '\n\n⚠️ ATENÇÃO: A exclusão está sendo feita com menos de 1 hora de antecedência.';
        if (isTeleconsultation) {
          refundWarning += '\n\n💰 IMPORTANTE: Como esta é uma teleconsulta excluída em cima da hora, o valor pago NÃO será reembolsado.';
        } else {
          refundWarning += '\n\n💰 IMPORTANTE: O valor pago NÃO será reembolsado devido ao cancelamento em cima da hora.';
        }
      } else if (isPaid) {
        // Consulta paga (não teleconsulta): avisar sobre não reembolso
        refundWarning = '\n\n⚠️ ATENÇÃO: A exclusão está sendo feita com menos de 1 hora de antecedência.';
        refundWarning += '\n\n💰 O valor pago NÃO será reembolsado.';
      }
    }
    
    // Se for uma instância de recorrência, perguntar se quer excluir só este dia ou todos
    if (isRecurringInstance || hasRecurrence) {
      Alert.alert(
        'Excluir Compromisso',
        'Este é um compromisso recorrente. O que deseja fazer?' + refundWarning,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Excluir apenas este dia',
            onPress: async () => {
              await deleteSingleDate();
            },
          },
          {
            text: 'Excluir todos os dias',
            style: 'destructive',
            onPress: async () => {
              await deleteAllRecurrences();
            },
          },
        ]
      );
    } else {
      // Compromisso único, excluir normalmente
      Alert.alert(
        'Excluir Compromisso',
        'Tem certeza que deseja excluir este compromisso? Esta ação não pode ser desfeita.' + refundWarning,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              await deleteAllRecurrences();
            },
          },
        ]
      );
    }
  };

  const deleteSingleDate = async () => {
    if (!appointment) return;

    try {
      setDeleting(true);
      
      // Se for uma instância recorrente, usar o ID original e a data da instância
      const appointmentIdToDelete = appointment.isRecurringInstance 
        ? appointment.originalAppointmentId 
        : appointment.id;
      
      const instanceDate = appointment.instanceDate || 
        (appointment.appointment_date ? appointment.appointment_date.split('T')[0] : null);
      
      if (!instanceDate) {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'Não foi possível identificar a data do compromisso',
          position: 'bottom',
        });
        return;
      }
      
      const result = await appointmentService.deleteAppointment(appointmentIdToDelete, instanceDate);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Data excluída',
          text2: 'Este dia foi removido da recorrência',
          position: 'bottom',
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: result.error || 'Não foi possível excluir o compromisso',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Erro ao excluir compromisso:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível excluir o compromisso',
        position: 'bottom',
      });
    } finally {
      setDeleting(false);
    }
  };

  const deleteAllRecurrences = async () => {
    if (!appointment) return;

    try {
      setDeleting(true);
      
      // Se for uma instância recorrente, usar o ID original
      const appointmentIdToDelete = appointment.isRecurringInstance 
        ? appointment.originalAppointmentId 
        : appointment.id;
      
      const result = await appointmentService.deleteAppointment(appointmentIdToDelete);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Compromisso excluído',
          text2: 'O compromisso foi removido com sucesso',
          position: 'bottom',
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: result.error || 'Não foi possível excluir o compromisso',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Erro ao excluir compromisso:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível excluir o compromisso',
        position: 'bottom',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Teleconsulta: confirmar que foi realizada (paciente/cuidador)
  const handleOpenConfirmModal = () => {
    setReviewRating(0);
    setReviewComment('');
    setShowConfirmModal(true);
  };

  const handleConfirmConsultation = async (withReview = false) => {
    if (!appointment) return;

    setConfirming(true);
    try {
      const options = {};
      if (withReview && reviewRating >= 1) {
        options.rating = reviewRating;
        if (reviewComment.trim()) options.comment = reviewComment.trim();
      }

      const result = await appointmentService.confirmAppointment(appointment.id, options);

      if (result.success) {
        setShowConfirmModal(false);
        setReviewRating(0);
        setReviewComment('');
        Toast.show({
          type: 'success',
          text1: 'Consulta confirmada',
          text2: 'O pagamento foi liberado para o médico',
          position: 'bottom',
        });
        await loadAppointment();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: result.error || 'Não foi possível confirmar',
          position: 'bottom',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível confirmar a consulta',
        position: 'bottom',
      });
    } finally {
      setConfirming(false);
    }
  };

  // Avaliar médico (após consulta já realizada)
  const handleOpenReviewModal = () => {
    setReviewRating(0);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!appointment || reviewRating < 1) {
      Toast.show({
        type: 'info',
        text1: 'Atenção',
        text2: 'Selecione uma avaliação (estrelas)',
        position: 'bottom',
      });
      return;
    }

    setSubmittingReview(true);
    try {
      const result = await appointmentService.createAppointmentReview(appointment.id, {
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      });

      if (result.success) {
        setShowReviewModal(false);
        setReviewRating(0);
        setReviewComment('');
        Toast.show({
          type: 'success',
          text1: 'Avaliação enviada',
          text2: 'Sua avaliação foi registrada',
          position: 'bottom',
        });
        await loadAppointment();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: result.error || 'Não foi possível enviar a avaliação',
          position: 'bottom',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível enviar a avaliação',
        position: 'bottom',
      });
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
          style={styles.starButton}
        >
          <Ionicons
            name={i <= reviewRating ? 'star' : 'star-outline'}
            size={36}
            color={i <= reviewRating ? colors.warning : colors.gray400}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>Compromisso não encontrado</Text>
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

  const isMedical = appointment.type === 'medical';
  const hasRecurrence = appointment.recurrence_type && appointment.recurrence_type !== 'none';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Compromisso</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleEdit}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tipo e Título */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <View style={styles.iconWrapper}>
              {isMedical ? (
                <MedicalIcon size={32} color={colors.secondary} />
              ) : (
                <CalendarIcon size={32} color={colors.primary} />
              )}
            </View>
          </View>
          <Text style={styles.typeLabel}>{getTypeLabel(appointment.type)}</Text>
          <Text style={styles.title}>{appointment.title || 'Sem título'}</Text>
          {appointment.description && (
            <Text style={styles.description}>{appointment.description}</Text>
          )}
        </View>

        {/* Data e Hora */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Data e Hora</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data:</Text>
            <Text style={styles.infoValue}>{formatDate(appointment.appointment_date || appointment.scheduled_at)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Horário:</Text>
            <Text style={styles.infoValue}>{formatTime(appointment.appointment_date || appointment.scheduled_at)}</Text>
          </View>

          {hasRecurrence && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Recorrência:</Text>
                <Text style={styles.infoValue}>{getRecurrenceLabel(appointment.recurrence_type)}</Text>
              </View>
              
              {appointment.recurrence_end && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Até:</Text>
                  <Text style={styles.infoValue}>{formatDate(appointment.recurrence_end)}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Médico */}
        {(appointment.doctorUser || appointment.doctor) && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconWrapper}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Médico</Text>
            </View>
            <Text style={styles.doctorName}>
              {appointment.doctorUser?.name || appointment.doctor?.name || appointment.doctor || 'Médico não informado'}
            </Text>
            {(appointment.doctorUser?.medicalSpecialty?.name || appointment.doctor?.specialty) && (
              <Text style={styles.doctorSpecialty}>
                {appointment.doctorUser?.medicalSpecialty?.name || appointment.doctor?.specialty}
              </Text>
            )}
          </View>
        )}

        {/* Localização */}
        {appointment.location && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconWrapper}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Localização</Text>
            </View>
            <Text style={styles.locationText}>{appointment.location}</Text>
          </View>
        )}

        {/* Observações */}
        {appointment.notes && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconWrapper}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Observações</Text>
            </View>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        )}

        {/* Teleconsulta: Confirmar realização (paciente/cuidador) */}
        {(appointment.is_teleconsultation || appointment.isTeleconsultation) && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconWrapper}>
                <Ionicons name="videocam-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Teleconsulta</Text>
            </View>
            {(appointment.payment_status === 'paid_held' || appointment.paymentStatus === 'paid_held') ? (
              <>
                <Text style={styles.teleconsultText}>
                  A consulta foi realizada? Ao confirmar, o pagamento será liberado para o médico.
                </Text>
                <TouchableOpacity
                  style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
                  onPress={handleOpenConfirmModal}
                  disabled={confirming}
                >
                  {confirming ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={22} color={colors.white} />
                      <Text style={styles.confirmButtonText}>Confirmar que a consulta foi realizada</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (appointment.status === 'completed' || appointment.payment_status === 'released' || appointment.paymentStatus === 'released') ? (
              <>
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.completedBadgeText}>Consulta realizada</Text>
                </View>
                {!appointment.has_user_review && (appointment.doctorUser || appointment.doctor) && (
                  <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={handleOpenReviewModal}
                  >
                    <Ionicons name="star-outline" size={20} color={colors.primary} />
                    <Text style={styles.reviewButtonText}>Avaliar o médico</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : null}
          </View>
        )}

        {/* Botão de Excluir */}
        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color={colors.textWhite} />
          ) : (
            <>
              <View style={styles.iconWrapper}>
                <Ionicons name="trash-outline" size={20} color={colors.textWhite} />
              </View>
              <Text style={styles.deleteButtonText}>Excluir Compromisso</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal: Confirmar consulta realizada (com avaliação opcional) */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => !confirming && setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Confirmar consulta realizada</Text>
            <Text style={styles.modalSubtitle}>
              A teleconsulta foi realizada? Ao confirmar, o pagamento será liberado para o médico.
            </Text>
            <Text style={styles.optionalReviewLabel}>Avaliar o médico (opcional)</Text>
            {renderStarSelector()}
            <TextInput
              style={styles.reviewCommentInput}
              placeholder="Comentário (opcional)"
              placeholderTextColor={colors.placeholder}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              maxLength={500}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => !confirming && setShowConfirmModal(false)}
                disabled={confirming}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, confirming && styles.confirmButtonDisabled]}
                onPress={() => handleConfirmConsultation(reviewRating >= 1)}
                disabled={confirming}
              >
                {confirming ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal: Avaliar médico (após consulta já realizada) */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => !submittingReview && setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Avaliar o médico</Text>
            <Text style={styles.modalSubtitle}>
              Como foi sua experiência com a teleconsulta?
            </Text>
            {renderStarSelector()}
            <TextInput
              style={styles.reviewCommentInput}
              placeholder="Comentário (opcional)"
              placeholderTextColor={colors.placeholder}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              maxLength={500}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => !submittingReview && setShowReviewModal(false)}
                disabled={submittingReview}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, submittingReview && styles.confirmButtonDisabled]}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textLight,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: colors.textLight,
  },
  locationText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
  teleconsultText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  completedBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    gap: 8,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  optionalReviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  reviewCommentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.gray200,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default AppointmentDetailsScreen;

