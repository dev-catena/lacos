import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';

const APPOINTMENT_RECORDINGS_KEY = '@lacos_appointment_recordings';

const AppointmentDetailsScreen = ({ route, navigation }) => {
  const { appointment, recordingJustSaved } = route.params || {};
  const [showMicrophone, setShowMicrophone] = useState(false);
  const [isMicrophoneBlinking, setIsMicrophoneBlinking] = useState(false);
  const [blinkAnim] = useState(new Animated.Value(1));
  const [recordingData, setRecordingData] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkMicrophoneAvailability();
    const interval = setInterval(checkMicrophoneAvailability, 60000); // Verifica a cada minuto
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isMicrophoneBlinking) {
      startBlinking();
    } else {
      stopBlinking();
    }
  }, [isMicrophoneBlinking]);

  useFocusEffect(
    React.useCallback(() => {
      loadRecording();
      
      // Mostrar toast se a gravação acabou de ser salva
      if (recordingJustSaved) {
        setTimeout(() => {
          Toast.show({
            type: 'success',
            text1: 'Gravação Disponível',
            text2: 'Você pode ouvir o áudio gravado abaixo',
            position: 'top',
          });
        }, 300);
      }

      return () => {
        // Limpar áudio ao sair da tela
        if (sound) {
          sound.unloadAsync();
        }
      };
    }, [appointment?.id, recordingJustSaved])
  );

  const checkMicrophoneAvailability = () => {
    if (!appointment?.time) return;

    const now = new Date();
    const [hours, minutes] = appointment.time.split(':');
    const appointmentTime = new Date();
    appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0);

    // 15 minutos antes
    const fifteenMinBefore = new Date(appointmentTime.getTime() - 15 * 60000);
    // 30 minutos depois
    const thirtyMinAfter = new Date(appointmentTime.getTime() + 30 * 60000);
    // 3 minutos depois (para piscar)
    const threeMinAfter = new Date(appointmentTime.getTime() + 3 * 60000);

    // Mostrar microfone se está no período (15 min antes até 30 min depois)
    const shouldShow = now >= fifteenMinBefore && now <= thirtyMinAfter;
    setShowMicrophone(shouldShow);

    // Piscar se está entre o horário de início e 3 minutos depois
    const shouldBlink = now >= appointmentTime && now <= threeMinAfter;
    setIsMicrophoneBlinking(shouldBlink);
  };

  const startBlinking = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopBlinking = () => {
    blinkAnim.setValue(1);
  };

  const loadRecording = async () => {
    if (!appointment?.id) return;

    try {
      const recordingsJson = await AsyncStorage.getItem(APPOINTMENT_RECORDINGS_KEY);
      if (recordingsJson) {
        const recordings = JSON.parse(recordingsJson);
        const appointmentRecording = recordings[appointment.id];
        
        if (appointmentRecording) {
          setRecordingData(appointmentRecording);
          console.log('Gravação encontrada:', appointmentRecording);
        } else {
          setRecordingData(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar gravação:', error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playAudio = async () => {
    if (!recordingData?.uri) return;

    try {
      setIsLoading(true);

      // Se já está tocando, parar
      if (sound && isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }

      // Se já existe um sound object mas está pausado, retomar
      if (sound && !isPlaying) {
        await sound.playAsync();
        setIsPlaying(true);
        setIsLoading(false);
        return;
      }

      // Criar novo sound object
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingData.uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);

      Toast.show({
        type: 'info',
        text1: '▶️ Reproduzindo Áudio',
        text2: `Duração: ${formatDuration(recordingData.duration)}`,
        position: 'bottom',
      });
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      setIsLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível reproduzir o áudio',
        position: 'bottom',
      });
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      setIsPlaying(false);
      Toast.show({
        type: 'success',
        text1: 'Áudio Finalizado',
        position: 'bottom',
      });
    }
  };

  const deleteRecording = () => {
    Alert.alert(
      'Excluir Gravação',
      'Tem certeza que deseja excluir esta gravação? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const recordingsJson = await AsyncStorage.getItem(APPOINTMENT_RECORDINGS_KEY);
              if (recordingsJson) {
                const recordings = JSON.parse(recordingsJson);
                delete recordings[appointment.id];
                await AsyncStorage.setItem(APPOINTMENT_RECORDINGS_KEY, JSON.stringify(recordings));
                
                if (sound) {
                  await sound.unloadAsync();
                  setSound(null);
                }
                
                setRecordingData(null);
                setIsPlaying(false);
                
                Toast.show({
                  type: 'success',
                  text1: 'Gravação Excluída',
                  position: 'bottom',
                });
              }
            } catch (error) {
              console.error('Erro ao excluir gravação:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível excluir a gravação',
                position: 'bottom',
              });
            }
          },
        },
      ]
    );
  };

  const handleStartRecording = () => {
    navigation.navigate('RecordingScreen', {
      appointment,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Consulta</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Appointment Info Card */}
        <View style={styles.appointmentCard}>
          <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="calendar" size={48} color={colors.warning} />
          </View>

          <Text style={styles.title}>{appointment?.title}</Text>
          <Text style={styles.description}>{appointment?.description}</Text>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.textLight} />
              <Text style={styles.infoLabel}>Horário:</Text>
              <Text style={styles.infoValue}>{appointment?.time}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.textLight} />
              <Text style={styles.infoLabel}>Data:</Text>
              <Text style={styles.infoValue}>{appointment?.date}</Text>
            </View>

            {appointment?.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={colors.textLight} />
                <Text style={styles.infoLabel}>Local:</Text>
                <Text style={styles.infoValue}>{appointment?.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Audio Player Section - Mostrar se houver gravação */}
        {recordingData && (
          <View style={styles.audioPlayerSection}>
            <View style={styles.audioPlayerHeader}>
              <Ionicons name="musical-notes" size={24} color={colors.success} />
              <Text style={styles.audioPlayerTitle}>Gravação de Áudio</Text>
            </View>

            <View style={styles.audioPlayerCard}>
              <View style={styles.audioInfo}>
                <View style={styles.audioIconContainer}>
                  <Ionicons 
                    name={isPlaying ? "pause-circle" : "play-circle"} 
                    size={64} 
                    color={colors.success} 
                  />
                </View>
                
                <View style={styles.audioDetails}>
                  <Text style={styles.audioLabel}>Anotação Gravada</Text>
                  <Text style={styles.audioDuration}>
                    Duração: {formatDuration(recordingData.duration)}
                  </Text>
                  <Text style={styles.audioDate}>
                    Gravado em: {new Date(recordingData.recordedAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.audioControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={playAudio}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons 
                        name={isPlaying ? "pause" : "play"} 
                        size={24} 
                        color={colors.textWhite} 
                      />
                      <Text style={styles.playButtonText}>
                        {isPlaying ? 'Pausar' : 'Ouvir Gravação'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={deleteRecording}
                  disabled={isLoading}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.audioInfoCard}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.audioInfoText}>
                Seus cuidadores podem ouvir esta gravação e acompanhar suas consultas.
              </Text>
            </View>
          </View>
        )}

        {/* Recording Section */}
        {showMicrophone && (
          <View style={styles.recordingSection}>
            <View style={styles.recordingHeader}>
              <Ionicons name="mic" size={24} color={colors.error} />
              <Text style={styles.recordingTitle}>Gravação de Áudio</Text>
            </View>

            <Text style={styles.recordingDescription}>
              Grave anotações sobre esta consulta. Seus cuidadores receberão o áudio.
            </Text>

            <Animated.View style={{ opacity: blinkAnim }}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isMicrophoneBlinking && styles.recordButtonBlinking
                ]}
                onPress={handleStartRecording}
              >
                <View style={styles.recordButtonIcon}>
                  <Ionicons name="mic" size={32} color={colors.textWhite} />
                </View>
                <View style={styles.recordButtonContent}>
                  <Text style={styles.recordButtonTitle}>
                    {isMicrophoneBlinking ? 'Gravar Agora!' : 'Iniciar Gravação'}
                  </Text>
                  <Text style={styles.recordButtonSubtitle}>
                    {isMicrophoneBlinking 
                      ? 'Consulta em andamento - Toque para gravar'
                      : 'Grave suas anotações sobre a consulta'
                    }
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textWhite} />
              </TouchableOpacity>
            </Animated.View>

            {isMicrophoneBlinking && (
              <View style={styles.urgentBadge}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.urgentText}>
                  Disponível por mais alguns minutos!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
          <View style={styles.instructionsContent}>
            <Text style={styles.instructionsTitle}>Como funciona?</Text>
            <Text style={styles.instructionsText}>
              • O botão de gravação aparece 15 minutos antes da consulta{'\n'}
              • Durante a consulta, o botão pisca para lembrar você{'\n'}
              • Você tem até 30 minutos após o início para gravar{'\n'}
              • Seus cuidadores serão notificados da gravação
            </Text>
          </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  appointmentCard: {
    backgroundColor: colors.backgroundLight,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 24,
    textAlign: 'center',
  },
  infoSection: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
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
  },
  audioPlayerSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  audioPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  audioPlayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  audioPlayerCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.success,
    marginBottom: 12,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  audioIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioDetails: {
    flex: 1,
  },
  audioLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  audioDuration: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
    marginBottom: 4,
  },
  audioDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  audioControls: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  audioInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.success + '20',
    padding: 12,
    borderRadius: 8,
  },
  audioInfoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  recordingSection: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.error,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  recordingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  recordingDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 20,
    lineHeight: 20,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  recordButtonBlinking: {
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonContent: {
    flex: 1,
  },
  recordButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 4,
  },
  recordButtonSubtitle: {
    fontSize: 12,
    color: colors.textWhite,
    opacity: 0.9,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    padding: 8,
    backgroundColor: colors.error + '20',
    borderRadius: 8,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '20',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.info,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
});

export default AppointmentDetailsScreen;

