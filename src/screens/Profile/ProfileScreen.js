import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  PersonOutlineIcon,
  MedicalOutlineIcon,
  LockClosedOutlineIcon,
  NotificationsOutlineIcon,
  InformationCircleOutlineIcon,
  HelpCircleOutlineIcon,
  DocumentTextOutlineIcon,
  ChevronForwardIcon,
  LogOutOutlineIcon,
  CameraIcon,
  MedicalIcon,
  PersonIcon,
  HeartIcon,
} from '../../components/CustomIcons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { LacosIcon } from '../../components/LacosLogo';
import userService from '../../services/userService';
import Toast from 'react-native-toast-message';


const ProfileScreen = ({ navigation }) => {
  const { user, signOut, updateUser } = useAuth();
  const [photoUri, setPhotoUri] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Carregar foto do usuário (preferir photo_url que tem URL completa)
    if (user?.photo_url) {
      setPhotoUri(user.photo_url);
    } else if (user?.photo) {
      setPhotoUri(user.photo);
    }
  }, [user]);

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

  const handleLogout = async () => {
    // Proteção contra múltiplos cliques
    if (isLoggingOut) {
      console.log('📱 ProfileScreen - Logout já em andamento, ignorando clique...');
      return;
    }
    
    console.log('📱 ProfileScreen - ========== INICIANDO LOGOUT ==========');
    console.log('📱 ProfileScreen - handleLogout chamado!');
    console.log('📱 ProfileScreen - signOut disponível?', typeof signOut === 'function');
    
    setIsLoggingOut(true);
    
    // Confirmar com Alert
    Alert.alert(
      'Sair da Conta',
      'Ao sair, você retornará à tela inicial onde poderá escolher entre entrar como Paciente ou Acompanhante novamente.\n\nDeseja continuar?',
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => {
            console.log('📱 ProfileScreen - Logout cancelado pelo usuário');
            setIsLoggingOut(false);
          }
        },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            console.log('📱 ProfileScreen - ========== USUÁRIO CONFIRMOU LOGOUT ==========');
            
            try {
              console.log('📱 ProfileScreen - Chamando signOut()...');
              await signOut();
              console.log('📱 ProfileScreen - ✅ signOut() executado com sucesso!');
              // Navegação será feita pelo AuthContext e RootNavigator
              // Não precisamos navegar aqui para evitar duplicação
              
            } catch (error) {
              console.error('❌ ProfileScreen - ERRO CRÍTICO ao sair:', error);
              setIsLoggingOut(false);
              Alert.alert(
                'Erro', 
                'Não foi possível sair. Tente novamente.'
              );
            }
          }
        },
      ],
      { cancelable: true, onDismiss: () => setIsLoggingOut(false) }
    );
  };

  const MenuItem = ({ icon: IconComponent, title, subtitle, onPress, color = colors.text, showArrow = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
        <IconComponent size={22} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <ChevronForwardIcon size={20} color={colors.gray400} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LacosIcon size={36} />
          <Text style={styles.title}>Perfil</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
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
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
              {uploadingPhoto && (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color={colors.textWhite} size="large" />
                </View>
              )}
            </View>
            <View style={styles.cameraIconContainer}>
              <CameraIcon size={18} color={colors.textWhite} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>
            {user?.name} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.profile && (
            <View style={[
              styles.profileBadge,
              user?.profile === 'professional_caregiver' && { backgroundColor: colors.success + '20' },
              user?.profile === 'doctor' && { backgroundColor: '#4A90E2' + '20' },
              user?.profile === 'accompanied' && { backgroundColor: colors.secondary + '20' },
              user?.profile === 'caregiver' && { backgroundColor: colors.info + '20' },
            ]}>
              {user?.profile === 'professional_caregiver' ? (
                <MedicalIcon size={14} color={colors.success} />
              ) : user?.profile === 'doctor' ? (
                <MedicalOutlineIcon size={14} color="#4A90E2" />
              ) : user?.profile === 'accompanied' ? (
                <PersonIcon size={14} color={colors.secondary} />
              ) : (
                <HeartIcon size={14} color={colors.info} />
              )}
              <Text style={[
                styles.profileBadgeText,
                user?.profile === 'professional_caregiver' && { color: colors.success },
                user?.profile === 'doctor' && { color: '#4A90E2' },
                user?.profile === 'accompanied' && { color: colors.secondary },
                user?.profile === 'caregiver' && { color: colors.info },
              ]}>
                {user?.profile === 'professional_caregiver' ? 'Cuidador profissional' :
                 user?.profile === 'doctor' ? 'Médico' :
                 user?.profile === 'accompanied' ? 'Paciente' :
                 'Amigo/cuidador'}
              </Text>
            </View>
          )}
        </View>

        {/* Menu Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.menuContainer}>
            <MenuItem
              icon={PersonOutlineIcon}
              title="Dados Pessoais"
              subtitle="Nome, e-mail, telefone"
              color={colors.primary}
              onPress={() => navigation.navigate('EditPersonalData')}
            />
            {(user?.profile === 'professional_caregiver' || user?.profile === 'doctor') && (
              <MenuItem
                icon={MedicalOutlineIcon}
                title="Dados Profissionais"
                subtitle="Formação, valor/hora, disponibilidade"
                color={colors.success}
                onPress={() => navigation.navigate('ProfessionalCaregiverData')}
              />
            )}
            <MenuItem
              icon={LockClosedOutlineIcon}
              title="Segurança"
              subtitle="Senha e autenticação"
              color={colors.warning}
              onPress={() => navigation.navigate('Security')}
            />
            <MenuItem
              icon={NotificationsOutlineIcon}
              title="Notificações"
              subtitle="Preferências de notificações"
              color={colors.info}
              onPress={() => navigation.navigate('NotificationPreferences')}
            />
          </View>
        </View>

        {/* Menu Aplicativo */}
        {/* NOTA: "Códigos de acesso" foi removido - não deve aparecer para médicos nem outros perfis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicativo</Text>
          <View style={styles.menuContainer}>
            <MenuItem
              icon={InformationCircleOutlineIcon}
              title="Sobre o Laços"
              subtitle="Versão 1.0.0"
              color={colors.secondary}
            />
            <MenuItem
              icon={HelpCircleOutlineIcon}
              title="Ajuda e Suporte"
              subtitle="FAQ e contato"
              color={colors.success}
            />
            <MenuItem
              icon={DocumentTextOutlineIcon}
              title="Termos e Privacidade"
              subtitle="Termos de uso e política"
              color={colors.text}
            />
          </View>
        </View>

        {/* Botão Sair */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => {
              console.log('📱 ProfileScreen - Botão Sair CLICADO!');
              console.log('📱 ProfileScreen - handleLogout disponível?', typeof handleLogout === 'function');
              handleLogout();
            }}
            activeOpacity={0.7}
            testID="logout-button"
          >
            <View style={styles.logoutIcon}>
              <LogOutOutlineIcon size={24} color={colors.textWhite} />
            </View>
            <View style={styles.logoutContent}>
            <Text style={styles.logoutText}>Sair da Conta</Text>
              <Text style={styles.logoutSubtext}>Voltar à tela inicial</Text>
            </View>
            <ChevronForwardIcon size={20} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Desenvolvido com 💙 para cuidar de quem amamos
          </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
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
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.textWhite,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  profileBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    justifyContent: 'space-between',
    backgroundColor: colors.error,
    padding: 18,
    borderRadius: 12,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutContent: {
    flex: 1,
    marginLeft: 12,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 2,
  },
  logoutSubtext: {
    fontSize: 13,
    color: colors.textWhite,
    opacity: 0.8,
  },
  footer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default ProfileScreen;

