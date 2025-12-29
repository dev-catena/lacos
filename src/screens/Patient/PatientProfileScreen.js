import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  MailOutlineIcon,
  PeopleOutlineIcon,
  PersonOutlineIcon,
  CalendarOutlineIcon,
  HelpCircleOutlineIcon,
  CallOutlineIcon,
  LogOutOutlineIcon,
  CameraIcon,
  PersonIcon,
  PeopleIcon,
  ChevronForwardIcon,
} from '../../components/CustomIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../constants/colors';
import { LacosIcon } from '../../components/LacosLogo';
import { useAuth } from '../../contexts/AuthContext';
import groupService from '../../services/groupService';
import userService from '../../services/userService';
import Toast from 'react-native-toast-message';

const PATIENT_SESSION_KEY = '@lacos_patient_session';

const PatientProfileScreen = ({ navigation }) => {
  const { user, signOut, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [patientSession, setPatientSession] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [memberSince, setMemberSince] = useState(null);
  const [adminName, setAdminName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUri, setPhotoUri] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Calcular padding bottom para o ScrollView (altura do tab bar + inset do Android)
  const tabBarHeight = 60;
  const tabBarPaddingBottom = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 8) 
    : 8;
  const scrollViewPaddingBottom = tabBarHeight + tabBarPaddingBottom + 20;

  useFocusEffect(
    React.useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    setLoading(true);
    try {
      // Carregar sessão do paciente (compatibilidade)
      const sessionJson = await AsyncStorage.getItem(PATIENT_SESSION_KEY);
      if (sessionJson) {
        setPatientSession(JSON.parse(sessionJson));
      }

      // Carregar foto do usuário (preferir photo_url que tem URL completa)
      if (user?.photo_url) {
        setPhotoUri(user.photo_url);
      } else if (user?.photo) {
        setPhotoUri(user.photo);
      }

      // Buscar grupos do usuário
      const groupsResult = await groupService.getMyGroups();
      if (groupsResult.success && groupsResult.data && groupsResult.data.length > 0) {
        const patientGroup = groupsResult.data[0]; // Paciente tem apenas 1 grupo
        setGroupData(patientGroup);

        // Buscar membros do grupo para obter data de entrada e admin
        const membersResult = await groupService.getGroupMembers(patientGroup.id);
        if (membersResult.success && membersResult.data) {
          const members = membersResult.data;
          
          // Buscar data de entrada do paciente
          const currentMember = members.find(m => m.user_id === user?.id);
          if (currentMember && currentMember.created_at) {
            setMemberSince(currentMember.created_at);
          }

          // Buscar quem é o admin
          const admin = members.find(m => m.role === 'admin');
          if (admin && admin.user) {
            setAdminName(admin.user.name);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhoto = async () => {
    try {
      // Solicitar permissão
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos.'
        );
        return;
      }

      // Abrir galeria
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        setUploadingPhoto(true);
        
        console.log('📸 Imagem selecionada:', selectedImage.uri);
        
        // Criar FormData para upload
        const formData = new FormData();
        
        // Extrair extensão e tipo do arquivo
        const uriParts = selectedImage.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        // Adicionar foto com formato correto
        formData.append('photo', {
          uri: selectedImage.uri,
          type: `image/${fileType}`,
          name: `profile.${fileType}`,
        });

        console.log('📤 Enviando FormData para API...');
        console.log('👤 User ID:', user?.id);

        // Enviar para API
        const response = await userService.updateProfile(user?.id, formData);
        
        console.log('📥 Resposta da API:', response);
        
        if (response.success && response.data) {
          // Usar photo_url da API se disponível, senão usar URI local
          const newPhotoUri = response.data.photo_url || selectedImage.uri;
          setPhotoUri(newPhotoUri);
          
          // Atualizar contexto
          if (updateUser) {
            updateUser(response.data);
          }
          
          Toast.show({
            type: 'success',
            text1: 'Foto Atualizada',
            text2: 'Sua foto de perfil foi alterada com sucesso',
            position: 'bottom',
          });
        } else {
          throw new Error(response.error || 'Erro ao atualizar foto');
        }
      }
    } catch (error) {
      console.error('Erro ao trocar foto:', error);
      Alert.alert(
        'Erro',
        'Não foi possível atualizar a foto. Tente novamente.'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair do Aplicativo',
      'Deseja sair? Você precisará fazer login novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 PatientProfileScreen - Fazendo logout...');
              
              // Remove a sessão antiga do paciente (compatibilidade)
              await AsyncStorage.removeItem(PATIENT_SESSION_KEY);
              
              // Faz logout pelo AuthContext (remove token, user, etc)
              await signOut();
              
              console.log('✅ PatientProfileScreen - Logout concluído, RootNavigator vai redirecionar');
              // RootNavigator automaticamente redireciona para Login quando signed = false
            } catch (error) {
              console.error('❌ PatientProfileScreen - Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const InfoCard = ({ icon: IconComponent, label, value, color = colors.primary }) => (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: color + '20' }]}>
        <IconComponent size={24} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LacosIcon size={36} />
            <Text style={styles.title}>Meu Perfil</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LacosIcon size={36} />
          <Text style={styles.title}>Meu Perfil</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollViewPaddingBottom }}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleChangePhoto}
            disabled={uploadingPhoto}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              ) : (
                <PersonIcon size={48} color={colors.textWhite} />
              )}
              {uploadingPhoto && (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color={colors.textWhite} size="large" />
                </View>
              )}
            </View>
            <View style={styles.cameraIconContainer}>
              <CameraIcon size={20} color={colors.textWhite} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>
            {user?.name || patientSession?.accompaniedName || 'Paciente'}
          </Text>
          <View style={styles.groupBadge}>
            <PeopleIcon size={14} color={colors.primary} />
            <Text style={styles.groupBadgeText}>
              {groupData?.name || patientSession?.groupName || 'Grupo de Cuidados'}
            </Text>
          </View>
          {user?.profile && (
            <View style={[styles.profileBadge, { backgroundColor: colors.secondary + '20' }]}>
              <Text style={[styles.profileBadgeText, { color: colors.secondary }]}>
                Paciente
              </Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          <InfoCard
            icon={MailOutlineIcon}
            label="E-mail"
            value={user?.email || 'Não informado'}
            color={colors.secondary}
          />

          <InfoCard
            icon={PeopleOutlineIcon}
            label="Grupo de Cuidados"
            value={groupData?.name || patientSession?.groupName || 'Não definido'}
            color={colors.primary}
          />

          <InfoCard
            icon={PersonOutlineIcon}
            label="Administrador"
            value={adminName || 'Não disponível'}
            color={colors.warning}
          />

          <InfoCard
            icon={CalendarOutlineIcon}
            label="Membro desde"
            value={memberSince 
              ? new Date(memberSince).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })
              : 'Não disponível'
            }
            color={colors.info}
          />
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ajuda</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <HelpCircleOutlineIcon size={24} color={colors.info} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Como Usar</Text>
              <Text style={styles.menuSubtitle}>Tutorial e instruções</Text>
            </View>
            <ChevronForwardIcon size={20} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <CallOutlineIcon size={24} color={colors.success} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Contatos de Emergência</Text>
              <Text style={styles.menuSubtitle}>Ver números importantes</Text>
            </View>
            <ChevronForwardIcon size={20} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutIcon}>
              <LogOutOutlineIcon size={28} color={colors.textWhite} />
            </View>
            <View style={styles.logoutContent}>
              <Text style={styles.logoutText}>Sair do Aplicativo</Text>
              <Text style={styles.logoutSubtext}>Voltar à tela inicial</Text>
            </View>
            <ChevronForwardIcon size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  userCard: {
    backgroundColor: colors.backgroundLight,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.backgroundLight,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  groupBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  profileBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.textLight,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutContent: {
    flex: 1,
    marginLeft: 16,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 4,
  },
  logoutSubtext: {
    fontSize: 14,
    color: colors.textWhite,
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
});

export default PatientProfileScreen;

