import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import groupService from '../../services/groupService';
import emergencyContactService from '../../services/emergencyContactService';
import { isAccompaniedPersonGroupRole } from '../../utils/groupRoles';

const PatientEmergencyContactsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [])
  );

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const groupsResult = await groupService.getMyGroups();
      if (!groupsResult.success || !groupsResult.data?.length) {
        setContacts([]);
        setGroupName('');
        setError('Você não está em nenhum grupo.');
        return;
      }

      const group = groupsResult.data[0];
      setGroupName(group.name || 'Grupo');

      const allContacts = [];
      const colorOptions = [colors.primary, colors.secondary, colors.error];

      // Contatos da tabela emergency_contacts
      const contactsResult = await emergencyContactService.getEmergencyContacts(group.id);
      if (contactsResult.success && Array.isArray(contactsResult.data)) {
        contactsResult.data.forEach((c, i) => {
          allContacts.push({
            id: `ec-${c.id}`,
            name: c.name,
            phone: c.phone,
            relationship: c.relationship || 'Contato',
            color: colorOptions[i % colorOptions.length],
            isSOS: c.relationship === 'SOS' || c.relationship === 'sos' || c.is_primary,
          });
        });
      }

      // Membros com is_emergency_contact
      const membersResult = await groupService.getGroupMembers(group.id);
      if (membersResult.success && Array.isArray(membersResult.data)) {
        const emergencyMembers = membersResult.data.filter(
          m => m.is_emergency_contact && !isAccompaniedPersonGroupRole(m.role)
        );
        emergencyMembers.forEach((m, i) => {
          const phone = m.user?.phone || m.phone || '';
          if (phone && !allContacts.find(c => c.phone === phone)) {
            allContacts.push({
              id: `member-${m.user_id || m.id}`,
              name: m.user?.name || m.name || 'Membro',
              phone,
              relationship: m.role === 'admin' ? 'Cuidador Principal' : 'Cuidador',
              color: colorOptions[(allContacts.length + i) % colorOptions.length],
              isSOS: false,
            });
          }
        });
      }

      setContacts(allContacts);
    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
      setError('Não foi possível carregar os contatos.');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone) => {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    const url = `tel:${cleaned}`;
    Linking.openURL(url).catch(() => {
      console.warn('Não foi possível abrir o discador');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Contatos de Emergência</Text>
          <Text style={styles.headerSubtitle}>{groupName || 'Seu grupo'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando contatos...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Sem contatos</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="call-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Nenhum contato configurado</Text>
          <Text style={styles.emptyText}>
            Os contatos de emergência são configurados pelos administradores do grupo.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <Text style={styles.infoText}>
              Toque em um contato para ligar. Estes são os contatos que podem ser acionados em caso de emergência.
            </Text>
          </View>

          {contacts.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              style={[
                styles.contactCard,
                contact.isSOS && styles.contactCardSOS,
              ]}
              onPress={() => handleCall(contact.phone)}
              activeOpacity={0.7}
            >
              <View style={[styles.contactAvatar, { backgroundColor: contact.color + '30' }]}>
                <Ionicons
                  name={contact.isSOS ? 'alert-circle' : 'person'}
                  size={28}
                  color={contact.color}
                />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              <View style={styles.contactCallIcon}>
                <Ionicons name="call" size={24} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...(Platform.OS === 'android' && { elevation: 0 }),
  },
  contactCardSOS: {
    backgroundColor: colors.error + '08',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  contactAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  contactCallIcon: {
    padding: 8,
  },
});

export default PatientEmergencyContactsScreen;
