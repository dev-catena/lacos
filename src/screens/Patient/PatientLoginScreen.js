import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../constants/colors';
import { LacosLogoFull } from '../../components/LacosLogo';

const GROUPS_STORAGE_KEY = '@lacos_groups';
const PATIENT_SESSION_KEY = '@lacos_patient_session';

const PatientLoginScreen = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCodeChange = (text) => {
    // Aceitar apenas letras e números, converter para maiúsculas
    const cleanCode = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(cleanCode);
  };

  const debugShowCodes = async () => {
    try {
      const groupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      if (groupsJson) {
        const groups = JSON.parse(groupsJson);
        const groupList = groups.map((g, index) => 
          `${index + 1}. ${g.groupName}\n   Código: ${g.code}\n   Criado: ${new Date(g.createdAt).toLocaleString('pt-BR')}`
        ).join('\n\n');
        
        Alert.alert(
          'Grupos Disponíveis',
          `Total: ${groups.length} grupo(s)\n\n${groupList}`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Limpar Grupos Antigos',
              style: 'destructive',
              onPress: () => confirmClearOldGroups(groups)
            },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Debug', 'Nenhum grupo encontrado no AsyncStorage');
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const confirmClearOldGroups = (groups) => {
    Alert.alert(
      'Limpar Grupos Antigos?',
      `Você tem ${groups.length} grupo(s). Deseja manter apenas o mais recente?\n\nIsso pode ajudar a resolver o problema do código.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Manter Apenas o Mais Recente',
          style: 'destructive',
          onPress: async () => {
            try {
              // Ordenar por data de criação e manter só o mais recente
              const sortedGroups = [...groups].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
              );
              const newestGroup = [sortedGroups[0]];
              
              await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(newestGroup));
              
              Alert.alert(
                'Sucesso!',
                `Mantido apenas: ${newestGroup[0].groupName}\nCódigo: ${newestGroup[0].code}\n\nAgora tente fazer login com este código.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Erro', error.message);
            }
          }
        }
      ]
    );
  };

  const handleLogin = async () => {
    if (!code || code.length < 6) {
      Alert.alert('Erro', 'Por favor, insira um código válido');
      return;
    }

    setLoading(true);

    try {
      // Buscar grupos salvos
      const groupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      
      console.log('Código digitado:', code);
      console.log('Grupos encontrados:', groupsJson);
      
      if (!groupsJson) {
        Alert.alert(
          'Código Inválido', 
          'Nenhum grupo foi encontrado. Peça ao seu cuidador para criar um grupo primeiro.'
        );
        setLoading(false);
        return;
      }

      const groups = JSON.parse(groupsJson);
      console.log('Grupos parseados:', groups);
      console.log('Códigos disponíveis:', groups.map(g => g.code));
      
      // Buscar com código em maiúsculas e sem espaços
      const matchingGroup = groups.find(g => {
        const groupCode = g.code?.toUpperCase().trim();
        const inputCode = code.toUpperCase().trim();
        console.log(`Comparando: "${groupCode}" com "${inputCode}"`);
        return groupCode === inputCode;
      });

      console.log('Grupo encontrado:', matchingGroup);

      if (!matchingGroup) {
        Alert.alert(
          'Código Não Encontrado', 
          `O código "${code}" não foi encontrado.\n\nExistem ${groups.length} grupo(s) cadastrado(s).\n\nDica: Clique no botão "Ver Códigos Disponíveis" abaixo para ver todos os códigos.\n\nSe você tem vários grupos antigos, pode limpá-los e manter apenas o mais recente.`
        );
        setLoading(false);
        return;
      }

      // Salvar sessão do paciente
      const patientSession = {
        groupId: matchingGroup.id,
        groupName: matchingGroup.groupName,
        accompaniedName: matchingGroup.accompaniedName,
        loginTime: new Date().toISOString(),
      };

      await AsyncStorage.setItem(PATIENT_SESSION_KEY, JSON.stringify(patientSession));

      // Navegar para o app do paciente
      navigation.reset({
        index: 0,
        routes: [{ name: 'PatientApp' }],
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LacosLogoFull width={180} height={56} />
          </View>

          <Text style={styles.title}>Acesso do Paciente</Text>
          <Text style={styles.subtitle}>
            Digite o código fornecido pelo seu cuidador
          </Text>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={24} color={colors.primary} />
              <TextInput
                style={styles.codeInput}
                placeholder="Digite o código"
                value={code}
                onChangeText={handleCodeChange}
                autoCapitalize="characters"
                maxLength={10}
                autoFocus
              />
            </View>
            <Text style={styles.codeHint}>
              O código tem entre 6 e 10 caracteres
            </Text>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Como obter o código?</Text>
              <Text style={styles.infoText}>
                Peça ao seu cuidador para compartilhar o código que foi gerado quando ele criou seu grupo de cuidados.
              </Text>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading || code.length < 6}
          >
            {loading ? (
              <Text style={styles.loginButtonText}>Entrando...</Text>
            ) : (
              <>
                <Text style={styles.loginButtonText}>Entrar</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.textWhite} />
              </>
            )}
          </TouchableOpacity>

          {/* Botão Debug - TEMPORÁRIO */}
          <TouchableOpacity
            style={styles.debugButton}
            onPress={debugShowCodes}
          >
            <Ionicons name="bug-outline" size={16} color={colors.info} />
            <Text style={styles.debugButtonText}>Ver Códigos Disponíveis (Debug)</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  codeContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: 20,
    height: 64,
    gap: 12,
  },
  codeInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 2,
  },
  codeHint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 16,
  },
  debugButtonText: {
    color: colors.info,
    fontSize: 14,
  },
});

export default PatientLoginScreen;

