import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import colors from '../../constants/colors';
import { LacosLogoFull } from '../../components/LacosLogo';

const PROFILES = [
  {
    id: 'caregiver',
    title: 'Amigo / Cuidador',
    description: 'Vou cuidar ou acompanhar alguém',
    color: colors.primary,
    icon: ({ size, color: c }) => (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={c}
        />
      </Svg>
    ),
  },
  {
    id: 'kids',
    title: 'Kids',
    description: 'Sou responsável por uma criança',
    color: '#f59e0b',
    icon: ({ size, color: c }) => (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="7" r="4" fill={c} />
        <Path d="M5 21v-1a7 7 0 0 1 14 0v1" fill={c} />
        <Path d="M9 11l-2 2 2 2M15 11l2 2-2 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    ),
  },
  {
    id: 'accompanied',
    title: 'Sou Paciente',
    description: 'Serei acompanhado por cuidadores',
    color: colors.secondary,
    icon: ({ size, color: c }) => (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="4" fill={c} />
        <Path
          d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
          stroke={c}
          strokeWidth="2"
          fill="none"
        />
      </Svg>
    ),
  },
  {
    id: 'professional_caregiver',
    title: 'Cuidador Profissional',
    description: 'Trabalho como cuidador remunerado',
    color: colors.success,
    icon: ({ size, color: c }) => (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L2 7l10 5 10-5-10-5z" fill={c} />
        <Path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke={c} strokeWidth="1.5" fill="none" />
      </Svg>
    ),
  },
  {
    id: 'doctor',
    title: 'Médico',
    description: 'Sou profissional de saúde',
    color: '#4A90E2',
    icon: ({ size, color: c }) => (
      <Ionicons name="medical-outline" size={size} color={c} />
    ),
  },
];

const RegisterChooseProfileScreen = ({ navigation }) => {
  const handleSelect = (profileId) => {
    navigation.navigate('Register', { selectedProfile: profileId });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.logoWrap}>
          <LacosLogoFull width={120} height={38} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Como você vai usar o Lacos?</Text>
        <Text style={styles.subtitle}>
          Escolha o perfil que melhor descreve você. Ele define quais recursos estarão disponíveis.
        </Text>

        <View style={styles.grid}>
          {PROFILES.map((p) => {
            const IconComp = p.icon;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.card, { borderColor: p.color + '40' }]}
                activeOpacity={0.75}
                onPress={() => handleSelect(p.id)}
              >
                <View style={[styles.iconCircle, { backgroundColor: p.color + '18' }]}>
                  <IconComp size={32} color={p.color} />
                </View>
                <Text style={[styles.cardTitle, { color: p.color }]}>{p.title}</Text>
                <Text style={styles.cardDesc}>{p.description}</Text>
                <View style={[styles.cardBtn, { backgroundColor: p.color }]}>
                  <Text style={styles.cardBtnText}>Selecionar</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.background },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.backgroundLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:     { padding: 4, width: 40 },
  logoWrap:    { alignItems: 'center' },

  scroll:      { padding: 20, paddingBottom: 40 },
  title:       { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle:    { fontSize: 14, color: colors.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 28 },

  grid:        { gap: 14 },
  card:        { backgroundColor: colors.backgroundLight, borderRadius: 16, borderWidth: 1.5, padding: 20, alignItems: 'center', gap: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  iconCircle:  { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center' },
  cardTitle:   { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  cardDesc:    { fontSize: 13, color: colors.textLight, textAlign: 'center', lineHeight: 18 },
  cardBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginTop: 4 },
  cardBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});

export default RegisterChooseProfileScreen;
