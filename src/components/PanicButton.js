import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import colors from '../constants/colors';
import panicService from '../services/panicService';
import { usePanicAlert } from '../contexts/PanicAlertContext';
import { NotificationIcon } from './CustomIcons';

const HOLD_DURATION = 5000; // 5 segundos

const PanicButton = ({ groupId, onPanicTriggered, fullSize = false }) => {
  const { activateFromTrigger } = usePanicAlert();
  const [isHolding, setIsHolding] = useState(false);

  const holdProgress = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sirenBlink = useRef(new Animated.Value(1)).current;

  // Animação de piscar da sirene quando botão está idle
  useEffect(() => {
    if (!isHolding) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sirenBlink, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(sirenBlink, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      sirenBlink.setValue(1);
    }
  }, [isHolding]);

  const handlePressIn = () => {
    setIsHolding(true);

    // Animação de expansão progressiva
    Animated.parallel([
      Animated.timing(holdProgress, {
        toValue: 1,
        duration: HOLD_DURATION,
        useNativeDriver: true,
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
    setIsHolding(false);

    Animated.parallel([
      Animated.timing(holdProgress, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
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
        setIsHolding(false);
        scaleAnim.setValue(1);
        holdProgress.setValue(0);

        activateFromTrigger(response.data);

        if (onPanicTriggered) {
          onPanicTriggered(response.data);
        }

        if (response.data.emergency_contacts.length > 0) {
          const firstContact = response.data.emergency_contacts[0];
          // Pode vir de emergency_contacts (tem emergency_contact.phone) ou group_members (tem user.phone)
          const phoneNumber = firstContact.user?.phone || firstContact.emergency_contact?.phone;
          if (phoneNumber) {
            console.log('📞 PanicButton - Ligando para contato SOS:', {
              name: firstContact.user?.name || firstContact.emergency_contact?.name,
              phone: phoneNumber,
              type: firstContact.type || 'unknown'
            });
            makeEmergencyCall(phoneNumber);
          } else {
            console.warn('⚠️ PanicButton - Contato SOS sem telefone:', firstContact);
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

  const backgroundColor = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FF3B30', '#C70000'],
  });

  // Removido buttonSize interpolado - agora usa apenas scale transform

  return (
    <View style={fullSize ? styles.containerFull : styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={fullSize ? styles.buttonWrapperFull : styles.buttonWrapper}
      >
        {/* Fundo que escala */}
        <Animated.View
          style={[
            fullSize ? styles.buttonBackgroundFull : styles.buttonBackground,
            {
              backgroundColor,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
        
        {/* Conteúdo que NÃO escala */}
        <Animated.View
          style={[
            isHolding ? styles.buttonContentHolding : styles.buttonContent,
            {
              opacity: scaleAnim.interpolate({
                inputRange: [1, 3],
                outputRange: [1, 0], // Fade out quando escala muito
                extrapolate: 'clamp',
              }),
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
                      transform: [
                        { scaleX: holdProgress },
                        { translateX: holdProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-60, 0], // -50% de 120 (width da barra)
                          })
                        }
                      ],
                    },
                  ]}
                />
              </View>
            </View>
          )}
          {!isHolding && (
            <View style={styles.defaultContent}>
              <Animated.View style={{ opacity: sirenBlink }}>
                <NotificationIcon size={32} color="#FFFFFF" filled={true} />
              </Animated.View>
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
  containerFull: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapperFull: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBackground: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonBackgroundFull: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    width: 80,
    height: 80,
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  buttonContentHolding: {
    minWidth: 200,
    minHeight: 200,
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
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
    gap: 4,
    width: 200,
  },
  holdText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  holdTextBold: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1,
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
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 2,
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
});

export default PanicButton;

