import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

const TestModal = ({ visible, onClose, onConfirm }) => {
  const [testResult, setTestResult] = useState(null);

  const handleTest = () => {
    console.log('🧪 TestModal - Teste executado!');
    setTestResult('✅ Modal funcionando corretamente!');
    
    // Testar se onConfirm existe e é função
    if (typeof onConfirm === 'function') {
      console.log('🧪 TestModal - onConfirm é uma função, chamando...');
      onConfirm();
    } else {
      console.warn('⚠️ TestModal - onConfirm não é uma função');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>🧪 Modal de Teste</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.message}>
                Esta é uma modal de teste para verificar se as modais estão funcionando corretamente.
              </Text>
              
              {testResult && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultText}>{testResult}</Text>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.testButton]}
                  onPress={handleTest}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle" size={20} color={colors.textWhite} />
                  <Text style={styles.buttonText}>Testar Modal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.closeButtonStyle]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    lineHeight: 24,
  },
  resultContainer: {
    backgroundColor: colors.success + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  testButton: {
    backgroundColor: colors.primary,
  },
  closeButtonStyle: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
});

export default TestModal;




