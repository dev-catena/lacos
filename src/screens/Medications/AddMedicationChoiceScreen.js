import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

const AddMedicationChoiceScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;

  const handleWithPrescription = () => {
    navigation.navigate('SelectDoctor', { groupId, groupName });
  };

  const handleWithoutPrescription = () => {
    navigation.navigate('AddMedication', { groupId, groupName, prescriptionId: null });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
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
          <Text style={styles.title}>Adicionar Remédio</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.question}>Como deseja cadastrar?</Text>

        {/* Opção: Com Receita */}
        <TouchableOpacity
          style={[styles.optionCard, styles.prescriptionCard]}
          onPress={handleWithPrescription}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="document-text" size={48} color={colors.secondary} />
          </View>
          <Text style={styles.optionTitle}>Adicionar Receita</Text>
          <Text style={styles.optionDescription}>
            Vincular remédios a uma receita médica. Você poderá fotografar ou enviar o documento.
          </Text>
          <View style={styles.optionBadge}>
            <Ionicons name="camera" size={16} color={colors.secondary} />
            <Text style={[styles.optionBadgeText, { color: colors.secondary }]}>
              Com prescrição médica
            </Text>
          </View>
        </TouchableOpacity>

        {/* Opção: Sem Receita */}
        <TouchableOpacity
          style={[styles.optionCard, styles.noPrescriptionCard]}
          onPress={handleWithoutPrescription}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="add-circle" size={48} color={colors.primary} />
          </View>
          <Text style={styles.optionTitle}>Cadastrar sem Prescrição</Text>
          <Text style={styles.optionDescription}>
            Adicionar medicamentos de uso contínuo ou orientações diretas, sem vincular a receita.
          </Text>
          <View style={styles.optionBadge}>
            <Ionicons name="flash" size={16} color={colors.primary} />
            <Text style={[styles.optionBadgeText, { color: colors.primary }]}>
              Cadastro rápido
            </Text>
          </View>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            Você poderá editar ou adicionar mais informações depois de salvar
          </Text>
        </View>
      </View>
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  question: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  prescriptionCard: {
    borderColor: colors.secondary + '40',
  },
  noPrescriptionCard: {
    borderColor: colors.primary + '40',
  },
  optionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  optionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  optionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.info + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 'auto',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
});

export default AddMedicationChoiceScreen;

