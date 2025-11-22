import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

const MEDICATIONS_STORAGE_KEY = '@lacos_medications';
const DOSE_HISTORY_STORAGE_KEY = '@lacos_dose_history';

/**
 * Gera relatório de adesão à medicação
 */
export const generateAdhesionReport = async (groupId, startDate, endDate) => {
  try {
    // Carregar medicamentos do grupo
    const medsJson = await AsyncStorage.getItem(MEDICATIONS_STORAGE_KEY);
    if (!medsJson) {
      throw new Error('Nenhum medicamento encontrado');
    }
    const allMeds = JSON.parse(medsJson);
    const groupMeds = allMeds.filter(m => m.groupId === groupId);

    // Carregar histórico de doses
    const historyJson = await AsyncStorage.getItem(DOSE_HISTORY_STORAGE_KEY);
    const allHistory = historyJson ? JSON.parse(historyJson) : [];

    // Filtrar histórico pelo período
    const start = new Date(startDate);
    const end = new Date(endDate);
    const filteredHistory = allHistory.filter(h => {
      const recordDate = new Date(h.takenAt);
      return recordDate >= start && recordDate <= end;
    });

    // Calcular estatísticas por medicamento
    const medicationStats = groupMeds.map(med => {
      const medHistory = filteredHistory.filter(h => h.medicationId === med.id);
      
      const taken = medHistory.filter(h => h.status === 'taken').length;
      const notAdministered = medHistory.filter(h => h.status === 'not_administered').length;
      const total = medHistory.length;
      const adhesionRate = total > 0 ? ((taken / total) * 100).toFixed(1) : 0;

      return {
        name: med.name,
        dosage: `${med.dosage} ${med.unit}`,
        form: med.form,
        frequency: med.frequency,
        taken,
        notAdministered,
        total,
        adhesionRate,
      };
    });

    // Calcular estatísticas gerais
    const totalDoses = medicationStats.reduce((sum, stat) => sum + stat.total, 0);
    const totalTaken = medicationStats.reduce((sum, stat) => sum + stat.taken, 0);
    const totalNotAdministered = medicationStats.reduce((sum, stat) => sum + stat.notAdministered, 0);
    const overallAdhesionRate = totalDoses > 0 ? ((totalTaken / totalDoses) * 100).toFixed(1) : 0;

    return {
      period: {
        start: start.toLocaleDateString('pt-BR'),
        end: end.toLocaleDateString('pt-BR'),
      },
      overall: {
        totalDoses,
        totalTaken,
        totalNotAdministered,
        adhesionRate: overallAdhesionRate,
      },
      medications: medicationStats,
      generatedAt: new Date().toLocaleString('pt-BR'),
    };
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    throw error;
  }
};

/**
 * Formata o relatório em texto para compartilhamento
 */
export const formatReportAsText = (report, groupName, patientName) => {
  let text = `📊 RELATÓRIO DE ADESÃO À MEDICAÇÃO\n`;
  text += `═══════════════════════════════════\n\n`;
  text += `👤 Paciente: ${patientName}\n`;
  text += `🏥 Grupo: ${groupName}\n`;
  text += `📅 Período: ${report.period.start} a ${report.period.end}\n`;
  text += `🕒 Gerado em: ${report.generatedAt}\n\n`;
  
  text += `📈 RESUMO GERAL\n`;
  text += `─────────────────────────────────\n`;
  text += `Total de doses: ${report.overall.totalDoses}\n`;
  text += `✅ Tomadas: ${report.overall.totalTaken}\n`;
  text += `❌ Não administradas: ${report.overall.totalNotAdministered}\n`;
  text += `📊 Taxa de adesão: ${report.overall.adhesionRate}%\n\n`;

  text += `💊 DETALHES POR MEDICAMENTO\n`;
  text += `═══════════════════════════════════\n\n`;

  report.medications.forEach((med, index) => {
    text += `${index + 1}. ${med.name}\n`;
    text += `   Dosagem: ${med.dosage} - ${med.form}\n`;
    text += `   Total de doses: ${med.total}\n`;
    text += `   ✅ Tomadas: ${med.taken}\n`;
    text += `   ❌ Não administradas: ${med.notAdministered}\n`;
    text += `   📊 Adesão: ${med.adhesionRate}%\n\n`;
  });

  text += `─────────────────────────────────\n`;
  text += `Relatório gerado pelo App Laços\n`;
  
  return text;
};

/**
 * Compartilha o relatório via WhatsApp
 */
export const shareViaWhatsApp = async (report, groupName, patientName, phoneNumber = null) => {
  try {
    const text = formatReportAsText(report, groupName, patientName);
    const encodedText = encodeURIComponent(text);
    
    let url = `whatsapp://send?text=${encodedText}`;
    if (phoneNumber) {
      // Remove caracteres não numéricos
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      url = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
    }

    const { Linking } = require('react-native');
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Erro', 'WhatsApp não está instalado');
    }
  } catch (error) {
    console.error('Erro ao compartilhar via WhatsApp:', error);
    Alert.alert('Erro', 'Não foi possível compartilhar via WhatsApp');
  }
};

/**
 * Compartilha o relatório via Email
 */
export const shareViaEmail = async (report, groupName, patientName, email = null) => {
  try {
    const text = formatReportAsText(report, groupName, patientName);
    const subject = encodeURIComponent(`Relatório de Medicação - ${patientName}`);
    const body = encodeURIComponent(text);
    
    let url = `mailto:`;
    if (email) {
      url += `${email}`;
    }
    url += `?subject=${subject}&body=${body}`;

    const { Linking } = require('react-native');
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Erro', 'Cliente de email não encontrado');
    }
  } catch (error) {
    console.error('Erro ao compartilhar via Email:', error);
    Alert.alert('Erro', 'Não foi possível compartilhar via Email');
  }
};

/**
 * Salva o relatório como arquivo de texto e compartilha
 */
export const saveAndShareReport = async (report, groupName, patientName) => {
  try {
    const text = formatReportAsText(report, groupName, patientName);
    const fileName = `relatorio_medicacao_${Date.now()}.txt`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, text, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Compartilhar Relatório',
      });
    } else {
      Alert.alert('Sucesso', `Relatório salvo em: ${fileUri}`);
    }
  } catch (error) {
    console.error('Erro ao salvar relatório:', error);
    Alert.alert('Erro', 'Não foi possível salvar o relatório');
  }
};

export default {
  generateAdhesionReport,
  formatReportAsText,
  shareViaWhatsApp,
  shareViaEmail,
  saveAndShareReport,
};

