import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';

const APPOINTMENT_RECORDINGS_KEY = '@lacos_appointment_recordings';

const RecordingScreen = ({ route, navigation }) => {
  const { appointment } = route.params || {};
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startRecording();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      startAnimations();
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording, isPaused]);

  const startAnimations = () => {
    // Animação de pulso do microfone
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animação das ondas
    [waveAnim1, waveAnim2, waveAnim3].forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 300),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'É necessário permitir o acesso ao microfone para gravar.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      Alert.alert(
        'Erro',
        'Não foi possível iniciar a gravação',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        await recording.startAsync();
        setIsPaused(false);
      } else {
        await recording.pauseAsync();
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Erro ao pausar/retomar:', error);
    }
  };

  const handleFinish = () => {
    Alert.alert(
      'Finalizar Gravação?',
      'Deseja finalizar e salvar esta gravação?',
      [
        { text: 'Continuar Gravando', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            try {
              await recording.stopAndUnloadAsync();
              const uri = recording.getURI();
              
              // Salvar gravação vinculada à consulta no AsyncStorage
              if (appointment && appointment.id && uri) {
                try {
                  const recordingsJson = await AsyncStorage.getItem(APPOINTMENT_RECORDINGS_KEY);
                  const recordings = recordingsJson ? JSON.parse(recordingsJson) : {};
                  
                  recordings[appointment.id] = {
                    uri: uri,
                    duration: recordingTime,
                    recordedAt: new Date().toISOString(),
                    appointmentTitle: appointment.title,
                    appointmentTime: appointment.time,
                  };
                  
                  await AsyncStorage.setItem(APPOINTMENT_RECORDINGS_KEY, JSON.stringify(recordings));
                  
                  console.log('Gravação salva:', recordings[appointment.id]);
                  
                  Toast.show({
                    type: 'success',
                    text1: 'Gravação Salva! ✅',
                    text2: `Áudio de ${formatTime(recordingTime)} salvo com sucesso`,
                    position: 'top',
                  });
                } catch (storageError) {
                  console.error('Erro ao salvar no AsyncStorage:', storageError);
                }
              }
              
              setIsRecording(false);
              
              // Voltar para a tela de detalhes da consulta
              setTimeout(() => {
                navigation.navigate('AppointmentDetails', { 
                  appointment: appointment,
                  recordingJustSaved: true,
                });
              }, 800);
            } catch (error) {
              console.error('Erro ao finalizar:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível salvar a gravação',
                position: 'bottom',
              });
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Gravação?',
      'A gravação será descartada. Deseja continuar?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (recording) {
                await recording.stopAndUnloadAsync();
              }
              navigation.goBack();
            } catch (error) {
              console.error('Erro ao cancelar:', error);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Ionicons name="close" size={28} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gravando Consulta</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Appointment Info */}
        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentTitle}>{appointment?.title}</Text>
          <Text style={styles.appointmentTime}>{appointment?.time}</Text>
        </View>

        {/* Recording Animation */}
        <View style={styles.animationContainer}>
          {/* Ondas de som */}
          <Animated.View
            style={[
              styles.wave,
              styles.wave1,
              {
                opacity: waveAnim1,
                transform: [
                  {
                    scale: waveAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2.5],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              styles.wave2,
              {
                opacity: waveAnim2,
                transform: [
                  {
                    scale: waveAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              styles.wave3,
              {
                opacity: waveAnim3,
                transform: [
                  {
                    scale: waveAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.5],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* Microfone central */}
          <Animated.View
            style={[
              styles.microphoneContainer,
              {
                transform: [{ scale: isPaused ? 1 : pulseAnim }],
              },
            ]}
          >
            <View style={styles.microphoneCircle}>
              <Ionicons 
                name={isPaused ? "pause" : "mic"} 
                size={64} 
                color={colors.textWhite} 
              />
            </View>
          </Animated.View>

          {/* Status */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, !isPaused && styles.statusDotActive]} />
            <Text style={styles.statusText}>
              {isPaused ? 'Pausado' : 'Gravando...'}
            </Text>
          </View>
        </View>

        {/* Timer */}
        <Text style={styles.timer}>{formatTime(recordingTime)}</Text>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePauseResume}
          >
            <Ionicons 
              name={isPaused ? "play" : "pause"} 
              size={32} 
              color={colors.textWhite} 
            />
            <Text style={styles.controlButtonText}>
              {isPaused ? 'Continuar' : 'Pausar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.finishButton]}
            onPress={handleFinish}
          >
            <Ionicons name="checkmark-circle" size={32} color={colors.textWhite} />
            <Text style={styles.controlButtonText}>Finalizar</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textWhite} opacity={0.7} />
          <Text style={styles.instructionsText}>
            Fale sobre a consulta. Seus cuidadores receberão esta gravação.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.error,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textWhite,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  appointmentInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appointmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 8,
    textAlign: 'center',
  },
  appointmentTime: {
    fontSize: 16,
    color: colors.textWhite,
    opacity: 0.8,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  wave: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.textWhite,
  },
  wave1: {
    borderWidth: 3,
  },
  wave2: {
    borderWidth: 2,
  },
  wave3: {
    borderWidth: 1,
  },
  microphoneContainer: {
    zIndex: 10,
  },
  microphoneCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.textWhite,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 30,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  statusDotActive: {
    backgroundColor: colors.textWhite,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.textWhite,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    minWidth: 120,
  },
  finishButton: {
    backgroundColor: colors.success,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite,
    marginTop: 8,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  instructionsText: {
    fontSize: 13,
    color: colors.textWhite,
    opacity: 0.8,
    textAlign: 'center',
    flex: 1,
  },
});

export default RecordingScreen;

