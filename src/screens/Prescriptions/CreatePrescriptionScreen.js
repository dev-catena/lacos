import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import SafeIcon from '../../components/SafeIcon';

const CreatePrescriptionScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const insets = useSafeAreaInsets();

  const handleLaunchMedication = () => {
    try {
      // Função auxiliar para encontrar o navigator raiz
      const findRootNavigator = (nav) => {
        let current = nav;
        let parent = nav.getParent();
        while (parent) {
          current = parent;
          parent = parent.getParent();
        }
        return current;
      };

      // Tentar encontrar o navigator raiz
      const rootNavigator = findRootNavigator(navigation);
      
      // Tentar navegar pelo navigator raiz primeiro
      if (rootNavigator && rootNavigator !== navigation) {
        try {
          rootNavigator.navigate('AddMedication', { 
            groupId, 
            groupName,
            prescriptionId: null,
          });
          return;
        } catch (rootError) {
          console.log('⚠️ Não foi possível navegar pelo root navigator:', rootError.message);
        }
      }

      // Tentar navegar através do navigator pai
      const parent = navigation.getParent();
      if (parent && parent !== navigation) {
        try {
          parent.navigate('AddMedication', { 
            groupId, 
            groupName,
            prescriptionId: null,
          });
          return;
        } catch (parentError) {
          console.log('⚠️ Não foi possível navegar pelo parent:', parentError.message);
        }
      }

      // Tentar navegar diretamente
      try {
        navigation.navigate('AddMedication', { 
          groupId, 
          groupName,
          prescriptionId: null,
        });
        return;
      } catch (directError) {
        console.log('⚠️ Não foi possível navegar diretamente:', directError.message);
      }

      // Último recurso: usar dispatch com CommonActions
      navigation.dispatch(
        CommonActions.navigate({
          name: 'AddMedication',
          params: { 
            groupId, 
            groupName,
            prescriptionId: null,
          },
        })
      );
    } catch (error) {
      console.error('❌ Erro ao navegar para AddMedication:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Nova Receita</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Conteúdo */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <SafeIcon name="document-text" size={64} color={colors.primary} />
        </View>
        
        <Text style={styles.title}>Criar Nova Receita</Text>
        <Text style={styles.subtitle}>
          Adicione medicamentos à receita médica
        </Text>

        <TouchableOpacity
          style={styles.launchButton}
          onPress={handleLaunchMedication}
          activeOpacity={0.8}
        >
          <SafeIcon name="medical-outline" size={24} color={colors.white} />
          <Text style={styles.launchButtonText}>Lançar Medicamento</Text>
        </TouchableOpacity>
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray400,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  launchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  launchButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
});

export default CreatePrescriptionScreen;

