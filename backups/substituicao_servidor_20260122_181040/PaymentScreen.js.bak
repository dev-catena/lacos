import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { ArrowBackIcon } from '../../components/CustomIcons';
import doctorService from '../../services/doctorService';
import userService from '../../services/userService';
import appointmentService from '../../services/appointmentService';
import paymentService from '../../services/paymentService';
import { validateCardNumber, validateExpiry, validateCvv, getCardBrand } from '../../config/stripe';

const PaymentScreen = ({ route, navigation }) => {
  const { appointmentId, appointment, groupId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState(1);
  const [consultationPrice, setConsultationPrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(10 * 60); // 10 minutos em segundos
  const [timeExpired, setTimeExpired] = useState(false);

  useEffect(() => {
    loadDoctorPrice();
    startPaymentTimer();
    
    // Cleanup do timer quando o componente desmontar
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const timerRef = useRef(null);

  const startPaymentTimer = () => {
    // Obter a data de criação do appointment
    // Priorizar created_at que é quando o appointment foi realmente criado
    const appointmentCreatedAt = appointment?.created_at || appointment?.scheduled_at;
    
    if (!appointmentCreatedAt) {
      console.warn('⚠️ PaymentScreen - Não foi possível obter data de criação, iniciando com 10 minutos');
      setTimeRemaining(10 * 60);
      startCountdown();
      return;
    }
    
    // Criar objeto Date a partir da string (pode estar em UTC)
    const createdAt = new Date(appointmentCreatedAt);
    const now = new Date();
    
    // Verificar se as datas são válidas
    if (isNaN(createdAt.getTime())) {
      console.error('❌ PaymentScreen - Data de criação inválida:', appointmentCreatedAt);
      setTimeRemaining(10 * 60);
      startCountdown();
      return;
    }
    
    // Calcular o tempo decorrido desde a criação (em segundos)
    const elapsedSeconds = Math.floor((now - createdAt) / 1000);
    const PAYMENT_TIMEOUT_SECONDS = 10 * 60; // 10 minutos = 600 segundos
    const initialTimeRemaining = Math.max(0, PAYMENT_TIMEOUT_SECONDS - elapsedSeconds);
    
    console.log('⏰ PaymentScreen - Iniciando timer de pagamento:', {
      appointmentCreatedAt,
      createdAt: createdAt.toISOString(),
      createdAtLocal: createdAt.toLocaleString('pt-BR'),
      now: now.toISOString(),
      nowLocal: now.toLocaleString('pt-BR'),
      elapsedSeconds,
      elapsedMinutes: (elapsedSeconds / 60).toFixed(2),
      PAYMENT_TIMEOUT_SECONDS,
      initialTimeRemaining,
      initialTimeRemainingMinutes: (initialTimeRemaining / 60).toFixed(2),
      formattedTime: formatTime(initialTimeRemaining),
    });
    
    if (initialTimeRemaining <= 0) {
      console.log('⏰ PaymentScreen - Tempo já expirado ao iniciar');
      setTimeExpired(true);
      handleTimeExpired();
      return;
    }
    
    setTimeRemaining(initialTimeRemaining);
    startCountdown();
  };

  const startCountdown = () => {
    // Atualizar o timer a cada segundo
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTimeExpired(true);
          handleTimeExpired();
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeExpired = async () => {
    try {
      console.log('⏰ PaymentScreen - Tempo de pagamento expirado, desbloqueando horário...');
      
      // Cancelar o appointment para liberar o horário
      if (appointmentId) {
        const appointmentService = (await import('../../services/appointmentService')).default;
        const result = await appointmentService.deleteAppointment(appointmentId);
        if (!result.success) {
          console.error('❌ PaymentScreen - Erro ao deletar appointment:', result.error);
        }
      }
      
      Alert.alert(
        'Tempo Esgotado',
        'O tempo para realizar o pagamento expirou. O horário foi liberado para outros pacientes.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ PaymentScreen - Erro ao desbloquear horário:', error);
      Alert.alert(
        'Tempo Esgotado',
        'O tempo para realizar o pagamento expirou. O horário foi liberado.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const loadDoctorPrice = async () => {
    try {
      setLoadingPrice(true);
      
      // Primeiro, tentar buscar o appointment completo pelo ID para obter mais dados
      let fullAppointment = appointment;
      if (appointmentId && appointment) {
        try {
          console.log('💳 PaymentScreen - Buscando appointment completo pelo ID:', appointmentId);
          const appointmentResult = await appointmentService.getAppointment(appointmentId);
          if (appointmentResult && appointmentResult.success && appointmentResult.data) {
            fullAppointment = appointmentResult.data;
            console.log('✅ PaymentScreen - Appointment completo obtido:', {
              hasDoctorUser: !!fullAppointment?.doctorUser,
              doctorUserKeys: fullAppointment?.doctorUser ? Object.keys(fullAppointment.doctorUser) : [],
              consultation_price: fullAppointment?.doctorUser?.consultation_price,
            });
          }
        } catch (error) {
          console.warn('⚠️ PaymentScreen - Erro ao buscar appointment completo:', error);
        }
      }
      
      // Obter o ID do médico do appointment
      const doctorId = 
        fullAppointment?.doctor_id || 
        fullAppointment?.doctorUser?.id || 
        fullAppointment?.doctor?.id ||
        fullAppointment?.doctor?.user_id;

      console.log('💳 PaymentScreen - Iniciando busca de preço:', {
        doctorId,
        appointmentId: fullAppointment?.id,
        hasAppointment: !!fullAppointment,
        appointmentKeys: fullAppointment ? Object.keys(fullAppointment) : [],
      });

      if (!doctorId) {
        console.warn('⚠️ PaymentScreen - ID do médico não encontrado no appointment');
        console.warn('⚠️ PaymentScreen - Appointment completo:', JSON.stringify(fullAppointment, null, 2));
        // Usar valor padrão se não encontrar o médico
        const defaultPrice = 150;
        setConsultationPrice(defaultPrice);
        setFinalPrice(calculateFinalPrice(defaultPrice));
        setLoadingPrice(false);
        return;
      }

      let doctor = null;
      let consultationPriceFound = false;

      // Verificar primeiro se o appointment completo já traz consultation_price
      // Tentar appointment.doctor.user.consultation_price (novo formato do backend)
      if (fullAppointment?.doctor?.user?.consultation_price !== undefined && 
          fullAppointment?.doctor?.user?.consultation_price !== null) {
        doctor = fullAppointment.doctor.user;
        consultationPriceFound = true;
        console.log('✅ PaymentScreen - consultation_price encontrado no appointment.doctor.user:', {
          consultation_price: doctor.consultation_price,
        });
      } else if (fullAppointment?.doctor_user?.consultation_price !== undefined && 
                 fullAppointment?.doctor_user?.consultation_price !== null) {
        // Verificar se doctor_user é um objeto ou apenas um ID
        if (typeof fullAppointment.doctor_user === 'object' && fullAppointment.doctor_user !== null) {
          doctor = fullAppointment.doctor_user;
          consultationPriceFound = true;
          console.log('✅ PaymentScreen - consultation_price encontrado no appointment.doctor_user (objeto):', {
            consultation_price: doctor.consultation_price,
          });
        }
      } else if (fullAppointment?.doctorUser?.consultation_price !== undefined && 
                 fullAppointment?.doctorUser?.consultation_price !== null) {
        doctor = fullAppointment.doctorUser;
        consultationPriceFound = true;
        console.log('✅ PaymentScreen - consultation_price encontrado no appointment.doctorUser:', {
          consultation_price: doctor.consultation_price,
        });
      } else if (fullAppointment?.doctor?.consultation_price !== undefined && 
                 fullAppointment?.doctor?.consultation_price !== null) {
        doctor = fullAppointment.doctor;
        consultationPriceFound = true;
        console.log('✅ PaymentScreen - consultation_price encontrado no appointment.doctor:', {
          consultation_price: doctor.consultation_price,
        });
      }
      
      // Log detalhado do appointment para debug
      console.log('💳 PaymentScreen - Estrutura completa do appointment:', {
        hasDoctor: !!fullAppointment?.doctor,
        doctorKeys: fullAppointment?.doctor ? Object.keys(fullAppointment.doctor) : [],
        hasDoctorUser: !!fullAppointment?.doctorUser,
        doctorUserKeys: fullAppointment?.doctorUser ? Object.keys(fullAppointment.doctorUser) : [],
        hasDoctor_user: !!fullAppointment?.doctor_user,
        doctor_userType: typeof fullAppointment?.doctor_user,
        doctor_userKeys: fullAppointment?.doctor_user && typeof fullAppointment.doctor_user === 'object' ? Object.keys(fullAppointment.doctor_user) : [],
        allAppointmentKeys: fullAppointment ? Object.keys(fullAppointment) : [],
      });

      // Se não encontrou, tentar buscar appointments do mesmo médico para pegar consultation_price
      if (!consultationPriceFound && doctorId) {
        try {
          console.log('💳 PaymentScreen - Buscando outros appointments do mesmo médico para obter consultation_price');
          const today = new Date();
          const startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          const endDate = new Date(today);
          endDate.setDate(today.getDate() + 90);
          
          const appointmentsResult = await appointmentService.getAppointments(
            null, // groupId = null para buscar todas
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );
          
          if (appointmentsResult.success && appointmentsResult.data) {
            // Procurar um appointment do mesmo médico que tenha consultation_price
            const doctorAppointment = appointmentsResult.data.find(apt => {
              const aptDoctorId = apt.doctor_id || apt.doctorUser?.id || apt.doctor?.id || apt.doctor?.user_id;
              return aptDoctorId === doctorId && 
                     (apt.doctor?.user?.consultation_price !== undefined && apt.doctor?.user?.consultation_price !== null ||
                      apt.doctorUser?.consultation_price !== undefined && apt.doctorUser?.consultation_price !== null ||
                      apt.doctor?.consultation_price !== undefined && apt.doctor?.consultation_price !== null);
            });
            
            if (doctorAppointment) {
              // Priorizar doctor.user.consultation_price (novo formato do backend)
              if (doctorAppointment.doctor?.user?.consultation_price !== undefined && 
                  doctorAppointment.doctor?.user?.consultation_price !== null) {
                doctor = { ...doctor, ...doctorAppointment.doctor.user };
                consultationPriceFound = true;
                console.log('✅ PaymentScreen - consultation_price encontrado em outro appointment.doctor.user:', {
                  consultation_price: doctor.consultation_price,
                });
              } else if (doctorAppointment.doctorUser?.consultation_price !== undefined && 
                         doctorAppointment.doctorUser?.consultation_price !== null) {
                doctor = { ...doctor, ...doctorAppointment.doctorUser };
                consultationPriceFound = true;
                console.log('✅ PaymentScreen - consultation_price encontrado em outro appointment.doctorUser:', {
                  consultation_price: doctor.consultation_price,
                });
              } else if (doctorAppointment.doctor?.consultation_price !== undefined && 
                         doctorAppointment.doctor?.consultation_price !== null) {
                doctor = { ...doctor, ...doctorAppointment.doctor };
                consultationPriceFound = true;
                console.log('✅ PaymentScreen - consultation_price encontrado em outro appointment.doctor:', {
                  consultation_price: doctor.consultation_price,
                });
              }
            } else {
              console.warn('⚠️ PaymentScreen - Nenhum appointment do mesmo médico encontrado com consultation_price');
            }
          }
        } catch (appointmentsError) {
          console.warn('⚠️ PaymentScreen - Erro ao buscar appointments:', appointmentsError);
        }
      }

      // Se ainda não encontrou, tentar buscar pelo endpoint /doctors (pode ter relação com User)
      if (!consultationPriceFound && doctorId) {
        try {
          console.log('💳 PaymentScreen - Tentando buscar pelo endpoint /doctors/' + doctorId);
          const doctorResult = await doctorService.getDoctor(doctorId);
          
          if (doctorResult && doctorResult.success && doctorResult.data) {
            console.log('💳 PaymentScreen - Resposta do /doctors:', {
              hasData: !!doctorResult.data,
              dataKeys: Object.keys(doctorResult.data),
              consultation_price: doctorResult.data.consultation_price,
              user: doctorResult.data.user,
              user_consultation_price: doctorResult.data.user?.consultation_price,
            });
            
            // Verificar se tem user dentro do doctor
            if (doctorResult.data.user?.consultation_price !== undefined && 
                doctorResult.data.user?.consultation_price !== null) {
              doctor = doctorResult.data.user;
              consultationPriceFound = true;
              console.log('✅ PaymentScreen - consultation_price encontrado em doctor.user:', {
                consultation_price: doctor.consultation_price,
              });
            } else {
              // Mesclar dados do /doctors
              doctor = { ...doctor, ...doctorResult.data };
            }
          }
        } catch (doctorError) {
          console.error('❌ PaymentScreen - Erro ao buscar pelo endpoint /doctors:', doctorError);
        }
      }

      // Se ainda não encontrou, mesclar dados do appointment original
      if (fullAppointment?.doctorUser) {
        console.log('💳 PaymentScreen - Mesclando dados do appointment.doctorUser:', {
          doctorUserKeys: Object.keys(fullAppointment.doctorUser),
          consultation_price: fullAppointment.doctorUser.consultation_price,
        });
        doctor = { ...doctor, ...fullAppointment.doctorUser };
      } else if (fullAppointment?.doctor) {
        console.log('💳 PaymentScreen - Mesclando dados do appointment.doctor:', {
          doctorKeys: Object.keys(fullAppointment.doctor),
          consultation_price: fullAppointment.doctor.consultation_price,
        });
        doctor = { ...doctor, ...fullAppointment.doctor };
      }
      
      console.log('💳 PaymentScreen - Dados finais do médico:', {
        consultation_price: doctor?.consultation_price,
        teleconsultation_price: doctor?.teleconsultation_price,
        appointment_price: doctor?.appointment_price,
        price: doctor?.price,
        hourly_rate: doctor?.hourly_rate,
        allKeys: doctor ? Object.keys(doctor) : [],
        doctorData: JSON.stringify(doctor, null, 2),
      });
      
      // Tentar obter o valor da consulta - priorizar consultation_price que é o campo do perfil do médico
      const doctorPrice = 
        (doctor?.consultation_price !== undefined && doctor?.consultation_price !== null) ? doctor.consultation_price :
        doctor?.teleconsultation_price || 
        doctor?.appointment_price ||
        doctor?.price ||
        doctor?.hourly_rate || // Fallback para cuidador profissional
        null;

      if (doctorPrice !== null && doctorPrice !== undefined && !isNaN(parseFloat(doctorPrice)) && parseFloat(doctorPrice) > 0) {
        const basePrice = parseFloat(doctorPrice);
        console.log('✅ PaymentScreen - Valor da consulta encontrado:', {
          basePrice,
          field: (doctor?.consultation_price !== undefined && doctor?.consultation_price !== null) ? 'consultation_price' :
                 doctor?.teleconsultation_price ? 'teleconsultation_price' :
                 doctor?.appointment_price ? 'appointment_price' :
                 doctor?.price ? 'price' :
                 doctor?.hourly_rate ? 'hourly_rate' : 'unknown',
          rawValue: doctorPrice,
        });
        setConsultationPrice(basePrice);
        setFinalPrice(calculateFinalPrice(basePrice));
      } else {
        // Se não encontrar, usar valor padrão
        console.warn('⚠️ PaymentScreen - Valor da consulta não encontrado no perfil do médico, usando valor padrão', {
          doctorPrice,
          consultation_price: doctor?.consultation_price,
          type: typeof doctor?.consultation_price,
          isNaN: isNaN(parseFloat(doctorPrice)),
          parsed: parseFloat(doctorPrice),
        });
        const defaultPrice = 150;
        setConsultationPrice(defaultPrice);
        setFinalPrice(calculateFinalPrice(defaultPrice));
      }
    } catch (error) {
      console.error('❌ PaymentScreen - Erro ao buscar valor da consulta:', error);
      console.error('❌ PaymentScreen - Stack trace:', error.stack);
      // Em caso de erro, usar valor padrão
      const defaultPrice = 150;
      setConsultationPrice(defaultPrice);
      setFinalPrice(calculateFinalPrice(defaultPrice));
    } finally {
      setLoadingPrice(false);
    }
  };

  const calculateFinalPrice = (basePrice) => {
    // Adicionar 20% ao valor base
    const finalPrice = basePrice * 1.2;
    return Math.round(finalPrice * 100) / 100; // Arredondar para 2 casas decimais
  };

  const formatCardNumber = (text) => {
    // Remove tudo que não é dígito
    const cleaned = text.replace(/\D/g, '');
    // Limita a 16 dígitos
    const limited = cleaned.substring(0, 16);
    // Adiciona espaços a cada 4 dígitos
    const formatted = limited.replace(/(.{4})/g, '$1 ').trim();
    return formatted;
  };

  const formatExpiry = (text) => {
    // Remove tudo que não é dígito
    const cleaned = text.replace(/\D/g, '');
    // Limita a 4 dígitos
    const limited = cleaned.substring(0, 4);
    // Adiciona barra após 2 dígitos
    if (limited.length >= 2) {
      return limited.substring(0, 2) + '/' + limited.substring(2, 4);
    }
    return limited;
  };

  const formatCvv = (text) => {
    // Remove tudo que não é dígito e limita a 3 dígitos
    return text.replace(/\D/g, '').substring(0, 3);
  };

  const handlePayment = async () => {
    // Verificar se o tempo expirou
    if (timeExpired || timeRemaining <= 0) {
      Alert.alert(
        'Tempo Esgotado',
        'O tempo para realizar o pagamento expirou. O horário foi liberado para outros pacientes.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    // Validações básicas
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanedCardNumber || cleanedCardNumber.length < 13) {
      Alert.alert('Erro', 'Por favor, informe um número de cartão válido');
      return;
    }

    if (!cardName || cardName.trim().length < 3) {
      Alert.alert('Erro', 'Por favor, informe o nome completo do titular do cartão');
      return;
    }

    if (!cardExpiry || cardExpiry.length < 5) {
      Alert.alert('Erro', 'Por favor, informe a data de validade do cartão');
      return;
    }

    if (!cardCvv || cardCvv.length < 3) {
      Alert.alert('Erro', 'Por favor, informe o CVV do cartão');
      return;
    }

    // Validações com Stripe
    if (!validateCardNumber(cleanedCardNumber)) {
      Alert.alert('Erro', 'Número de cartão inválido. Por favor, verifique os dados.');
      return;
    }

    const cardBrand = getCardBrand(cleanedCardNumber);
    if (!validateCvv(cardCvv, cardBrand)) {
      Alert.alert('Erro', 'CVV inválido. Por favor, verifique os dados.');
      return;
    }

    if (!validateExpiry(cardExpiry)) {
      Alert.alert('Erro', 'Data de validade inválida ou expirada. Por favor, verifique os dados.');
      return;
    }

    if (!appointmentId) {
      Alert.alert('Erro', 'ID do compromisso não encontrado');
      return;
    }

    if (finalPrice <= 0) {
      Alert.alert('Erro', 'Valor inválido para pagamento');
      return;
    }

    setLoading(true);
    
    // Parar o timer ao iniciar o pagamento
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      console.log('💳 PaymentScreen - Iniciando processamento de pagamento com Stripe');

      // Processar pagamento via Stripe
      const result = await paymentService.processPayment(
        appointmentId,
        finalPrice,
        {
          cardNumber: cleanedCardNumber,
          cardName: cardName.trim(),
          cardExpiry: cardExpiry,
          cardCvv: cardCvv,
        },
        installments
      );

      if (result.success) {
        console.log('✅ PaymentScreen - Pagamento processado com sucesso:', result);
        
        Alert.alert(
          'Pagamento Processado',
          'Seu pagamento foi processado com sucesso! A teleconsulta está confirmada.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        console.error('❌ PaymentScreen - Erro no pagamento:', result.error);
        
        // Mensagens de erro mais específicas
        let errorMessage = 'Não foi possível processar o pagamento.';
        
        if (result.error) {
          if (result.error.includes('card_declined')) {
            errorMessage = 'Cartão recusado. Verifique os dados ou entre em contato com seu banco.';
          } else if (result.error.includes('insufficient_funds')) {
            errorMessage = 'Saldo insuficiente. Verifique sua conta.';
          } else if (result.error.includes('expired_card')) {
            errorMessage = 'Cartão expirado. Use outro cartão.';
          } else if (result.error.includes('incorrect_cvc')) {
            errorMessage = 'CVV incorreto. Verifique os dados do cartão.';
          } else {
            errorMessage = result.error;
          }
        }

        Alert.alert(
          'Erro no Pagamento',
          errorMessage
        );
      }
    } catch (error) {
      console.error('❌ PaymentScreen - Erro ao processar pagamento:', error);
      Alert.alert(
        'Erro no Pagamento',
        error.message || 'Não foi possível processar o pagamento. Por favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentInfo = () => {
    if (!appointment) return null;

    const dateStr = appointment.appointment_date || appointment.scheduled_at;
    const date = dateStr ? new Date(dateStr) : null;
    const doctorName = 
      appointment.doctorUser?.name || 
      appointment.doctor?.name || 
      appointment.doctor_name || 
      'Médico não informado';

    return {
      title: appointment.title || 'Teleconsulta',
      doctorName,
      date: date ? date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }) : 'Data não informada',
      time: date ? date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }) : 'Horário não informado',
    };
  };

  const appointmentInfo = getAppointmentInfo();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Tarja de Mockup */}
      <View style={styles.mockupBanner}>
        <Ionicons name="warning" size={16} color={colors.warning} />
        <Text style={styles.mockupBannerText}>
          MOCKUP - Sistema de pagamento em modo de teste
        </Text>
      </View>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Pagamento</Text>
          <Text style={styles.headerSubtitle}>Teleconsulta</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Informações da Consulta */}
        {appointmentInfo && (
          <View style={styles.appointmentInfoCard}>
            <View style={styles.appointmentInfoHeader}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.appointmentInfoTitle}>Informações da Consulta</Text>
            </View>
            <View style={styles.appointmentInfoRow}>
              <Text style={styles.appointmentInfoLabel}>Título:</Text>
              <Text style={styles.appointmentInfoValue}>{appointmentInfo.title}</Text>
            </View>
            <View style={styles.appointmentInfoRow}>
              <Text style={styles.appointmentInfoLabel}>Médico:</Text>
              <Text style={styles.appointmentInfoValue}>Dr(a). {appointmentInfo.doctorName}</Text>
            </View>
            <View style={styles.appointmentInfoRow}>
              <Text style={styles.appointmentInfoLabel}>Data:</Text>
              <Text style={styles.appointmentInfoValue}>{appointmentInfo.date}</Text>
            </View>
            <View style={styles.appointmentInfoRow}>
              <Text style={styles.appointmentInfoLabel}>Horário:</Text>
              <Text style={styles.appointmentInfoValue}>{appointmentInfo.time}</Text>
            </View>
          </View>
        )}

        {/* Cronômetro de Pagamento */}
        {!timeExpired && (
          <View style={[
            styles.timerCard,
            timeRemaining <= 300 && styles.timerCardWarning, // 5 minutos restantes
            timeRemaining <= 60 && styles.timerCardDanger, // 1 minuto restante
          ]}>
            <Ionicons 
              name="time-outline" 
              size={24} 
              color={timeRemaining <= 60 ? colors.error : timeRemaining <= 300 ? colors.warning : colors.primary} 
            />
            <View style={styles.timerContent}>
              <Text style={styles.timerLabel}>Tempo restante para pagamento</Text>
              <Text style={[
                styles.timerValue,
                timeRemaining <= 60 && styles.timerValueDanger,
                timeRemaining <= 300 && timeRemaining > 60 && styles.timerValueWarning,
              ]}>
                {formatTime(timeRemaining)}
              </Text>
              <Text style={styles.timerSubtext}>
                Após este tempo, o horário será liberado para outros pacientes
              </Text>
            </View>
          </View>
        )}

        {timeExpired && (
          <View style={styles.expiredCard}>
            <Ionicons name="close-circle" size={32} color={colors.error} />
            <Text style={styles.expiredText}>Tempo de pagamento expirado</Text>
            <Text style={styles.expiredSubtext}>
              O horário foi liberado para outros pacientes
            </Text>
          </View>
        )}

        {/* Valor */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Valor da Teleconsulta</Text>
          {loadingPrice ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Text style={styles.amountValue}>
                R$ {finalPrice.toFixed(2).replace('.', ',')}
              </Text>
              {consultationPrice > 0 && (
                <Text style={styles.amountSubtext}>
                  Valor base: R$ {consultationPrice.toFixed(2).replace('.', ',')} + 20% taxa
                </Text>
              )}
            </>
          )}
        </View>

        {/* Formulário de Pagamento */}
        <View style={styles.paymentForm}>
          <Text style={styles.sectionTitle}>Dados do Cartão</Text>

          {/* Número do Cartão */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número do Cartão</Text>
            <TextInput
              style={styles.input}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={colors.gray400}
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="numeric"
              maxLength={19}
            />
          </View>

          {/* Nome do Titular */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome do Titular</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome como está no cartão"
              placeholderTextColor={colors.gray400}
              value={cardName}
              onChangeText={(text) => setCardName(text.toUpperCase())}
              autoCapitalize="words"
            />
          </View>

          {/* Validade e CVV */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, styles.inputGroupHalf]}>
              <Text style={styles.inputLabel}>Validade</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/AA"
                placeholderTextColor={colors.gray400}
                value={cardExpiry}
                onChangeText={(text) => setCardExpiry(formatExpiry(text))}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View style={[styles.inputGroup, styles.inputGroupHalf]}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor={colors.gray400}
                value={cardCvv}
                onChangeText={(text) => setCardCvv(formatCvv(text))}
                keyboardType="numeric"
                maxLength={3}
                secureTextEntry
              />
            </View>
          </View>

          {/* Parcelas */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Parcelas</Text>
            <View style={styles.installmentsContainer}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.installmentButton,
                    installments === num && styles.installmentButtonActive,
                  ]}
                  onPress={() => setInstallments(num)}
                >
                  <Text
                    style={[
                      styles.installmentButtonText,
                      installments === num && styles.installmentButtonTextActive,
                    ]}
                  >
                    {num}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {installments > 1 && (
              <Text style={styles.installmentValue}>
                {installments}x de R$ {(finalPrice / installments).toFixed(2).replace('.', ',')}
              </Text>
            )}
          </View>
        </View>

        {/* Botão de Pagamento */}
        <TouchableOpacity
          style={[
            styles.paymentButton, 
            (loading || loadingPrice || timeExpired) && styles.paymentButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={loading || loadingPrice || timeExpired}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : loadingPrice ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : timeExpired ? (
            <>
              <Ionicons name="close-circle" size={20} color={colors.textWhite} />
              <Text style={styles.paymentButtonText}>Tempo Esgotado</Text>
            </>
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color={colors.textWhite} />
              <Text style={styles.paymentButtonText}>
                Pagar R$ {finalPrice.toFixed(2).replace('.', ',')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Informações de Segurança */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.securityText}>
            Seus dados estão protegidos e criptografados
          </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  appointmentInfoCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appointmentInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  appointmentInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  appointmentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appointmentInfoLabel: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  appointmentInfoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  amountCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  amountSubtext: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary + '40',
    gap: 12,
  },
  timerCardWarning: {
    backgroundColor: colors.warning + '15',
    borderColor: colors.warning + '40',
  },
  timerCardDanger: {
    backgroundColor: colors.error + '15',
    borderColor: colors.error + '40',
  },
  timerContent: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  timerValueWarning: {
    color: colors.warning,
  },
  timerValueDanger: {
    color: colors.error,
  },
  timerSubtext: {
    fontSize: 11,
    color: colors.textLight,
  },
  expiredCard: {
    alignItems: 'center',
    backgroundColor: colors.error + '15',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.error + '40',
  },
  expiredText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
    marginTop: 12,
    marginBottom: 4,
  },
  expiredSubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  paymentForm: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  installmentsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  installmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  installmentButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  installmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  installmentButtonTextActive: {
    color: colors.textWhite,
  },
  installmentValue: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textWhite,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  securityText: {
    fontSize: 12,
    color: colors.textLight,
  },
  mockupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.warning + '20',
    borderBottomWidth: 2,
    borderBottomColor: colors.warning,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  mockupBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
    textTransform: 'uppercase',
  },
});

export default PaymentScreen;

