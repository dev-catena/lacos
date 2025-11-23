import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import { LacosIcon } from '../../components/LacosLogo';
import PanicButton from '../../components/PanicButton';

const PATIENT_SESSION_KEY = '@lacos_patient_session';
const GROUPS_STORAGE_KEY = '@lacos_groups';

const PatientHomeScreen = ({ navigation }) => {
  const [patientSession, setPatientSession] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [sosContacts, setSosContacts] = useState([]);
  const [groupId, setGroupId] = useState(null);

  // Mock de notificações - Criar consulta AGORA para testar o microfone
  const [notifications, setNotifications] = useState(() => {
    const now = new Date();
    const appointmentTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutos no futuro
    const hours = appointmentTime.getHours().toString().padStart(2, '0');
    const minutes = appointmentTime.getMinutes().toString().padStart(2, '0');
    
    return [
      {
        id: 1,
        type: 'appointment',
        title: 'Consulta com Dr. Silva',
        description: 'Cardiologia - AGORA',
        time: `${hours}:${minutes}`,
        date: 'Hoje',
        icon: 'calendar',
        color: colors.warning,
        appointmentTime: appointmentTime.toISOString(), // Adiciona o horário ISO
      },
      {
        id: 2,
        type: 'medication',
        title: 'Hora do Remédio',
        description: 'Losartana 50mg',
        time: '15:00',
        date: 'Hoje',
        icon: 'medical',
        color: colors.secondary,
      },
      {
        id: 3,
        type: 'appointment',
        title: 'Fisioterapia',
        description: 'Centro de Reabilitação',
        time: '10:00',
        date: 'Amanhã',
        icon: 'calendar',
        color: colors.warning,
        appointmentTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
      },
    ];
  });

  useFocusEffect(
    React.useCallback(() => {
      loadPatientSession();
    }, [])
  );

  const loadPatientSession = async () => {
    try {
      const sessionJson = await AsyncStorage.getItem(PATIENT_SESSION_KEY);
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        setPatientSession(session);

        // Carregar contatos do grupo
        const groupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
        if (groupsJson) {
          const groups = JSON.parse(groupsJson);
          const currentGroup = groups.find(g => g.id === session.groupId);

          if (currentGroup) {
            // Definir groupId para o botão de pânico
            setGroupId(session.groupId);
            
            // Carregar contatos rápidos com cores padrão
            const colorOptions = [colors.primary, colors.secondary, colors.info];
            const quickContacts = (currentGroup.quickContacts || []).map((contact, index) => ({
              ...contact,
              color: colorOptions[index % colorOptions.length],
            }));
            
            setContacts(quickContacts);
            setSosContacts(currentGroup.sosContacts || []);
            
            console.log('Contatos carregados:', quickContacts);
            console.log('Contatos SOS:', currentGroup.sosContacts);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar os dados',
      });
    }
  };


  const makePhoneCall = async (contact) => {
    // Validar se o contato tem número
    if (!contact || !contact.phone) {
      Toast.show({
        type: 'error',
        text1: 'Contato Inválido',
        text2: 'Este contato não tem número de telefone configurado',
        position: 'bottom',
      });
      return;
    }

    // Limpar o número (remover formatação)
    const cleanPhone = contact.phone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Número Inválido',
        text2: 'O número de telefone está incompleto',
        position: 'bottom',
      });
      return;
    }

    // Ligar direto
    performCall(contact.name, cleanPhone);
  };

  const performCall = async (contactName, cleanPhone) => {
    try {
      console.log('[Call] Iniciando chamada para:', contactName);
      console.log('[Call] Número limpo:', cleanPhone);
      
      // Formatar corretamente para Brasil
      // Se já começa com 55, adicionar +
      // Se não, adicionar +55
      let formattedPhone = cleanPhone;
      if (cleanPhone.startsWith('55')) {
        formattedPhone = '+' + cleanPhone;
      } else if (!cleanPhone.startsWith('+')) {
        formattedPhone = '+55' + cleanPhone;
      }
      
      // Adicionar espaços para melhor formatação
      // +55 31 98310-4230
      if (formattedPhone.startsWith('+55') && formattedPhone.length === 13) {
        // Formato: +55 XX XXXXX-XXXX
        formattedPhone = `${formattedPhone.slice(0, 3)} ${formattedPhone.slice(3, 5)} ${formattedPhone.slice(5, 10)}-${formattedPhone.slice(10)}`;
      }
      
      const phoneUrl = `tel:${formattedPhone}`;
      console.log('[Call] Número formatado:', formattedPhone);
      console.log('[Call] URL da chamada:', phoneUrl);

      await Linking.openURL(phoneUrl);
      console.log('[Call] ✅ Discador aberto!');
    } catch (error) {
      console.error('[Call] ERRO:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível abrir o discador',
        position: 'bottom',
      });
    }
  };

  const handleSOS = async () => {
    // Verificar se há contatos SOS configurados
    if (!sosContacts || sosContacts.length === 0) {
      Alert.alert(
        'Nenhum Contato SOS',
        'Não há contatos de emergência configurados. Peça ao seu cuidador para adicionar contatos SOS.',
        [
          {
            text: 'OK',
            onPress: () => {
              Toast.show({
                type: 'error',
                text1: 'Configure Contatos SOS',
                text2: 'Peça ao cuidador para adicionar contatos de emergência',
                position: 'bottom',
              });
            },
          },
        ]
      );
      return;
    }

    // Filtrar contatos com telefone válido
    const validSOSContacts = sosContacts.filter(c => c.phone && c.phone.replace(/\D/g, '').length >= 10);

    if (validSOSContacts.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Contatos SOS Inválidos',
        text2: 'Nenhum contato SOS tem número válido',
        position: 'bottom',
      });
      return;
    }

    // Confirmar SOS - mantém confirmação por ser emergência
    Alert.alert(
      '🚨 SOS EMERGÊNCIA',
      `Ligar para:\n${validSOSContacts.map(c => `📞 ${c.name}`).join('\n')}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'LIGAR AGORA',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[SOS] Ativando SOS para', validSOSContacts.length, 'contatos');

              // Ligar para o primeiro contato
              const firstContact = validSOSContacts[0];
              let cleanPhone = firstContact.phone.replace(/\D/g, '');
              
              // Formatar com + para formato internacional
              if (!cleanPhone.startsWith('+')) {
                if (cleanPhone.startsWith('55')) {
                  cleanPhone = `+${cleanPhone}`;
                } else {
                  cleanPhone = `+55${cleanPhone}`;
                }
              }
              
              console.log('[SOS] Ligando para:', firstContact.name, '-', cleanPhone);
              
              await Linking.openURL(`tel:${cleanPhone}`);

              Toast.show({
                type: 'success',
                text1: '🚨 SOS ATIVADO',
                text2: `Ligando para ${firstContact.name}`,
                position: 'top',
                visibilityTime: 3000,
              });

              // Se houver mais contatos, mostrar opção de ligar para os próximos
              if (validSOSContacts.length > 1) {
                setTimeout(() => {
                  Alert.alert(
                    'Ligar para Próximo Contato?',
                    `Deseja ligar para ${validSOSContacts[1].name}?`,
                    [
                      { text: 'Não', style: 'cancel' },
                      {
                        text: 'Sim',
                        onPress: () => {
                          const nextPhone = validSOSContacts[1].phone.replace(/\D/g, '');
                          Linking.openURL(`tel:${nextPhone}`);
                        },
                      },
                    ]
                  );
                }, 2000);
              }
            } catch (error) {
              console.error('Erro ao acionar SOS:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro no SOS',
                text2: 'Não foi possível fazer a chamada de emergência',
                position: 'bottom',
              });
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = async (notification) => {
    if (notification.type === 'appointment') {
      // Navegar para tela de detalhes da consulta
      navigation.navigate('AppointmentDetails', {
        appointment: notification,
      });
    } else if (notification.type === 'medication') {
      Alert.alert(
        notification.title,
        notification.description,
        [
          { text: 'Manter alerta' },
          { 
            text: 'Já tomei', 
            style: 'default',
            onPress: () => {
              // Remover medicamento da lista quando marcar como "Já tomei"
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
              
              Toast.show({
                type: 'success',
                text1: '✅ Medicamento registrado',
                text2: 'Dose marcada como tomada',
                position: 'bottom',
              });
            }
          },
        ]
      );
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LacosIcon size={36} />
          <View>
            <Text style={styles.greeting}>Olá!</Text>
            {patientSession && (
              <Text style={styles.userName}>{patientSession.accompaniedName}</Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Contact Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contatos Rápidos</Text>
          
          {contacts.length === 0 ? (
            <View style={styles.emptyContacts}>
              <Ionicons name="call-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyContactsText}>
                Nenhum contato configurado
              </Text>
              <Text style={styles.emptyContactsSubtext}>
                Peça ao seu cuidador para adicionar contatos rápidos
              </Text>
            </View>
          ) : (
            <View style={styles.cardsGrid}>
              {/* Contact Cards */}
              {contacts.map((contact, index) => (
                <TouchableOpacity
                  key={contact.id}
                  style={[styles.card, { backgroundColor: contact.color }]}
                  onPress={() => makePhoneCall(contact)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={32} color={colors.textWhite} />
                  <Text style={styles.cardTitle}>{contact.name}</Text>
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>Ligar</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* SOS Card */}
              <TouchableOpacity
                style={[styles.card, styles.sosCard]}
                onPress={handleSOS}
                activeOpacity={0.8}
              >
                <Ionicons name="alert-circle" size={40} color={colors.textWhite} />
                <Text style={[styles.cardTitle, styles.sosText]}>Ajuda</Text>
                <View style={[styles.cardBadge, styles.sosBadge]}>
                  <Text style={styles.cardBadgeText}>SOS</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          
          {notifications.map((notification) => {
            // Verificar se deve mostrar o microfone
            // REGRA: Só mostra microfone para consultas do tipo 'medical'
            let showMicrophone = false;
            if (notification.type === 'appointment' && 
                notification.appointmentType === 'medical' && 
                notification.appointmentTime) {
              const now = new Date();
              const appointmentTime = new Date(notification.appointmentTime);
              const fifteenMinutesBefore = new Date(appointmentTime.getTime() - 15 * 60 * 1000);
              const threeMinutesAfter = new Date(appointmentTime.getTime() + 3 * 60 * 1000);
              
              // Mostrar microfone se estiver entre 15 min antes e 3 min depois
              showMicrophone = now >= fifteenMinutesBefore && now <= threeMinutesAfter;
            }
            
            return (
              <TouchableOpacity
                key={notification.id}
                style={styles.notificationCard}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={[styles.notificationIcon, { backgroundColor: notification.color + '20' }]}>
                  <Ionicons name={notification.icon} size={28} color={notification.color} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationDescription}>{notification.description}</Text>
                  <View style={styles.notificationTime}>
                    <Ionicons name="time-outline" size={14} color={colors.textLight} />
                    <Text style={styles.notificationTimeText}>
                      {notification.date} - {notification.time}
                    </Text>
                  </View>
                </View>
                
                {showMicrophone ? (
                  <View style={styles.microphoneIndicator}>
                    <Ionicons name="mic" size={24} color={colors.error} />
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botão de Pânico Flutuante */}
      {groupId && (
        <View style={styles.panicButtonContainer}>
          <PanicButton 
            groupId={groupId}
            onPanicTriggered={(data) => {
              console.log('Pânico acionado:', data);
            }}
          />
        </View>
      )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 14,
    color: colors.textLight,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sosCard: {
    backgroundColor: colors.error,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginTop: 8,
  },
  sosText: {
    fontSize: 20,
  },
  cardBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sosBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textWhite,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 6,
  },
  notificationTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTimeText: {
    fontSize: 12,
    color: colors.textLight,
  },
  microphoneIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContacts: {
    backgroundColor: colors.backgroundLight,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyContactsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyContactsSubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  panicButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
});

export default PatientHomeScreen;

