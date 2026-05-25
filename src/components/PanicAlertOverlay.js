import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import colors from '../constants/colors';
import { CallIcon } from './CustomIcons';
import { usePanicAlert } from '../contexts/PanicAlertContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PanicAlertOverlay = () => {
  const { activeEvent, disarming, disarmPanic, sourceLabel, isCaregiverView } = usePanicAlert();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!activeEvent) {
      pulseAnim.setValue(1);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [activeEvent, pulseAnim]);

  if (!activeEvent) {
    return null;
  }

  const patientName = activeEvent.user_name || 'Paciente';
  const locationLine = activeEvent.location_address
    || (activeEvent.latitude && activeEvent.longitude
      ? `${activeEvent.latitude}, ${activeEvent.longitude}`
      : null);

  const openMaps = () => {
    if (!activeEvent.latitude || !activeEvent.longitude) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${activeEvent.latitude},${activeEvent.longitude}`,
      android: `geo:${activeEvent.latitude},${activeEvent.longitude}?q=${activeEvent.latitude},${activeEvent.longitude}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  const handleDisarm = async () => {
    try {
      await disarmPanic();
    } catch {
      // erro já logado no contexto
    }
  };

  return (
    <Modal visible transparent={false} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        <Animated.View style={[styles.content, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.sosBadge}>
            <Text style={styles.sosText}>SOS</Text>
          </View>

          <Text style={styles.title}>🚨 PÂNICO ACIONADO</Text>

          <Text style={styles.subtitle}>
            {isCaregiverView
              ? `${patientName} acionou o pânico via ${sourceLabel}.`
              : 'Contatos de emergência foram notificados.'}
          </Text>

          {locationLine ? (
            <TouchableOpacity
              style={styles.locationBox}
              onPress={openMaps}
              activeOpacity={activeEvent.latitude ? 0.7 : 1}
            >
              <Text style={styles.locationLabel}>Localização</Text>
              <Text style={styles.locationText}>{locationLine}</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.hint}>
            O celular continuará vibrando e emitindo alerta sonoro até você desarmar o pânico.
          </Text>

          <TouchableOpacity
            style={[styles.disarmButton, disarming && styles.disarmButtonDisabled]}
            onPress={handleDisarm}
            disabled={disarming}
            activeOpacity={0.85}
          >
            {disarming ? (
              <ActivityIndicator color="#FF3B30" />
            ) : (
              <>
                <View style={styles.disarmIconWrap}>
                  <CallIcon size={22} color="#FF3B30" />
                </View>
                <Text style={styles.disarmText}>Desarmar pânico</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    gap: 18,
    width: '100%',
  },
  sosBadge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sosText: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    maxWidth: SCREEN_WIDTH - 48,
  },
  locationBox: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    maxWidth: SCREEN_WIDTH - 48,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    maxWidth: SCREEN_WIDTH - 56,
    lineHeight: 18,
  },
  disarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 16,
    minWidth: 220,
    justifyContent: 'center',
  },
  disarmButtonDisabled: {
    opacity: 0.85,
  },
  disarmIconWrap: {
    transform: [{ rotate: '135deg' }],
  },
  disarmText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF3B30',
  },
});

export default PanicAlertOverlay;
