import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  Clipboard,
  Share,
  Platform,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import SafeIcon from '../../components/SafeIcon';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import groupService from '../../services/groupService';
import groupMemberService from '../../services/groupMemberService';
import Toast from 'react-native-toast-message';
import API_CONFIG from '../../config/api';
import {
  VitalSignsIcon,
  PermissionsIcon,
  NotificationIcon,
  MedicalHistoryIcon,
  MedicationIcon,
  AppointmentIcon,
  MessagesIcon,
} from '../../components/CustomIcons';

const GROUPS_STORAGE_KEY = '@lacos_groups';

const GroupSettingsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groupData, setGroupData] = useState(null);
  const [members, setMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Informações Básicas do Grupo
  const [editedGroupName, setEditedGroupName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [groupPhotoUrl, setGroupPhotoUrl] = useState(null);
  const [newGroupPhoto, setNewGroupPhoto] = useState(null);
  const [photoKey, setPhotoKey] = useState(0); // Key para forçar reload da imagem
  const [imageSource, setImageSource] = useState(null); // Source da imagem para forçar remount
  
  // Modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Sinais Vitais
  const [vitalSigns, setVitalSigns] = useState({
    monitor_blood_pressure: false,
    monitor_heart_rate: false,
    monitor_oxygen_saturation: false,
    monitor_blood_glucose: false,
    monitor_temperature: false,
    monitor_respiratory_rate: false,
  });

  // Permissões do Acompanhado
  const [permissions, setPermissions] = useState({
    accompanied_notify_medication: true,
    accompanied_notify_appointment: true,
    accompanied_access_history: true,
    accompanied_access_medication: true,
    accompanied_access_schedule: true,
    accompanied_access_chat: false,
  });

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      let timeoutId = null;
      
      const loadData = async () => {
        if (isMounted) {
          await loadGroupData();
        }
      };
      
      // Pequeno delay para evitar múltiplas chamadas
      timeoutId = setTimeout(() => {
        loadData();
      }, 100);
      
      return () => {
        isMounted = false;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }, [groupId])
  );

  const loadGroupData = async () => {
    setLoading(true);
    try {
      console.log('🔄 GroupSettings - Carregando grupo da API:', groupId);
      const result = await groupService.getGroup(groupId);
      
      if (result.success && result.data) {
        console.log('✅ GroupSettings - Grupo carregado:', result.data);
        console.log('📸 GroupSettings - photo_url do servidor:', result.data.photo_url);
        console.log('🔑 GroupSettings - access_code:', result.data.access_code);
        console.log('🔑 GroupSettings - code:', result.data.code);
        setGroupData(result.data);
        setEditedGroupName(result.data.name || '');
        setEditedDescription(result.data.description || '');
        
        // Carregar configurações de sinais vitais
        if (result.data) {
          setVitalSigns({
            monitor_blood_pressure: result.data.monitor_blood_pressure || false,
            monitor_heart_rate: result.data.monitor_heart_rate || false,
            monitor_oxygen_saturation: result.data.monitor_oxygen_saturation || false,
            monitor_blood_glucose: result.data.monitor_blood_glucose || false,
            monitor_temperature: result.data.monitor_temperature || false,
            monitor_respiratory_rate: result.data.monitor_respiratory_rate || false,
          });
          
          // Carregar permissões do acompanhado
          setPermissions({
            accompanied_notify_medication: result.data.accompanied_notify_medication !== undefined ? result.data.accompanied_notify_medication : true,
            accompanied_notify_appointment: result.data.accompanied_notify_appointment !== undefined ? result.data.accompanied_notify_appointment : true,
            accompanied_access_history: result.data.accompanied_access_history !== undefined ? result.data.accompanied_access_history : true,
            accompanied_access_medication: result.data.accompanied_access_medication !== undefined ? result.data.accompanied_access_medication : true,
            accompanied_access_schedule: result.data.accompanied_access_schedule !== undefined ? result.data.accompanied_access_schedule : true,
            accompanied_access_chat: result.data.accompanied_access_chat !== undefined ? result.data.accompanied_access_chat : false,
          });
        }
        
        // Adicionar cache-busting na URL da foto para forçar reload
        // Sempre atualizar groupPhotoUrl com a foto do servidor
        const photoUrl = result.data.photo_url;
        console.log('📸 GroupSettings.loadGroupData - photo_url do servidor:', photoUrl);
        console.log('📸 GroupSettings.loadGroupData - newGroupPhoto existe?', !!newGroupPhoto);
        console.log('📸 GroupSettings.loadGroupData - groupPhotoUrl atual:', groupPhotoUrl);
        
        if (photoUrl) {
          // Construir URL completa se necessário
          let fullPhotoUrl = photoUrl;
          if (!photoUrl.startsWith('http')) {
            // Se não for URL completa, construir usando a base URL da API
            const baseUrl = API_CONFIG.BASE_URL.replace('/api', ''); // Remover /api do final
            fullPhotoUrl = photoUrl.startsWith('/') 
              ? `${baseUrl}${photoUrl}` 
              : `${baseUrl}/${photoUrl}`;
          }
          
          // SEMPRE atualizar com cache-busting para forçar reload
          const separator = fullPhotoUrl.includes('?') ? '&' : '?';
          const timestamp = Date.now();
          const newPhotoUrl = `${fullPhotoUrl}${separator}t=${timestamp}`;
          
          // Comparar URLs sem o timestamp para ver se realmente mudou
          const currentUrlWithoutTimestamp = groupPhotoUrl ? groupPhotoUrl.split('?')[0].split('&')[0] : null;
          const newUrlWithoutTimestamp = fullPhotoUrl.split('?')[0].split('&')[0];
          
          console.log('📸 GroupSettings.loadGroupData - Comparando URLs:', {
            current: currentUrlWithoutTimestamp,
            new: newUrlWithoutTimestamp,
            changed: currentUrlWithoutTimestamp !== newUrlWithoutTimestamp
          });
          
          // SEMPRE atualizar groupPhotoUrl, mesmo se a URL base não mudou (pode ser cache)
          console.log('📸 GroupSettings.loadGroupData - Atualizando photoUrl com cache-busting:', newPhotoUrl);
          setGroupPhotoUrl(newPhotoUrl);
          // Atualizar o key para forçar reload da imagem
          setPhotoKey(timestamp);
          // Atualizar imageSource para forçar remount
          setImageSource({ uri: newPhotoUrl, cache: 'reload' });
          
          // NÃO limpar newGroupPhoto automaticamente - deixar o usuário decidir se quer salvar ou não
          // Se newGroupPhoto existe, manter para que o usuário possa salvar
          if (newGroupPhoto) {
            console.log('📸 GroupSettings.loadGroupData - newGroupPhoto existe, mantendo para salvar');
          }
        } else {
          console.log('📸 GroupSettings.loadGroupData - Sem photo_url, limpando groupPhotoUrl');
          setGroupPhotoUrl(null);
          setPhotoKey(Date.now()); // Forçar reload mesmo sem foto
        }
      } else {
        console.error('❌ GroupSettings - Erro ao carregar grupo:', result.error);
        Alert.alert('Erro', 'Não foi possível carregar os dados do grupo');
        setLoading(false);
        return; // Não continuar se o grupo não foi carregado
      }

      // Carregar membros do grupo (só se o grupo foi carregado com sucesso)
      console.log('👥 GroupSettings - Carregando membros do grupo:', groupId);
      
      // Primeiro, tentar pegar membros do método getGroup (se disponível)
      let membersFromGroup = [];
      if (result.success && result.data && result.data.group_members) {
        membersFromGroup = result.data.group_members;
        console.log('📋 GroupSettings - Membros do getGroup:', membersFromGroup.length);
      }
      
      // Depois, tentar pegar do método members
      const membersResult = await groupMemberService.getGroupMembers(groupId);
      let membersFromApi = [];
      if (membersResult.success && membersResult.data) {
        membersFromApi = membersResult.data;
        console.log('✅ GroupSettings - Membros carregados da API:', membersFromApi.length);
      }
      
      // Usar membros da API se disponível, senão usar do getGroup
      const finalMembers = membersFromApi.length > 0 ? membersFromApi : membersFromGroup;
      console.log('📋 GroupSettings - Dados do grupo carregado:', JSON.stringify(result.data, null, 2));
      console.log('👤 GroupSettings - Usuário logado ID:', user?.id);
      console.log('👥 GroupSettings - Membros finais:', finalMembers.length, JSON.stringify(finalMembers, null, 2));
      setMembers(finalMembers);
      
      if (finalMembers.length > 0) {
        
        // Verificar se o usuário logado é admin
        // Usar result.data diretamente (dados do grupo já carregados) ao invés de groupData (state pode não estar atualizado)
        const loadedGroupData = result.data;
        
        // 1. Verificar se é criador do grupo
        const isCreator = loadedGroupData?.created_by === user?.id;
        console.log('🔍 GroupSettings - É criador?', isCreator, 'created_by:', loadedGroupData?.created_by, 'user.id:', user?.id);
        
        // 2. Verificar se tem role=admin ou is_admin=true
        const currentUserMember = finalMembers.find(m => {
          const matchesUserId = m.user_id === user?.id;
          const matchesId = m.id === user?.id;
          return matchesUserId || matchesId;
        });
        console.log('🔍 GroupSettings - Membro atual encontrado:', JSON.stringify(currentUserMember, null, 2));
        console.log('🔍 GroupSettings - Todos os membros:', JSON.stringify(finalMembers.map(m => ({ id: m.id, user_id: m.user_id, name: m.name, role: m.role, is_admin: m.is_admin })), null, 2));
        const hasAdminRole = currentUserMember?.role === 'admin' || currentUserMember?.is_admin === true;
        console.log('🔍 GroupSettings - Tem role admin?', hasAdminRole, 'role:', currentUserMember?.role, 'is_admin:', currentUserMember?.is_admin);
        
        const userIsAdmin = isCreator || hasAdminRole;
        setIsAdmin(userIsAdmin);
        console.log(`👤 GroupSettings - Usuário é admin: ${userIsAdmin} (criador: ${isCreator}, role admin: ${hasAdminRole})`);
        
        // Se não for admin, bloquear acesso
        if (!userIsAdmin) {
          console.warn('⚠️ GroupSettings - Acesso negado. Usuário não é admin.');
          Alert.alert(
            'Acesso Negado',
            'Apenas administradores podem acessar as configurações do grupo.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      } else {
        console.warn('⚠️ GroupSettings - Erro ao carregar membros:', membersResult.error);
        // Se não conseguiu carregar membros da API, mas tem membros no getGroup, usar esses
        if (membersFromGroup.length > 0) {
          console.log('📋 GroupSettings - Usando membros do getGroup como fallback');
          setMembers(membersFromGroup);
        } else {
          setMembers([]);
        }
      }
    } catch (error) {
      console.error('❌ GroupSettings - Erro ao carregar dados do grupo:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do grupo');
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    const code = groupData?.code || groupData?.access_code;
    if (code && code !== 'NULL' && code !== 'null') {
      Clipboard.setString(code);
      Alert.alert('Código Copiado!', 'O código foi copiado para a área de transferência.');
    } else {
      Alert.alert('Erro', 'Código não disponível');
    }
  };

  const shareCode = async () => {
    const code = groupData?.code || groupData?.access_code;
    if (code && code !== 'NULL' && code !== 'null') {
      try {
        await Share.share({
          message: `Código de acesso ao grupo: ${code}`,
        });
      } catch (error) {
        console.error('Erro ao compartilhar código:', error);
      }
    } else {
      Alert.alert('Erro', 'Código não disponível');
    }
  };

  const pickGroupPhoto = async () => {
    console.log('📸 GroupSettings.pickGroupPhoto - INICIANDO seleção de foto');
    console.log('📸 GroupSettings.pickGroupPhoto - newGroupPhoto atual:', newGroupPhoto);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedPhotoUri = result.assets[0].uri;
        console.log('📸 GroupSettings.pickGroupPhoto - ✅ Foto selecionada!');
        console.log('📸 GroupSettings.pickGroupPhoto - selectedPhotoUri:', selectedPhotoUri);
        console.log('📸 GroupSettings - Limpando imageSource para forçar uso da nova foto');
        // Limpar imageSource para garantir que a nova foto seja exibida
        setImageSource(null);
        // Atualizar photoKey para forçar remount do componente Image
        setPhotoKey(Date.now());
        // Definir a nova foto
        setNewGroupPhoto(selectedPhotoUri);
        console.log('📸 GroupSettings.pickGroupPhoto - newGroupPhoto será definido para:', selectedPhotoUri);
        console.log('📸 GroupSettings - Estados atualizados: newGroupPhoto definido, imageSource limpo');
      }
    } catch (error) {
      console.error('❌ GroupSettings.pickGroupPhoto - Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  // Função SIMPLES apenas para salvar a foto
  const savePhotoOnly = async () => {
    if (!newGroupPhoto) {
      Alert.alert('Atenção', 'Selecione uma foto primeiro');
      return;
    }

    console.log('📸 SAVE PHOTO ONLY - Iniciando upload simples da foto');
    console.log('📸 SAVE PHOTO ONLY - Grupo ID:', groupId);
    console.log('📸 SAVE PHOTO ONLY - Foto URI:', newGroupPhoto);

    // Guardar a URI da foto selecionada antes de enviar
    const photoToSave = newGroupPhoto;

    try {
      setSaving(true);

      const formData = new FormData();
      const filename = photoToSave.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const photoFile = {
        uri: photoToSave,
        name: filename || `group_photo_${Date.now()}.jpg`,
        type: type,
      };

      formData.append('photo', photoFile);
      formData.append('name', groupData?.name || '');
      formData.append('description', groupData?.description || '');

      console.log('📸 SAVE PHOTO ONLY - Tentando método SIMPLES primeiro...');
      
      // Tentar método simples primeiro
      let result = await groupService.uploadGroupPhotoSimple(groupId, photoToSave);
      
      console.log('📸 SAVE PHOTO ONLY - Resultado do método simples:', {
        success: result.success,
        hasData: !!result.data,
        photo_url: result.data?.photo_url,
        photo: result.data?.photo,
        fullData: result.data,
      });
      
      // Se falhar, tentar método antigo
      if (!result.success) {
        console.log('📸 SAVE PHOTO ONLY - Método simples falhou, tentando método completo...');
        result = await groupService.updateGroup(groupId, formData);
      }

      if (result.success) {
        console.log('✅ SAVE PHOTO ONLY - Foto salva com sucesso!');
        console.log('✅ SAVE PHOTO ONLY - Resposta completa:', JSON.stringify(result.data, null, 2));

        // Obter a nova URL da foto do servidor - tentar vários campos
        const newPhotoUrl = result.data?.photo_url || 
                           result.data?.photo || 
                           (result.data?.photo && typeof result.data.photo === 'string' && result.data.photo.startsWith('http') ? result.data.photo : null);
        
        console.log('📸 SAVE PHOTO ONLY - newPhotoUrl extraído:', newPhotoUrl);
        
        if (newPhotoUrl) {
          // Construir URL completa
          let fullPhotoUrl = newPhotoUrl;
          if (!fullPhotoUrl.startsWith('http')) {
            const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
            fullPhotoUrl = fullPhotoUrl.startsWith('/') 
              ? `${baseUrl}${fullPhotoUrl}` 
              : `${baseUrl}/${fullPhotoUrl}`;
          }
          
          // Adicionar cache-busting
          const timestamp = Date.now();
          const photoUrlWithCache = `${fullPhotoUrl}?t=${timestamp}`;
          
          // Atualizar estados - IMPORTANTE: NÃO limpar newGroupPhoto ainda
          // Manter newGroupPhoto visível até a foto do servidor carregar completamente
          setGroupPhotoUrl(photoUrlWithCache);
          setPhotoKey(timestamp);
          setImageSource({ uri: photoUrlWithCache, cache: 'reload' });
          
          console.log('✅ SAVE PHOTO ONLY - Estados atualizados com nova foto do servidor');
          console.log('✅ SAVE PHOTO ONLY - Mantendo newGroupPhoto visível até foto do servidor carregar');
          console.log('✅ SAVE PHOTO ONLY - Nova URL do servidor:', photoUrlWithCache);
          
          // Limpar newGroupPhoto imediatamente e recarregar dados do grupo
          setNewGroupPhoto(null);
          
          // Recarregar dados do grupo para garantir que temos a foto mais recente
          setTimeout(async () => {
            console.log('🔄 SAVE PHOTO ONLY - Recarregando dados do grupo...');
            await loadGroupData();
            // Forçar atualização da imagem
            setPhotoKey(Date.now());
          }, 500);
        } else {
          // Se não veio URL na resposta, recarregar dados
          console.log('⚠️ SAVE PHOTO ONLY - URL não veio na resposta, recarregando...');
          // Limpar newGroupPhoto e recarregar
          setNewGroupPhoto(null);
          setTimeout(async () => {
            await loadGroupData();
          }, 1000);
        }

        Toast.show({
          type: 'success',
          text1: 'Sucesso!',
          text2: 'Foto atualizada com sucesso',
        });
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível salvar a foto');
        // Em caso de erro, manter a foto selecionada
      }
    } catch (error) {
      console.error('❌ SAVE PHOTO ONLY - Erro:', error);
      Alert.alert('Erro', 'Não foi possível salvar a foto');
      // Em caso de erro, manter a foto selecionada
    } finally {
      setSaving(false);
    }
  };

  const removeGroupPhoto = () => {
    Alert.alert(
      'Remover Foto',
      'Deseja remover a foto do grupo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setNewGroupPhoto(null);
            setGroupPhotoUrl(null);
          },
        },
      ]
    );
  };

  const saveGroupBasicInfo = async () => {
    console.log('💾 GroupSettings.saveGroupBasicInfo - FUNÇÃO CHAMADA');
    console.log('💾 GroupSettings.saveGroupBasicInfo - Grupo ID:', groupId);
    console.log('💾 GroupSettings.saveGroupBasicInfo - newGroupPhoto existe?', !!newGroupPhoto);
    console.log('💾 GroupSettings.saveGroupBasicInfo - editedGroupName:', editedGroupName);
    console.log('💾 GroupSettings.saveGroupBasicInfo - editedDescription:', editedDescription);
    console.log('💾 GroupSettings.saveGroupBasicInfo - saving:', saving);
    
    try {
      setSaving(true);

      // Se houver uma nova foto, enviar tudo via FormData (como no createGroup)
      if (newGroupPhoto) {
        console.log('📤 GroupSettings - Iniciando salvamento de foto do grupo...');
        console.log('📤 GroupSettings - Grupo ID:', groupId);
        console.log('📤 GroupSettings - URI da foto:', newGroupPhoto);
        
        // Verificar se o arquivo existe
        try {
          const fileInfo = await FileSystem.getInfoAsync(newGroupPhoto);
          if (!fileInfo.exists) {
            throw new Error('Arquivo de foto não encontrado');
          }
          console.log('📤 GroupSettings - Arquivo existe, tamanho:', fileInfo.size, 'bytes');
        } catch (fileError) {
          console.error('❌ GroupSettings - Erro ao verificar arquivo:', fileError);
          Alert.alert('Erro', 'Arquivo de foto não encontrado. Por favor, selecione novamente.');
          setSaving(false);
          return;
        }
        
        const formData = new FormData();
        formData.append('name', editedGroupName);
        formData.append('description', editedDescription || '');
        
        // Adicionar configurações de sinais vitais
        Object.keys(vitalSigns).forEach(key => {
          formData.append(key, vitalSigns[key] ? '1' : '0');
        });
        
        // Adicionar permissões do acompanhado
        Object.keys(permissions).forEach(key => {
          formData.append(key, permissions[key] ? '1' : '0');
        });

        const filename = newGroupPhoto.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // Preparar objeto de arquivo para FormData
        const photoFile = {
          uri: newGroupPhoto,
          name: filename || `group_photo_${Date.now()}.jpg`,
          type: type,
        };

        formData.append('photo', photoFile);

        console.log('📤 GroupSettings - FormData preparado:', { 
          name: editedGroupName, 
          description: editedDescription,
          photo: { 
            filename: photoFile.name, 
            type: photoFile.type,
            uri: newGroupPhoto.substring(0, 50) + '...' // Log parcial da URI
          }
        });

        console.log('📤 GroupSettings - Chamando groupService.updateGroup...');
        console.log('📤 GroupSettings - Grupo ID:', groupId);
        console.log('📤 GroupSettings - FormData preparado, enviando...');
        try {
          const result = await groupService.updateGroup(groupId, formData);
          console.log('📤 GroupSettings - Resposta recebida:', result);
        } catch (error) {
          console.error('❌ GroupSettings - ERRO ao chamar updateGroup:', error);
          console.error('❌ GroupSettings - Erro completo:', JSON.stringify(error, null, 2));
          throw error;
        }
        
        if (result.success) {
          console.log('✅ GroupSettings - Dados e foto salvos!');
          console.log('✅ GroupSettings - Resultado completo:', JSON.stringify(result.data, null, 2));
          
          // Tentar pegar a URL da foto da resposta (verificar vários campos possíveis)
          const photoUrl = result.data?.photo_url || 
                          result.data?.photo || 
                          result.data?.url ||
                          result.data?.group?.photo_url ||
                          result.data?.group?.photo ||
                          result.data?.data?.photo_url ||
                          result.data?.data?.photo;
          
          console.log('📸 GroupSettings - URL da foto encontrada na resposta:', photoUrl);
          console.log('📸 GroupSettings - Estrutura completa da resposta:', {
            keys: Object.keys(result.data || {}),
            hasPhotoUrl: !!result.data?.photo_url,
            hasPhoto: !!result.data?.photo,
            photoUrl: result.data?.photo_url,
            fullData: result.data,
          });
          
          // Se não encontrou photo_url, recarregar o grupo para pegar a foto atualizada
          if (!photoUrl) {
            console.log('⚠️ GroupSettings - photo_url não encontrado na resposta, recarregando grupo...');
            setTimeout(async () => {
              const groupResult = await groupService.getGroup(groupId);
              if (groupResult.success && groupResult.data?.photo_url) {
                console.log('📸 GroupSettings - photo_url encontrado após recarregar:', groupResult.data.photo_url);
                const reloadedPhotoUrl = groupResult.data.photo_url;
                const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
                const fullPhotoUrl = reloadedPhotoUrl.startsWith('http') 
                  ? reloadedPhotoUrl 
                  : (reloadedPhotoUrl.startsWith('/') ? `${baseUrl}${reloadedPhotoUrl}` : `${baseUrl}/${reloadedPhotoUrl}`);
                const timestamp = Date.now();
                const newPhotoUrl = `${fullPhotoUrl}?t=${timestamp}`;
                setNewGroupPhoto(null);
                setGroupPhotoUrl(newPhotoUrl);
                setPhotoKey(timestamp);
                setImageSource({ uri: newPhotoUrl, cache: 'reload' });
                console.log('📸 GroupSettings - Foto atualizada após recarregar grupo');
              }
            }, 500);
          }
          
          Toast.show({
            type: 'success',
            text1: 'Sucesso!',
            text2: 'Informações e foto atualizadas',
          });
          
          // Se temos a URL na resposta, atualizar groupPhotoUrl e limpar newGroupPhoto imediatamente
          if (photoUrl) {
            // Construir URL completa se necessário
            let fullPhotoUrl = photoUrl;
            if (!photoUrl.startsWith('http')) {
              const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
              fullPhotoUrl = photoUrl.startsWith('/') 
                ? `${baseUrl}${photoUrl}` 
                : `${baseUrl}/${photoUrl}`;
            }
            
            // Adicionar timestamp para forçar reload
            const separator = fullPhotoUrl.includes('?') ? '&' : '?';
            const timestamp = Date.now();
            const newPhotoUrl = `${fullPhotoUrl}${separator}t=${timestamp}`;
            console.log('📸 GroupSettings - Atualizando groupPhotoUrl imediatamente:', newPhotoUrl);
            console.log('📸 GroupSettings - Comparando URLs:', {
              current: groupPhotoUrl ? groupPhotoUrl.split('?')[0] : null,
              new: fullPhotoUrl,
              changed: groupPhotoUrl ? groupPhotoUrl.split('?')[0] !== fullPhotoUrl : true
            });
            
            // Atualizar tudo de uma vez para garantir sincronização
            // Primeiro limpar newGroupPhoto, depois atualizar groupPhotoUrl e photoKey
            setNewGroupPhoto(null);
            setGroupPhotoUrl(newPhotoUrl);
            setPhotoKey(timestamp);
            
            // Atualizar imageSource para forçar remount completo do componente Image
            setImageSource({ uri: newPhotoUrl, cache: 'reload' });
            
            console.log('📸 GroupSettings - Estados atualizados: newGroupPhoto=null, groupPhotoUrl=' + newPhotoUrl);
            
            // Recarregar dados do grupo após salvar para garantir que temos a foto mais recente
            setTimeout(async () => {
              console.log('📸 GroupSettings - Recarregando dados do grupo após salvar...');
              await loadGroupData();
            }, 300);
          } else {
            console.warn('⚠️ GroupSettings - Foto salva mas não há URL na resposta. Recarregando dados...');
            // Se não temos URL, recarregar dados e tentar novamente
            setTimeout(async () => {
              await loadGroupData();
              // Limpar newGroupPhoto após recarregar
              setNewGroupPhoto(null);
            }, 1000);
          }
          
          // Recarregar dados do servidor para garantir sincronização completa
          // IMPORTANTE: Aguardar mais tempo para garantir que o backend processou o upload
          setTimeout(async () => {
            console.log('🔄 GroupSettings - Recarregando dados do grupo após salvar foto...');
            console.log('🔄 GroupSettings - Grupo ID:', groupId);
            const reloadResult = await groupService.getGroup(groupId);
            console.log('🔄 GroupSettings - Dados recarregados:', {
              success: reloadResult.success,
              hasPhotoUrl: !!reloadResult.data?.photo_url,
              photoUrl: reloadResult.data?.photo_url,
              photo: reloadResult.data?.photo,
              groupId: reloadResult.data?.id,
              groupName: reloadResult.data?.name,
            });
            
            // VERIFICAÇÃO CRÍTICA: Verificar se o grupo retornado é o correto
            if (reloadResult.data?.id !== groupId) {
              console.error('❌ GroupSettings - ERRO: Grupo retornado não corresponde!', {
                esperado: groupId,
                recebido: reloadResult.data?.id,
              });
            }
            
            if (reloadResult.success && reloadResult.data) {
              const reloadedPhotoUrl = reloadResult.data.photo_url;
              if (reloadedPhotoUrl) {
                // Construir URL completa se necessário
                let fullPhotoUrl = reloadedPhotoUrl;
                if (!reloadedPhotoUrl.startsWith('http')) {
                  const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
                  fullPhotoUrl = reloadedPhotoUrl.startsWith('/') 
                    ? `${baseUrl}${reloadedPhotoUrl}` 
                    : `${baseUrl}/${reloadedPhotoUrl}`;
                }
                
                // Adicionar cache-busting
                const separator = fullPhotoUrl.includes('?') ? '&' : '?';
                const timestamp = Date.now();
                const newPhotoUrl = `${fullPhotoUrl}${separator}t=${timestamp}`;
                
                console.log('🔄 GroupSettings - Atualizando com foto recarregada:', newPhotoUrl);
                console.log('🔄 GroupSettings - Verificando se é a foto correta do grupo', groupId);
                setGroupPhotoUrl(newPhotoUrl);
                setPhotoKey(timestamp);
                setImageSource({ uri: newPhotoUrl, cache: 'reload' });
                setNewGroupPhoto(null); // Garantir que newGroupPhoto está limpo
              }
            }
          }, 2000);
        } else {
          console.error('❌ GroupSettings - Erro ao salvar:', result.error);
          console.error('❌ GroupSettings - Detalhes do erro:', JSON.stringify(result, null, 2));
          Alert.alert(
            'Erro ao Salvar Foto', 
            result.error || 'Não foi possível atualizar a foto do grupo. Verifique os logs para mais detalhes.'
          );
        }
      } else {
        // Sem foto nova, enviar apenas os dados
        console.log('💾 GroupSettings.saveGroupBasicInfo - Sem foto nova, verificando mudanças nos dados...');
        const nameChanged = editedGroupName !== groupData?.name;
        const descChanged = editedDescription !== (groupData?.description || '');
        
        console.log('💾 GroupSettings.saveGroupBasicInfo - Verificando mudanças:', {
          nameChanged,
          descChanged,
          name: editedGroupName,
          currentName: groupData?.name,
        });
        
        // Verificar se há mudanças (incluindo sinais vitais e permissões)
        const vitalSignsChanged = Object.keys(vitalSigns).some(key => {
          const currentValue = groupData?.[key] || false;
          return vitalSigns[key] !== currentValue;
        });
        const permissionsChanged = Object.keys(permissions).some(key => {
          const currentValue = groupData?.[key] !== undefined ? groupData[key] : (key === 'accompanied_access_chat' ? false : true);
          return permissions[key] !== currentValue;
        });
        
        console.log('💾 GroupSettings.saveGroupBasicInfo - Mudanças detectadas:', {
          nameChanged,
          descChanged,
          vitalSignsChanged,
          permissionsChanged,
        });
        
        if (nameChanged || descChanged || vitalSignsChanged || permissionsChanged) {
          console.log('💾 GroupSettings.saveGroupBasicInfo - Há mudanças, salvando...');
          const updateData = {
            name: editedGroupName,
            description: editedDescription,
            ...vitalSigns,
            ...permissions,
          };
          
          console.log('💾 GroupSettings.saveGroupBasicInfo - Dados para enviar:', updateData);
          console.log('💾 GroupSettings.saveGroupBasicInfo - Chamando groupService.updateGroup...');
          const result = await groupService.updateGroup(groupId, updateData);
          console.log('💾 GroupSettings.saveGroupBasicInfo - Resultado recebido:', result);
          
          if (result.success) {
            Toast.show({
              type: 'success',
              text1: 'Sucesso!',
              text2: 'Informações atualizadas',
            });
            
            setTimeout(() => {
              loadGroupData();
            }, 1000);
          } else {
            Alert.alert('Erro', result.error || 'Não foi possível atualizar');
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      Alert.alert('Erro', 'Não foi possível atualizar as informações');
    } finally {
      setSaving(false);
    }
  };

  const toggleVitalSign = (key) => {
    setVitalSigns(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const togglePermission = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Gerenciamento de membros
  const handlePromoteToAdmin = (member) => {
    if (!isAdmin) {
      Toast.show({
        type: 'error',
        text1: 'Sem Permissão',
        text2: 'Apenas administradores podem promover membros',
      });
      return;
    }

    Alert.alert(
      'Promover para Administrador',
      `Deseja promover ${member.user?.name} para administrador?\n\nEle terá acesso total às configurações do grupo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Promover',
          style: 'default',
          onPress: async () => {
            try {
              const result = await groupMemberService.promoteMemberToAdmin(groupId, member.id);
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Sucesso!',
                  text2: `${member.user?.name} agora é administrador`,
                });
                loadGroupData();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: result.error || 'Não foi possível promover o membro',
                });
              }
            } catch (error) {
              console.error('Erro ao promover membro:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível promover o membro',
              });
            }
          },
        },
      ]
    );
  };

  const handleDemoteAdmin = (member) => {
    if (!isAdmin) return;

    Alert.alert(
      'Remover Administrador',
      `Deseja rebaixar ${member.user?.name} para cuidador?\n\nEle perderá acesso às configurações do grupo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rebaixar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await groupMemberService.demoteAdminToCaregiver(groupId, member.id);
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Sucesso!',
                  text2: `${member.user?.name} agora é cuidador`,
                });
                loadGroupData();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: result.error || 'Não foi possível rebaixar',
                });
              }
            } catch (error) {
              console.error('Erro ao rebaixar:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível rebaixar membro',
              });
            }
          },
        },
      ]
    );
  };

  const handlePatientToCaregiver = (member) => {
    if (!isAdmin) return;

    Alert.alert(
      'Transformar em Cuidador',
      `Deseja transformar ${member.user?.name} de paciente para cuidador?\n\nO grupo ficará sem paciente designado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              // Usa o mesmo método de demote para trocar role
              const result = await groupMemberService.demoteAdminToCaregiver(groupId, member.id);
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Sucesso!',
                  text2: `${member.user?.name} agora é cuidador`,
                });
                loadGroupData();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: result.error || 'Não foi possível alterar',
                });
              }
            } catch (error) {
              console.error('Erro ao transformar paciente em cuidador:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível alterar',
              });
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member) => {
    if (!isAdmin) return;

    // Não pode remover a si mesmo
    if (member.user_id === user?.id) {
      Toast.show({
        type: 'error',
        text1: 'Não Permitido',
        text2: 'Você não pode remover a si mesmo do grupo',
      });
      return;
    }

    Alert.alert(
      'Remover Membro',
      `Deseja remover ${member.user?.name} do grupo?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await groupMemberService.removeMember(groupId, member.id);
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Membro Removido',
                  text2: `${member.user?.name} foi removido do grupo`,
                });
                loadGroupData();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: result.error || 'Não foi possível remover o membro',
                });
              }
            } catch (error) {
              console.error('Erro ao remover membro:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível remover o membro',
              });
            }
          },
        },
      ]
    );
  };

  const handleChangePatient = (member) => {
    if (!isAdmin) return;

    // Só pode trocar se for um cuidador
    if (member.role === 'patient') {
      Toast.show({
        type: 'info',
        text1: 'Info',
        text2: 'Este membro já é o paciente',
      });
      return;
    }

    // Encontrar paciente atual
    const currentPatient = members.find(m => m.role === 'patient');

    Alert.alert(
      'Trocar Paciente',
      `Deseja tornar ${member.user?.name} o paciente do grupo?\n\n${currentPatient ? `${currentPatient.user?.name} voltará a ser cuidador.` : 'Esta pessoa será o novo paciente.'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              const result = await groupMemberService.changePatient(
                groupId,
                currentPatient?.id || null,
                member.id
              );
              
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Paciente Alterado',
                  text2: `${member.user?.name} agora é o paciente`,
                });
                loadGroupData();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: result.error || 'Não foi possível trocar o paciente',
                });
              }
            } catch (error) {
              console.error('Erro ao trocar paciente:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível trocar o paciente',
              });
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = async () => {
    const groupNameToConfirm = groupName || groupData?.name || '';
    
    if (deleteConfirmText !== groupNameToConfirm) {
      Alert.alert('Erro', 'O nome digitado não confere com o nome do grupo');
      return;
    }

    try {
      setDeleting(true);
      const result = await groupService.deleteGroup(groupId);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Grupo Excluído',
          text2: 'O grupo foi excluído com sucesso',
        });
        
        // Navegar de volta para a home
        // Como estamos dentro do GroupsStack, precisamos navegar para o Tab Navigator pai
        // Primeiro, tentar obter o parent (Tab Navigator)
        const parent = navigation.getParent();
        if (parent) {
          // Resetar a navegação do Tab Navigator para Home
          parent.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } else {
          // Fallback: tentar navegar diretamente
          // Isso pode funcionar se o React Navigation estiver configurado para permitir navegação entre tabs
          navigation.navigate('Home');
        }
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível excluir o grupo');
      }
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      Alert.alert('Erro', 'Não foi possível excluir o grupo');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  };

  const handleSave = async () => {
    console.log('💾 GroupSettings.handleSave - ==========================================');
    console.log('💾 GroupSettings.handleSave - INICIANDO salvamento de configurações');
    console.log('💾 GroupSettings.handleSave - ==========================================');
    console.log('💾 GroupSettings.handleSave - Grupo ID:', groupId);
    console.log('💾 GroupSettings.handleSave - Sinais vitais:', vitalSigns);
    console.log('💾 GroupSettings.handleSave - Permissões:', permissions);
    console.log('💾 GroupSettings.handleSave - newGroupPhoto existe?', !!newGroupPhoto);
    console.log('💾 GroupSettings.handleSave - newGroupPhoto URI:', newGroupPhoto);
    console.log('💾 GroupSettings.handleSave - typeof newGroupPhoto:', typeof newGroupPhoto);
    
    setSaving(true);
    try {
      // Se houver uma nova foto, salvar junto com as configurações
      console.log('💾 GroupSettings.handleSave - Verificando se há foto nova antes de salvar...');
      console.log('💾 GroupSettings.handleSave - newGroupPhoto:', newGroupPhoto);
      console.log('💾 GroupSettings.handleSave - !!newGroupPhoto:', !!newGroupPhoto);
      
      if (newGroupPhoto) {
        console.log('💾 GroupSettings.handleSave - ✅ HÁ FOTO NOVA! Salvando foto e configurações juntas...');
        console.log('💾 GroupSettings.handleSave - newGroupPhoto URI completo:', newGroupPhoto);
        
        // Usar saveGroupBasicInfo que já tem a lógica de upload de foto
        // Mas primeiro adicionar as configurações ao FormData
        const formData = new FormData();
        formData.append('name', editedGroupName || groupData?.name || '');
        formData.append('description', editedDescription || groupData?.description || '');
        
        // Adicionar permissões do acompanhado
        Object.keys(permissions).forEach(key => {
          formData.append(key, permissions[key] ? '1' : '0');
        });
        
        // Adicionar foto - IMPORTANTE: usar o formato correto para React Native
        const filename = newGroupPhoto.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        console.log('💾 GroupSettings.handleSave - Preparando arquivo:', {
          filename,
          type,
          uri: newGroupPhoto,
        });
        
        const photoFile = {
          uri: newGroupPhoto,
          name: filename || `group_photo_${Date.now()}.jpg`,
          type: type,
        };
        
        formData.append('photo', photoFile);
        
        // Log do FormData para debug
        console.log('💾 GroupSettings.handleSave - FormData preparado:');
        for (let pair of formData.entries()) {
          if (pair[1] && typeof pair[1] === 'object' && pair[1].uri) {
            console.log(`  - ${pair[0]}: [FILE] ${pair[1].name} (${pair[1].type})`);
          } else {
            console.log(`  - ${pair[0]}: ${pair[1]}`);
          }
        }
        
        console.log('💾 GroupSettings.handleSave - Chamando groupService.updateGroup com FormData...');
        const result = await groupService.updateGroup(groupId, formData);
        console.log('💾 GroupSettings.handleSave - Resultado do updateGroup:', {
          success: result.success,
          hasData: !!result.data,
          photo_url: result.data?.photo_url,
          photo: result.data?.photo,
        });
        
        if (result.success) {
          Toast.show({
            type: 'success',
            text1: 'Sucesso!',
            text2: 'Configurações e foto salvas com sucesso',
          });
          
          // Limpar newGroupPhoto e atualizar groupPhotoUrl
          if (result.data?.photo_url) {
            const photoUrl = result.data.photo_url;
            let fullPhotoUrl = photoUrl;
            if (!photoUrl.startsWith('http')) {
              const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
              fullPhotoUrl = photoUrl.startsWith('/') 
                ? `${baseUrl}${photoUrl}` 
                : `${baseUrl}/${photoUrl}`;
            }
            const separator = fullPhotoUrl.includes('?') ? '&' : '?';
            const timestamp = Date.now();
            const newPhotoUrl = `${fullPhotoUrl}${separator}t=${timestamp}`;
            setNewGroupPhoto(null);
            setGroupPhotoUrl(newPhotoUrl);
            setPhotoKey(timestamp);
            setImageSource({ uri: newPhotoUrl, cache: 'reload' });
          }
          
          setTimeout(() => {
            console.log('💾 GroupSettings.handleSave - Recarregando dados do grupo...');
            loadGroupData();
          }, 500);
          return;
        } else {
          Alert.alert('Erro', result.error || 'Não foi possível salvar as configurações');
          return;
        }
      }
      
      // Sem foto nova, salvar apenas configurações
      console.log('💾 GroupSettings.handleSave - ⚠️ NÃO HÁ FOTO NOVA, salvando apenas configurações...');
      console.log('💾 GroupSettings.handleSave - newGroupPhoto:', newGroupPhoto);
      console.log('💾 GroupSettings.handleSave - typeof newGroupPhoto:', typeof newGroupPhoto);
      
      const updateData = {
        ...permissions,
      };
      
      console.log('💾 GroupSettings.handleSave - Dados para enviar:', updateData);
      console.log('💾 GroupSettings.handleSave - Chamando groupService.updateGroup...');
      
      const result = await groupService.updateGroup(groupId, updateData);
      
      console.log('💾 GroupSettings.handleSave - Resultado recebido:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error,
        fullResult: result,
      });
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Sucesso!',
          text2: 'Configurações salvas com sucesso',
        });
        
        // Recarregar dados do grupo
        setTimeout(() => {
          console.log('💾 GroupSettings.handleSave - Recarregando dados do grupo...');
          loadGroupData();
        }, 500);
      } else {
        console.error('❌ GroupSettings.handleSave - Erro ao salvar:', result.error);
        Alert.alert('Erro', result.error || 'Não foi possível salvar as configurações');
      }
    } catch (error) {
      console.error('❌ GroupSettings.handleSave - Erro ao salvar configurações:', error);
      console.error('❌ GroupSettings.handleSave - Stack trace:', error.stack);
      Alert.alert('Erro', 'Erro ao salvar configurações: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const vitalSignsConfig = [
    {
      key: 'monitor_blood_pressure',
      label: 'Pressão Arterial',
      icon: 'pulse',
      description: 'Alerta: >160/100 ou <90/60 mmHg',
      color: colors.error,
    },
    {
      key: 'monitor_heart_rate',
      label: 'Frequência Cardíaca',
      icon: 'heart',
      description: 'Alerta: >110 ou <50 bpm',
      color: colors.secondary,
    },
    {
      key: 'monitor_oxygen_saturation',
      label: 'Saturação de Oxigênio',
      icon: 'water',
      description: 'Alerta: <90%',
      color: colors.info,
    },
    {
      key: 'monitor_blood_glucose',
      label: 'Glicemia',
      icon: 'fitness',
      description: 'Alerta: >200 ou <60 mg/dL',
      color: colors.warning,
    },
    {
      key: 'monitor_temperature',
      label: 'Temperatura Corporal',
      icon: 'thermometer',
      description: 'Limites podem ser ajustados',
      color: colors.success,
    },
    {
      key: 'monitor_respiratory_rate',
      label: 'Frequência Respiratória',
      icon: 'leaf',
      description: 'Alerta: >25 ou <12 ipm',
      color: colors.primary,
    },
  ];

  const permissionsConfig = [
    {
      key: 'accompanied_notify_medication',
      label: 'Notificar Remédio',
      description: 'Alertas de horário de medicação',
      icon: MedicationIcon,
    },
    {
      key: 'accompanied_notify_appointment',
      label: 'Notificar Lembrete de Consulta',
      description: 'Lembretes de consultas agendadas',
      icon: AppointmentIcon,
    },
    {
      key: 'accompanied_access_history',
      label: 'Histórico',
      description: 'Visualizar histórico de cuidados',
      icon: MedicalHistoryIcon,
    },
    {
      key: 'accompanied_access_medication',
      label: 'Remédios',
      description: 'Ver lista de medicamentos',
      icon: MedicationIcon,
    },
    {
      key: 'accompanied_access_schedule',
      label: 'Agenda',
      description: 'Acessar calendário de consultas',
      icon: AppointmentIcon,
    },
    {
      key: 'accompanied_access_chat',
      label: 'Chat',
      description: 'Conversar com cuidadores',
      icon: MessagesIcon,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Configurações</Text>
          <Text style={styles.headerSubtitle}>{groupName || 'Grupo'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Informações Básicas do Grupo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SafeIcon name="information-circle" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Informações do Grupo</Text>
          </View>

          {/* Foto do Grupo */}
          {isAdmin && (
            <View style={styles.photoSection}>
              <Text style={styles.label}>Foto do Grupo</Text>
              {(newGroupPhoto || groupPhotoUrl) ? (
                <View style={styles.photoContainer}>
                  <Image 
                    key={`photo-${photoKey}-${newGroupPhoto ? 'local-' + Date.now() : 'server-' + (groupPhotoUrl ? groupPhotoUrl.split('/').pop() : 'none')}`}
                    source={newGroupPhoto 
                      ? { uri: newGroupPhoto, cache: 'reload' }
                      : (imageSource || { uri: groupPhotoUrl, cache: 'reload' })
                    } 
                    style={styles.groupPhotoLarge}
                    onError={(error) => {
                      console.error('❌ Erro ao carregar imagem:', error);
                      console.error('❌ URI tentada:', newGroupPhoto || groupPhotoUrl);
                      console.error('❌ newGroupPhoto existe?', !!newGroupPhoto);
                      console.error('❌ groupPhotoUrl:', groupPhotoUrl);
                      // Se a foto do servidor falhar e tiver foto local, usar a local
                      if (!newGroupPhoto && groupPhotoUrl) {
                        console.log('⚠️ Tentando recarregar foto do servidor...');
                        setTimeout(() => {
                          setPhotoKey(Date.now());
                        }, 1000);
                      }
                    }}
                    onLoad={() => {
                      console.log('✅ Imagem carregada com sucesso');
                      console.log('✅ URI carregada:', newGroupPhoto || groupPhotoUrl);
                      console.log('✅ newGroupPhoto existe?', !!newGroupPhoto);
                    }}
                  />
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={styles.photoActionButton}
                      onPress={pickGroupPhoto}
                      activeOpacity={0.7}
                    >
                      <SafeIcon name="camera" size={20} color={colors.primary} />
                      <Text style={styles.photoActionText}>Trocar</Text>
                    </TouchableOpacity>
                    {newGroupPhoto && (
                      <TouchableOpacity
                        style={[styles.photoActionButton, { backgroundColor: colors.success }]}
                        onPress={savePhotoOnly}
                        activeOpacity={0.7}
                        disabled={saving}
                      >
                        <SafeIcon name="checkmark-circle" size={20} color={colors.textWhite} />
                        <Text style={[styles.photoActionText, { color: colors.textWhite }]}>
                          {saving ? 'Salvando...' : 'Salvar Foto'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.photoActionButton, styles.photoRemoveButton]}
                      onPress={removeGroupPhoto}
                      activeOpacity={0.7}
                    >
                      <SafeIcon name="trash-outline" size={20} color={colors.error} />
                      <Text style={[styles.photoActionText, { color: colors.error }]}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={pickGroupPhoto}
                  activeOpacity={0.7}
                >
                  <SafeIcon name="camera" size={48} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Adicionar Foto</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Grupo</Text>
            <TextInput
              style={styles.input}
              value={editedGroupName}
              onChangeText={setEditedGroupName}
              placeholder="Nome do grupo"
              placeholderTextColor={colors.gray400}
              editable={isAdmin}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editedDescription}
              onChangeText={setEditedDescription}
              placeholder="Descrição do grupo"
              placeholderTextColor={colors.gray400}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={isAdmin}
            />
          </View>

          {(() => {
            const hasChanges = editedGroupName !== groupData?.name || editedDescription !== (groupData?.description || '') || newGroupPhoto;
            console.log('🔘 GroupSettings - Verificando se botão deve aparecer:', {
              isAdmin,
              hasChanges,
              editedGroupName,
              currentName: groupData?.name,
              editedDescription,
              currentDescription: groupData?.description,
              newGroupPhoto: !!newGroupPhoto,
            });
            return null; // Não renderizar nada aqui, apenas logar
          })()}
          {isAdmin && (editedGroupName !== groupData?.name || editedDescription !== (groupData?.description || '') || newGroupPhoto) && (
            <TouchableOpacity
              style={[styles.saveBasicInfoButton, saving && styles.saveBasicInfoButtonDisabled]}
              onPress={() => {
                console.log('🔘 GroupSettings - Botão "Salvar Alterações" CLICADO!');
                console.log('🔘 GroupSettings - newGroupPhoto:', newGroupPhoto);
                saveGroupBasicInfo();
              }}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={colors.textWhite} />
              ) : (
                <>
                  <SafeIcon name="checkmark-circle" size={20} color={colors.textWhite} />
                  <Text style={styles.saveBasicInfoText}>Salvar Alterações</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Código do Grupo para Compartilhar */}
        {(() => {
          const code = groupData?.code || groupData?.access_code;
          const hasCode = code && code !== 'NULL' && code !== 'null' && String(code).trim() !== '';
          if (!hasCode) return null;
          
          return (
            <View style={styles.codeSection}>
              <View style={styles.codeHeader}>
                <SafeIcon name="key" size={24} color={colors.secondary} />
                <Text style={styles.codeHeaderTitle}>Código do Grupo</Text>
              </View>
              <Text style={styles.codeDescription}>
                Compartilhe este código com participantes que querem entrar no grupo
              </Text>
              
              <View style={styles.codeCard}>
                <View style={styles.codeDisplay}>
                  <Text style={styles.codeLabel}>Código:</Text>
                  <Text style={styles.codeText}>{code || 'N/A'}</Text>
                </View>
                
                <View style={styles.codeActions}>
                  <TouchableOpacity
                    style={styles.codeActionButton}
                    onPress={copyCodeToClipboard}
                  >
                    <SafeIcon name="copy-outline" size={20} color={colors.primary} />
                    <Text style={styles.codeActionText}>Copiar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.codeActionButton, styles.shareButton]}
                    onPress={shareCode}
                  >
                    <SafeIcon name="share-social-outline" size={20} color={colors.textWhite} />
                    <Text style={[styles.codeActionText, styles.shareButtonText]}>Compartilhar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.codeInfoCard}>
                <SafeIcon name="information-circle" size={20} color={colors.info} />
                <Text style={styles.codeInfoText}>
                  Os participantes devem usar este código para entrar no grupo através da opção "Entrar com Código"
                </Text>
              </View>
            </View>
          );
        })()}

        {/* Botão de Pânico */}
        <TouchableOpacity
          style={styles.panicCard}
          onPress={() => navigation.navigate('PanicSettings', { groupId, groupName })}
          activeOpacity={0.7}
        >
          <View style={styles.panicIconContainer}>
            <SafeIcon name="warning" size={28} color={colors.white} />
          </View>
          <View style={styles.panicInfo}>
            <Text style={styles.panicTitle}>Botão de Pânico</Text>
            <Text style={styles.panicDescription}>
              Configure emergências e contatos prioritários
            </Text>
          </View>
          <SafeIcon name="chevron-forward" size={24} color={colors.gray400} />
        </TouchableOpacity>

        {/* Botão de Gerenciar Contatos */}
        <View style={styles.quickActionSection}>
          <TouchableOpacity
            style={styles.contactsButton}
            onPress={() => navigation.navigate('GroupContacts', { groupId })}
          >
            <View style={styles.contactsButtonIcon}>
              <SafeIcon name="call" size={24} color={colors.textWhite} />
            </View>
            <View style={styles.contactsButtonContent}>
              <Text style={styles.contactsButtonTitle}>Gerenciar Contatos</Text>
              <Text style={styles.contactsButtonSubtitle}>
                Configure contatos rápidos e SOS para o paciente
              </Text>
            </View>
            <SafeIcon name="chevron-forward" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Membros do Grupo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SafeIcon name="people" size={24} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Membros do Grupo</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Pessoas que fazem parte deste grupo de cuidados
          </Text>

          {/* Lista de Membros Real */}
          {members.length > 0 ? (
              <>
                {members.map((member) => {
                  const memberIsAdmin = member.role === 'admin';
                  const memberIsPatient = member.role === 'patient';
                  const memberIsCaregiver = member.role === 'caregiver';

                  // Card do paciente é clicável para editar dados
                  const CardComponent = memberIsPatient ? TouchableOpacity : View;
                  const cardProps = memberIsPatient ? {
                    onPress: () => navigation.navigate('EditPatientData', { groupId, groupName }),
                    activeOpacity: 0.7,
                  } : {};

                  return (
                    <CardComponent 
                      key={member.id} 
                      style={[
                        styles.memberCard,
                        memberIsPatient && styles.patientCard
                      ]}
                      {...cardProps}
                    >
                      <View style={[
                        styles.memberAvatar,
                        memberIsPatient && styles.patientAvatar
                      ]}>
                        <SafeIcon 
                          name={memberIsPatient ? 'heart' : 'person'} 
                          size={32} 
                          color={memberIsPatient ? colors.secondary : colors.primary} 
                        />
                      </View>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberHeader}>
                          <Text style={styles.memberName}>
                            {member.name || member.user?.name || 'Membro'}
                          </Text>
                          {memberIsAdmin && (
                            <View style={styles.adminBadge}>
                              <SafeIcon name="shield-checkmark" size={14} color={colors.primary} />
                              <Text style={styles.adminBadgeText}>Administrador</Text>
                            </View>
                          )}
                          {memberIsPatient && (
                            <>
                              <View style={styles.patientBadge}>
                                <SafeIcon name="medkit" size={14} color={colors.secondary} />
                                <Text style={styles.patientBadgeText}>Paciente</Text>
                              </View>
                              <View style={styles.editIconContainer}>
                                <SafeIcon name="create-outline" size={18} color={colors.secondary} />
                              </View>
                            </>
                          )}
                          {memberIsCaregiver && !memberIsAdmin && member.profile !== 'professional_caregiver' && (
                            <View style={styles.caregiverBadge}>
                              <SafeIcon name="heart" size={14} color={colors.info} />
                              <Text style={styles.caregiverBadgeText}>Cuidador</Text>
                            </View>
                          )}
                        </View>
                        {memberIsCaregiver && !memberIsAdmin && member.profile === 'professional_caregiver' && (
                          <View style={styles.professionalCaregiverBadge}>
                            <SafeIcon name="medical" size={14} color={colors.success} />
                            <Text style={styles.professionalCaregiverBadgeText}>Cuidador profissional</Text>
                          </View>
                        )}
                        <Text style={styles.memberRole}>
                          {memberIsAdmin ? 'Cuidador Principal' : 
                           memberIsPatient ? 'Pessoa Acompanhada' : 
                           member.profile === 'professional_caregiver' ? 'Cuidador profissional' :
                           'Cuidador'}
                        </Text>
                        {member.joined_at && (
                          <View style={styles.memberDetail}>
                            <SafeIcon name="calendar-outline" size={14} color={colors.textLight} />
                            <Text style={styles.memberDetailText}>
                              Entrou em: {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                            </Text>
                          </View>
                        )}
                        {(member.email || member.user?.email) && (
                          <View style={styles.memberDetail}>
                            <SafeIcon name="mail-outline" size={14} color={colors.textLight} />
                            <Text style={styles.memberDetailText}>
                              {member.email || member.user?.email}
                            </Text>
                          </View>
                        )}
                        
                        {/* Botões de Ação (só visíveis para admin e não para si mesmo) */}
                        {(() => {
                          const shouldShowActions = isAdmin && member.user_id !== user?.id;
                          console.log(`🔧 Membro: ${member.name || member.user?.name} | isAdmin: ${isAdmin} | member.user_id: ${member.user_id} | user.id: ${user?.id} | Mostrar ações: ${shouldShowActions}`);
                          return shouldShowActions;
                        })() && (
                          <View style={styles.memberActions}>
                            {/* Promover/Rebaixar Admin ou Tornar Cuidador (se for paciente) */}
                            {member.role === 'admin' ? (
                              <TouchableOpacity
                                style={[styles.actionButton, styles.demoteButton]}
                                onPress={() => handleDemoteAdmin(member)}
                                activeOpacity={0.7}
                              >
                                <SafeIcon name="arrow-down-circle-outline" size={18} color={colors.warning} />
                                <Text style={[styles.actionButtonText, { color: colors.warning }]}>
                                  Rebaixar
                                </Text>
                              </TouchableOpacity>
                            ) : member.role === 'caregiver' ? (
                              <TouchableOpacity
                                style={[styles.actionButton, styles.promoteButton]}
                                onPress={() => handlePromoteToAdmin(member)}
                                activeOpacity={0.7}
                              >
                                <SafeIcon name="arrow-up-circle-outline" size={18} color={colors.success} />
                                <Text style={[styles.actionButtonText, { color: colors.success }]}>
                                  Promover
                                </Text>
                              </TouchableOpacity>
                            ) : member.role === 'patient' ? (
                              <TouchableOpacity
                                style={[styles.actionButton, styles.changePatientButton]}
                                onPress={() => handlePatientToCaregiver(member)}
                                activeOpacity={0.7}
                              >
                                <SafeIcon name="people-outline" size={18} color={colors.info} />
                                <Text style={[styles.actionButtonText, { color: colors.info }]}>
                                  Tornar Cuidador
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                            
                            {/* Trocar Paciente (só para não-pacientes e não para cuidador profissional) */}
                            {member.role !== 'patient' && member.profile !== 'professional_caregiver' && (
                              <TouchableOpacity
                                style={[styles.actionButton, styles.changePatientButton]}
                                onPress={() => handleChangePatient(member)}
                                activeOpacity={0.7}
                              >
                                <SafeIcon name="swap-horizontal-outline" size={18} color={colors.info} />
                                <Text style={[styles.actionButtonText, { color: colors.info }]}>
                                  Tornar Paciente
                                </Text>
                              </TouchableOpacity>
                            )}
                            
                            {/* Remover (sempre visível) */}
                            <TouchableOpacity
                              style={[styles.actionButton, styles.removeButton]}
                              onPress={() => handleRemoveMember(member)}
                              activeOpacity={0.7}
                            >
                              <SafeIcon name="trash-outline" size={18} color={colors.error} />
                              <Text style={[styles.actionButtonText, { color: colors.error }]}>
                                Remover
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </CardComponent>
                  );
                })}
              </>
            ) : (
              <View style={styles.emptyMembersCard}>
                <SafeIcon name="people-outline" size={48} color={colors.gray300} />
                <Text style={styles.emptyMembersText}>Nenhum membro no grupo</Text>
              </View>
            )}

            <View style={styles.membersInfoCard}>
              <SafeIcon name="information-circle" size={20} color={colors.info} />
              <Text style={styles.membersInfoText}>
                Atualmente este grupo tem {members.length} membro{members.length !== 1 ? 's' : ''}.
              </Text>
            </View>
          </View>

        {/* Permissões do Acompanhado */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
              <PermissionsIcon size={24} color={colors.secondary} />
            </View>
            <Text style={styles.sectionTitle}>Telas do Acompanhado</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Configure quais funcionalidades e notificações estarão disponíveis no aplicativo do
            acompanhado.
          </Text>

          {permissionsConfig.map((item) => {
            const IconComponent = item.icon;
            return (
              <View key={item.key} style={styles.settingCard}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '20' }]}>
                    <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                      <IconComponent size={24} color={colors.secondary} />
                    </View>
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                </View>
                <Switch
                  value={permissions[item.key]}
                  onValueChange={() => togglePermission(item.key)}
                  trackColor={{ false: colors.gray200, true: colors.secondary + '60' }}
                  thumbColor={permissions[item.key] ? colors.secondary : colors.gray400}
                />
              </View>
            );
          })}
        </View>

        {/* Botão Salvar */}
        {(() => {
          console.log('🔘 GroupSettings - Renderizando botão "Salvar Configurações"');
          console.log('🔘 GroupSettings - saving:', saving);
          console.log('🔘 GroupSettings - isAdmin:', isAdmin);
          console.log('🔘 GroupSettings - newGroupPhoto:', newGroupPhoto);
          return null;
        })()}
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={() => {
              console.log('🔘 GroupSettings - Botão "Salvar Configurações" CLICADO!');
              console.log('🔘 GroupSettings - newGroupPhoto antes de chamar handleSave:', newGroupPhoto);
              console.log('🔘 GroupSettings - vitalSigns:', vitalSigns);
              console.log('🔘 GroupSettings - permissions:', permissions);
              handleSave();
            }}
            disabled={saving}
            activeOpacity={0.7}
            testID="save-configurations-button"
          >
            {saving ? (
              <Text style={styles.saveButtonText}>Salvando...</Text>
            ) : (
              <>
                <SafeIcon name="checkmark-circle" size={20} color={colors.textWhite} />
                <Text style={styles.saveButtonText}>Salvar Configurações</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Botão de Excluir Grupo */}
        {isAdmin && (
          <View style={styles.deleteSection}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setShowDeleteModal(true)}
              activeOpacity={0.7}
            >
              <SafeIcon name="trash-outline" size={20} color={colors.textWhite} />
              <Text style={styles.deleteButtonText}>Excluir Grupo</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) {
            setShowDeleteModal(false);
            setDeleteConfirmText('');
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <SafeIcon name="warning" size={32} color={colors.error} />
              <Text style={styles.modalTitle}>Excluir Grupo</Text>
            </View>
            
            <Text style={styles.modalDescription}>
              Esta ação não pode ser desfeita. Todos os dados do grupo serão permanentemente excluídos.
            </Text>
            
            <Text style={styles.modalWarning}>
              Para confirmar, digite o nome do grupo:
            </Text>
            
            <Text style={styles.modalGroupName}>{groupName || groupData?.name || 'Grupo'}</Text>
            
            <TextInput
              style={styles.modalInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Digite o nome do grupo"
              placeholderTextColor={colors.gray400}
              autoCapitalize="none"
              editable={!deleting}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleting}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalDeleteButton,
                  (deleteConfirmText !== (groupName || groupData?.name || '') || deleting) && styles.modalDeleteButtonDisabled
                ]}
                onPress={handleDeleteGroup}
                disabled={deleteConfirmText !== (groupName || groupData?.name || '') || deleting}
                activeOpacity={0.7}
              >
                {deleting ? (
                  <ActivityIndicator color={colors.textWhite} size="small" />
                ) : (
                  <>
                    <SafeIcon name="trash-outline" size={18} color={colors.textWhite} />
                    <Text style={styles.modalDeleteText}>Excluir</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: 16,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '20',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.info,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  saveContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos do Código do Paciente
  codeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: colors.secondary + '10',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  codeHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  codeDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  codeCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.secondary,
    marginBottom: 12,
  },
  codeDisplay: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  codeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  codeActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  shareButtonText: {
    color: colors.textWhite,
  },
  codeInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.info + '20',
    padding: 12,
    borderRadius: 8,
  },
  codeInfoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  quickActionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  contactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 16,
  },
  contactsButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactsButtonContent: {
    flex: 1,
  },
  contactsButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 4,
  },
  contactsButtonSubtitle: {
    fontSize: 14,
    color: colors.textWhite,
    opacity: 0.9,
  },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  patientCard: {
    borderColor: colors.secondary + '40',
    backgroundColor: colors.secondary + '05',
  },
  memberAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientAvatar: {
    backgroundColor: colors.secondary + '20',
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  patientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  editIconContainer: {
    marginLeft: 'auto',
  },
  caregiverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  caregiverBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.info,
  },
  professionalCaregiverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  professionalCaregiverBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  emptyMembersCard: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  emptyMembersText: {
    fontSize: 16,
    color: colors.gray600,
    fontWeight: '600',
  },
  manageMembersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  manageMembersButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  patientBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
  },
  memberRole: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 6,
  },
  memberDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  memberDetailText: {
    fontSize: 12,
    color: colors.textLight,
  },
  membersInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.info + '20',
    padding: 12,
    borderRadius: 8,
  },
  membersInfoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  // Estilos do Botão de Pânico
  panicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  panicIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  panicInfo: {
    flex: 1,
  },
  panicTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  panicDescription: {
    fontSize: 14,
    color: colors.gray400,
  },
  // Estilos dos botões de ação inline
  memberActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
  },
  promoteButton: {
    borderColor: colors.success + '40',
    backgroundColor: colors.success + '10',
  },
  demoteButton: {
    borderColor: colors.warning + '40',
    backgroundColor: colors.warning + '10',
  },
  changePatientButton: {
    borderColor: colors.info + '40',
    backgroundColor: colors.info + '10',
  },
  removeButton: {
    borderColor: colors.error + '40',
    backgroundColor: colors.error + '10',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Estilos para informações básicas do grupo
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 90,
    paddingTop: 14,
  },
  saveBasicInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    gap: 8,
  },
  saveBasicInfoButtonDisabled: {
    opacity: 0.6,
  },
  saveBasicInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  // Estilos para foto do grupo
  photoSection: {
    marginBottom: 20,
  },
  photoContainer: {
    alignItems: 'center',
  },
  groupPhotoLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray200,
    marginBottom: 12,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  photoRemoveButton: {
    borderColor: colors.error,
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
  },
  // Estilos do botão de excluir grupo
  deleteSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  // Estilos do modal de exclusão
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalWarning: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalGroupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
  },
  modalInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modalCancelButton: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalDeleteButton: {
    backgroundColor: colors.error,
  },
  modalDeleteButtonDisabled: {
    opacity: 0.5,
  },
  modalDeleteText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
});

export default GroupSettingsScreen;

