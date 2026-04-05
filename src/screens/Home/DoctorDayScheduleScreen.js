import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import 'moment/locale/pt-br';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChevronBackIcon,
  CheckmarkCircleIcon,
  CloseCircleIcon,
  TrashOutlineIcon,
  LockClosedIcon,
  AddCircleOutlineIcon,
} from '../../components/CustomIcons';
import { appointmentMatchesLoggedInDoctor } from '../../utils/appointmentDoctorMatch';
import {
  teleconsultationSlotStillOccupied,
  getDoctorAgendaSlotBookingLabel,
  isTeleconsultAppointment,
} from '../../utils/teleconsultationHonorarium';

moment.locale('pt-br');

const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Horários ocupados neste dia + rótulo (pagamento / presencial). */
function buildBookedSlotsForDoctorDay(dateKey, dayAppointments, userId, nowMs = Date.now()) {
  const times = new Set();
  const labelByTime = new Map();
  if (!dayAppointments?.length || !userId) {
    return { times, labelByTime };
  }
  const currentDoctorId = Number(userId);
  dayAppointments.forEach((appointment) => {
    if (!appointment.appointment_date && !appointment.scheduled_at) return;
    const st = appointment.status;
    if (st === 'cancelled' || st === 'cancelada') return;
    const appointmentDate = appointment.appointment_date || appointment.scheduled_at;
    const appointmentDateObj = new Date(appointmentDate);
    if (formatDateKey(appointmentDateObj) !== dateKey) return;
    if (!appointmentMatchesLoggedInDoctor(appointment, currentDoctorId)) return;
    if (isTeleconsultAppointment(appointment) && !teleconsultationSlotStillOccupied(appointment, nowMs)) {
      return;
    }
    const hours = String(appointmentDateObj.getHours()).padStart(2, '0');
    const minutes = String(appointmentDateObj.getMinutes()).padStart(2, '0');
    const timeKey = `${hours}:${minutes}`;
    times.add(timeKey);
    if (!labelByTime.has(timeKey)) {
      labelByTime.set(timeKey, getDoctorAgendaSlotBookingLabel(appointment));
    }
  });
  return { times, labelByTime };
}

const DoctorDayScheduleScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    dateKey,
    dateMs,
    initialAvailableDays = [],
    initialBlockedDays = [],
    initialDaySchedules = {},
    dayAppointments = [],
  } = route.params || {};

  const displayDate = useMemo(() => new Date(dateMs || Date.now()), [dateMs]);

  const [availableDays, setAvailableDays] = useState(() => new Set(initialAvailableDays));
  const [blockedDays, setBlockedDays] = useState(() => new Set(initialBlockedDays));
  const [daySchedules, setDaySchedules] = useState(() => ({ ...initialDaySchedules }));

  const bookedSlots = useMemo(
    () => buildBookedSlotsForDoctorDay(dateKey, dayAppointments, user?.id),
    [dateKey, dayAppointments, user?.id]
  );
  const bookedTimes = bookedSlots.times;
  const bookedLabels = bookedSlots.labelByTime;

  const [selectedDayTimes, setSelectedDayTimes] = useState(() => {
    const { times: booked } = buildBookedSlotsForDoctorDay(dateKey, dayAppointments, user?.id);
    const availableTimes = initialDaySchedules[dateKey] || [];
    const all = new Set([...availableTimes, ...Array.from(booked)]);
    return Array.from(all).sort();
  });

  const pushDraftToHome = useCallback(
    (nextAvailableDays, nextBlockedDays, nextSchedules) => {
      navigation.navigate('HomeMain', {
        dayScheduleDraft: {
          availableDays: Array.from(nextAvailableDays),
          blockedDays: Array.from(nextBlockedDays),
          daySchedules: nextSchedules,
        },
      });
    },
    [navigation]
  );

  const getNextTimeSlot = (times) => {
    const normalizeTime = (t) => {
      if (!t) return '';
      const trimmed = t.trim();
      if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) return trimmed.substring(0, 5);
      return trimmed;
    };
    const existingTimesSet = new Set(times.map((t) => normalizeTime(t)));
    if (times.length === 0) return '08:00';
    const sortedTimes = [...times]
      .map((t) => normalizeTime(t))
      .filter((t) => /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(t))
      .sort();
    if (sortedTimes.length === 0) return '08:00';
    const lastTime = sortedTimes[sortedTimes.length - 1];
    const [hours, minutes] = lastTime.split(':').map(Number);
    let nextHours = hours + 1;
    let nextMinutes = minutes;
    let attempts = 0;
    const maxAttempts = 24;
    while (attempts < maxAttempts) {
      if (nextHours > 23) {
        nextHours = 8;
        nextMinutes = 0;
      }
      const candidateTime = `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
      if (!existingTimesSet.has(candidateTime)) return candidateTime;
      nextHours++;
      attempts++;
    }
    return null;
  };

  const addTimeSlot = () => {
    setSelectedDayTimes((prev) => {
      const nextTime = getNextTimeSlot(prev);
      if (nextTime === null) {
        Alert.alert(
          'Aviso',
          'Todos os horários do dia já estão cadastrados. Edite ou remova um horário antes de adicionar outro.'
        );
        return prev;
      }
      const normalizeTime = (t) => {
        if (!t) return '';
        const trimmed = t.trim();
        if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) return trimmed.substring(0, 5);
        return trimmed;
      };
      const normalizedNextTime = normalizeTime(nextTime);
      const exists = prev.some((t) => normalizeTime(t) === normalizedNextTime);
      if (exists) {
        Alert.alert('Aviso', `O horário ${nextTime} já está na lista.`);
        return prev;
      }
      return [...prev, nextTime];
    });
  };

  const removeTimeSlot = (index) => {
    const timeToRemove = selectedDayTimes[index];
    if (bookedTimes.has(timeToRemove)) {
      Alert.alert(
        'Horário Agendado',
        'Este horário não pode ser removido pois já possui uma consulta agendada.',
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedDayTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const formatTimeInput = (time) => {
    let formatted = time.replace(/\D/g, '');
    if (formatted.length >= 3) {
      formatted = formatted.substring(0, 2) + ':' + formatted.substring(2, 4);
    }
    return formatted.substring(0, 5);
  };

  const updateTimeSlot = (index, time) => {
    const currentTime = selectedDayTimes[index];
    if (bookedTimes.has(currentTime)) {
      Alert.alert(
        'Horário Agendado',
        'Este horário não pode ser editado pois já possui uma consulta agendada.',
        [{ text: 'OK' }]
      );
      return;
    }
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (time.length === 5 && timeRegex.test(time)) {
      const existingIndex = selectedDayTimes.findIndex((t, i) => i !== index && t === time);
      if (existingIndex !== -1) {
        Alert.alert('Aviso', 'Este horário já está cadastrado em outra linha.');
        return;
      }
      setSelectedDayTimes((prev) => {
        const next = [...prev];
        next[index] = time;
        return next;
      });
    } else if (time.length <= 5) {
      setSelectedDayTimes((prev) => {
        const next = [...prev];
        next[index] = time;
        return next;
      });
    }
  };

  const saveDaySchedule = () => {
    const newAvailableDays = new Set(availableDays);
    const newBlockedDays = new Set(blockedDays);
    const newSchedules = { ...daySchedules };

    const normalizeTime = (t) => {
      if (!t) return '';
      const trimmed = t.trim();
      if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) return trimmed.substring(0, 5);
      return trimmed;
    };

    const availableOnlyTimes = selectedDayTimes.filter((time) => {
      const normalizedTime = normalizeTime(time);
      return !bookedTimes.has(normalizedTime) && !bookedTimes.has(time);
    });

    if (availableOnlyTimes.length === 0) {
      newAvailableDays.delete(dateKey);
      delete newSchedules[dateKey];
    } else {
      const validTimes = [];
      const seenTimes = new Set();
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      for (const time of availableOnlyTimes) {
        if (!timeRegex.test(time)) continue;
        if (!seenTimes.has(time)) {
          validTimes.push(time);
          seenTimes.add(time);
        }
      }
      validTimes.sort();
      if (validTimes.length === 0) {
        newAvailableDays.delete(dateKey);
        delete newSchedules[dateKey];
      } else {
        newAvailableDays.add(dateKey);
        newBlockedDays.delete(dateKey);
        newSchedules[dateKey] = validTimes;
      }
    }

    pushDraftToHome(newAvailableDays, newBlockedDays, newSchedules);
  };

  const blockDay = () => {
    const newAvailableDays = new Set(availableDays);
    const newBlockedDays = new Set(blockedDays);
    const newSchedules = { ...daySchedules };
    newAvailableDays.delete(dateKey);
    newBlockedDays.add(dateKey);
    delete newSchedules[dateKey];
    pushDraftToHome(newAvailableDays, newBlockedDays, newSchedules);
  };

  if (!dateKey) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Data inválida.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronBackIcon size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle} numberOfLines={1}>
          Horários — {moment(displayDate).format('DD/MM/YYYY')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.scrollWrap}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(24, insets.bottom + 16) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator
          nestedScrollEnabled
          bounces
        >
        <Text style={styles.subtitle}>
          Defina os horários disponíveis para este dia. Toque em &quot;Adicionar horário&quot; para incluir uma linha.
        </Text>

        {selectedDayTimes.map((time, index) => {
          const normalizeTimeForComparison = (t) => {
            if (!t) return '';
            const trimmed = t.trim();
            if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) return trimmed.substring(0, 5);
            return trimmed;
          };
          const normalizedTime = normalizeTimeForComparison(time);
          const isBooked = bookedTimes.has(normalizedTime) || bookedTimes.has(time);
          const bookedStatusText =
            isBooked &&
            (bookedLabels.get(normalizedTime) ||
              bookedLabels.get(time) ||
              'Agendado');

          return (
            <View
              key={`slot-${dateKey}-${index}`}
              style={[styles.row, isBooked && styles.rowBooked]}
            >
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, isBooked && styles.inputBooked]}
                  value={time}
                  onChangeText={(text) => {
                    if (!isBooked) updateTimeSlot(index, formatTimeInput(text));
                  }}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.gray400}
                  keyboardType="numeric"
                  maxLength={5}
                  editable={!isBooked}
                />
                {isBooked && (
                  <View style={styles.bookedStatusRow}>
                    <LockClosedIcon size={14} color={colors.primary} />
                    <Text style={styles.bookedStatusLineText} numberOfLines={2}>
                      {bookedStatusText}
                    </Text>
                  </View>
                )}
              </View>
              {!isBooked ? (
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeTimeSlot(index)}>
                  <TrashOutlineIcon size={20} color={colors.error} />
                </TouchableOpacity>
              ) : (
                <View style={styles.lockIcon}>
                  <LockClosedIcon size={20} color={colors.primary} />
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.addBtn} onPress={addTimeSlot} activeOpacity={0.7}>
          <AddCircleOutlineIcon size={24} color={colors.primary} />
          <Text style={styles.addBtnText}>Adicionar horário</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.blockBtn]} onPress={blockDay} activeOpacity={0.85}>
            <CloseCircleIcon size={20} color={colors.textWhite} />
            <Text style={styles.actionBtnText}>Bloquear dia</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={saveDaySchedule} activeOpacity={0.85}>
            <CheckmarkCircleIcon size={20} color={colors.textWhite} />
            <Text style={styles.actionBtnText}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          As alterações ficam neste aparelho até você tocar em &quot;Salvar agenda&quot; na tela da agenda.
        </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: colors.background,
  },
  /** View com minHeight: 0 para o ScrollView receber altura limitada e poder rolar (flex no RN) */
  scrollWrap: {
    flex: 1,
    minHeight: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 20,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rowBooked: {
    opacity: 0.95,
  },
  inputWrap: {
    flex: 1,
    position: 'relative',
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  inputBooked: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
    borderWidth: 2,
    color: colors.primary,
    fontWeight: '600',
  },
  bookedStatusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  bookedStatusLineText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 18,
  },
  removeBtn: {
    padding: 12,
    backgroundColor: colors.error + '20',
    borderRadius: 12,
  },
  lockIcon: {
    padding: 12,
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  blockBtn: {
    backgroundColor: colors.error,
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  actionBtnText: {
    color: colors.textWhite,
    fontWeight: '600',
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 18,
  },
  errorText: {
    padding: 20,
    color: colors.error,
  },
});

export default DoctorDayScheduleScreen;
