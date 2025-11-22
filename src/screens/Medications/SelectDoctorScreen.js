import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../constants/colors';

const DOCTORS_STORAGE_KEY = '@lacos_doctors';

const SelectDoctorScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const doctorsJson = await AsyncStorage.getItem(DOCTORS_STORAGE_KEY);
      if (doctorsJson) {
        const allDoctors = JSON.parse(doctorsJson);
        const groupDoctors = allDoctors.filter(doc => doc.groupId === groupId);
        setDoctors(groupDoctors);
      }
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor) => {
    // TODO: Ir para tela de upload de receita
    Alert.alert(
      'Em desenvolvimento',
      'A funcionalidade de upload de receita será implementada em breve. Por enquanto, você pode cadastrar medicamentos sem prescrição.',
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  const handleAddNewDoctor = () => {
    Alert.alert(
      'Em desenvolvimento',
      'O cadastro de médicos será implementado em breve. Por enquanto, você pode cadastrar medicamentos sem prescrição.',
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  const handleSkipPrescription = () => {
    navigation.navigate('AddMedication', { 
      groupId, 
      groupName, 
      prescriptionId: null 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Selecionar Médico</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.question}>Qual médico prescreveu o medicamento?</Text>

          {/* Lista de Médicos */}
          {doctors.length > 0 ? (
            <>
              {doctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  style={styles.doctorCard}
                  onPress={() => handleSelectDoctor(doctor)}
                >
                  <View style={styles.doctorIcon}>
                    <Ionicons name="medical" size={32} color={colors.secondary} />
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                    {doctor.crm && (
                      <Text style={styles.doctorCrm}>CRM: {doctor.crm}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
                </TouchableOpacity>
              ))}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={64} color={colors.gray300} />
              <Text style={styles.emptyText}>Nenhum médico cadastrado</Text>
            </View>
          )}

          {/* Botão Adicionar Novo Médico */}
          <TouchableOpacity
            style={styles.addDoctorButton}
            onPress={handleAddNewDoctor}
          >
            <View style={styles.addDoctorIcon}>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </View>
            <View style={styles.addDoctorContent}>
              <Text style={styles.addDoctorTitle}>Cadastrar Novo Médico</Text>
              <Text style={styles.addDoctorSubtitle}>
                Adicionar médico e anexar receita
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Pular Prescrição */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipPrescription}
          >
            <Ionicons name="flash" size={20} color={colors.info} />
            <Text style={styles.skipButtonText}>
              Pular e cadastrar sem prescrição
            </Text>
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              Vincular a receita médica ajuda a manter o histórico organizado e facilita consultas futuras
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  question: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  doctorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
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
    marginBottom: 2,
  },
  doctorCrm: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 14,
    color: colors.textLight,
    marginHorizontal: 16,
  },
  addDoctorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    borderWidth: 2,
    borderColor: colors.primary + '40',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addDoctorIcon: {
    marginRight: 12,
  },
  addDoctorContent: {
    flex: 1,
  },
  addDoctorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  addDoctorSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.info,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.info + '10',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
});

export default SelectDoctorScreen;

