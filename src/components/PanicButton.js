import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import colors from '../constants/colors';
import panicService from '../services/panicService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HOLD_DURATION = 5000; // 5 segundos

const PanicButton = ({ groupId, onPanicTriggered }) => {
  const [isHolding, setIsHolding] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentPanicEvent, setCurrentPanicEvent] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [callStartTime, setCallStartTime] = useState(null);

  const holdProgress = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animação de pulso quando chamada está ativa
  useEffect(() => {
    if (isCallActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCallActive]);

  const handlePressIn = () => {
    setIsHolding(true);

    // Animação de expansão progressiva
    Animated.parallel([
      Animated.timing(holdProgress, {
        toValue: 1,
        duration: HOLD_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 10, // Expande 10x para cobrir a tela
        duration: HOLD_DURATION,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        triggerPanic();
      }
    });
  };

  const handlePressOut = () => {
    if (!isCallActive) {
      setIsHolding(false);
      
      // Resetar animações
      Animated.parallel([
        Animated.timing(holdProgress, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const triggerPanic = async () => {
    try {
      // Obter localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      let location = null;
      let locationAddress = null;

      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        location = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };

        // Tentar obter endereço
        try {
          const [address] = await Location.reverseGeocodeAsync(location);
          if (address) {
            locationAddress = `${address.street || ''} ${address.streetNumber || ''}, ${address.district || ''}, ${address.city || ''} - ${address.region || ''}`.trim();
          }
        } catch (error) {
          console.log('Erro ao obter endereço:', error);
        }
      }

      // Acionar pânico na API
      const response = await panicService.trigger({
        group_id: groupId,
        trigger_type: 'manual',
        latitude: location?.latitude,
        longitude: location?.longitude,
        location_address: locationAddress,
      });

      if (response.success) {
        setCurrentPanicEvent(response.data.panic_event);
        setEmergencyContacts(response.data.emergency_contacts);
        setIsCallActive(true);
        setCallStartTime(Date.now());
        setIsHolding(false);

        // Resetar animação de escala
        scaleAnim.setValue(1);
        holdProgress.setValue(0);

        // Notificar parent component
        if (onPanicTriggered) {
          onPanicTriggered(response.data);
        }

        // Iniciar chamada para o primeiro contato de emergência
        if (response.data.emergency_contacts.length > 0) {
          const firstContact = response.data.emergency_contacts[0];
          if (firstContact.user?.phone) {
            makeEmergencyCall(firstContact.user.phone);
          }
        }

        Toast.show({
          type: 'error',
          text1: '🚨 PÂNICO ACIONADO',
          text2: 'Chamando contatos de emergência...',
          position: 'top',
          visibilityTime: 5000,
        });
      }
    } catch (error) {
      console.error('Erro ao acionar pânico:', error);
      setIsHolding(false);
      scaleAnim.setValue(1);
      holdProgress.setValue(0);

      Toast.show({
        type: 'error',
        text1: 'Erro ao acionar pânico',
        text2: error.message || 'Tente novamente',
      });
    }
  };

  const makeEmergencyCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Erro', 'Não foi possível iniciar a chamada');
        }
      })
      .catch((err) => console.error('Erro ao fazer chamada:', err));
  };

  const endCall = async () => {
    if (!currentPanicEvent) return;

    const callDuration = Math.floor((Date.now() - callStartTime) / 1000);

    try {
      await panicService.endCall(currentPanicEvent.id, {
        status: 'completed',
        duration: callDuration,
      });

      setIsCallActive(false);
      setCurrentPanicEvent(null);
      setEmergencyContacts([]);
      setCallStartTime(null);

      Toast.show({
        type: 'success',
        text1: 'Chamada finalizada',
        text2: `Duração: ${callDuration}s`,
      });
    } catch (error) {
      console.error('Erro ao finalizar chamada:', error);
    }
  };

  // Interpolação de cor do vermelho para vermelho mais escuro
  const backgroundColor = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FF3B30', '#C70000'],
  });

  // Tamanho do botão durante hold
  const buttonSize = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [80, SCREEN_WIDTH * 2],
  });

  if (isCallActive) {
    return (
      <View style={styles.callActiveContainer}>
        <Animated.View
          style={[
            styles.callActiveContent,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.sosIconContainer}>
            <Text style={styles.sosText}>SOS</Text>
          </View>
          <Text style={styles.callActiveTitle}>Chamada de Emergência Ativa</Text>
          <Text style={styles.callActiveSubtitle}>
            {emergencyContacts.length > 0
              ? `Conectado: ${emergencyContacts[0].user?.name || 'Contato de emergência'}`
              : 'Conectando...'}
          </Text>
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={endCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={24} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
            <Text style={styles.endCallText}>Desligar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.buttonWrapper}
      >
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor,
              width: buttonSize,
              height: buttonSize,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {isHolding && (
            <View style={styles.holdContent}>
              <Text style={styles.holdText}>SEGURE PARA</Text>
              <Text style={styles.holdTextBold}>ACIONAR PÂNICO</Text>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: holdProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          )}
          {!isHolding && (
            <View style={styles.defaultContent}>
              <Ionicons name="warning" size={32} color={colors.white} />
              <Text style={styles.buttonText}>SOS</Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
      
      {isHolding && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Solte para cancelar</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  defaultContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 1,
  },
  holdContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  holdText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
    textAlign: 'center',
  },
  holdTextBold: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
  },
  hint: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
  // Estilos para chamada ativa
  callActiveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  callActiveContent: {
    alignItems: 'center',
    gap: 20,
  },
  sosIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sosText: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 4,
  },
  callActiveTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  callActiveSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  endCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  endCallText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30',
  },
});

export default PanicButton;

