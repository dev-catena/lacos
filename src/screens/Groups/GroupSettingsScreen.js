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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
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
        setGroupData(result.data);
        setEditedGroupName(result.data.name || '');
        setEditedDescription(result.data.description || '');
        
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
          
          // Se newGroupPhoto existe mas a URL do servidor mudou, limpar newGroupPhoto
          if (newGroupPhoto && currentUrlWithoutTimestamp !== newUrlWithoutTimestamp) {
            console.log('📸 GroupSettings.loadGroupData - URL mudou e newGroupPhoto existe, limpando newGroupPhoto');
            setNewGroupPhoto(null);
          }
        } else {
          console.log('📸 GroupSettings.loadGroupData - Sem photo_url, limpando groupPhotoUrl');
          setGroupPhotoUrl(null);
          setPhotoKey(Date.now()); // Forçar reload mesmo sem foto
        }
      } else {
        console.error('❌ GroupSettings - Erro ao carregar grupo:', result.error);
        Alert.alert('Erro', 'Não foi possível carregar os dados do grupo');
      }

      // Carregar membros do grupo
      console.log('👥 GroupSettings - Carregando membros do grupo:', groupId);
      const membersResult = await groupMemberService.getGroupMembers(groupId);
      if (membersResult.success && membersResult.data) {
        console.log('✅ GroupSettings - Membros carregados:', membersResult.data.length);
        setMembers(membersResult.data);
        
        // Verificar se o usuário logado é admin
        const currentUserMember = membersResult.data.find(m => m.user_id === user?.id);
        const userIsAdmin = currentUserMember?.role === 'admin';
        setIsAdmin(userIsAdmin);
        console.log(`👤 Usuário é admin: ${userIsAdmin}`);
        
        // Se não for admin, bloquear acesso
        if (!userIsAdmin) {
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
        setMembers([]);
      }
    } catch (error) {
      console.error('❌ GroupSettings - Erro ao carregar dados do grupo:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do grupo');
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (groupData?.code) {
      Clipboard.setString(groupData.code);
      Alert.alert('Código Copiado!', 'O código foi copiado para a área de transferência.');
    }
  };

  const shareCode = async () => {
    if (groupData?.code) {
      try {
        await Share.share({
          message: ``,
        });
      } catch (error) {
        console.error('Erro ao compartilhar código:', error);
      }
    }
  };

  const pickGroupPhoto = async () => {
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
        setNewGroupPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
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
        const result = await groupService.updateGroup(groupId, formData);
        console.log('📤 GroupSettings - Resposta recebida:', result);
        
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
          setTimeout(async () => {
            console.log('🔄 GroupSettings - Recarregando dados do grupo após salvar foto...');
            await loadGroupData();
            
            // Forçar outro reload da imagem após recarregar dados
            setTimeout(() => {
              setPhotoKey(Date.now());
            }, 300);
          }, 1500);
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
        const nameChanged = editedGroupName !== groupData?.name;
        const descChanged = editedDescription !== (groupData?.description || '');
        
        if (nameChanged || descChanged) {
          const result = await groupService.updateGroup(groupId, {
            name: editedGroupName,
            description: editedDescription,
          });
          
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

  const handleSave = async () => {
    // Validar se pelo menos um sinal vital está habilitado
    const hasAnyVitalSignEnabled = Object.values(vitalSigns).some(v => v);
    
    if (!hasAnyVitalSignEnabled) {
      Alert.alert(
        'Atenção',
        'Selecione pelo menos um sinal vital para ativar a funcionalidade'
      );
      return;
    }

    setSaving(true);
    try {
      // TODO: Implementar chamada à API
      Alert.alert(
        'Em Desenvolvimento',
        `Configurações salvas!\n\n` +
        `Sinais vitais ativos: ${Object.keys(vitalSigns).filter(k => vitalSigns[k]).length}\n` +
        `Permissões do acompanhado configuradas\n\n` +
        `Integração com API em desenvolvimento.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar configurações');
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
          <Ionicons name="arrow-back" size={24} color={colors.text} />
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
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Informações do Grupo</Text>
          </View>

          {/* Foto do Grupo */}
          {isAdmin && (
            <View style={styles.photoSection}>
              <Text style={styles.label}>Foto do Grupo</Text>
              {(newGroupPhoto || groupPhotoUrl) ? (
                <View style={styles.photoContainer}>
                  <Image 
                    key={`photo-${photoKey}-${newGroupPhoto ? 'local-' + newGroupPhoto.substring(newGroupPhoto.length - 10) : 'server-' + (groupPhotoUrl ? groupPhotoUrl.split('/').pop() : 'none')}`}
                    source={newGroupPhoto && !imageSource
                      ? { uri: newGroupPhoto, cache: 'reload' }
                      : (imageSource || { uri: groupPhotoUrl, cache: 'reload' })
                    } 
                    style={styles.groupPhotoLarge}
                    onError={(error) => {
                      console.error('❌ Erro ao carregar imagem:', error);
                      console.error('❌ URI tentada:', newGroupPhoto || groupPhotoUrl);
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
                    }}
                  />
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={styles.photoActionButton}
                      onPress={pickGroupPhoto}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="camera" size={20} color={colors.primary} />
                      <Text style={styles.photoActionText}>Trocar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.photoActionButton, styles.photoRemoveButton]}
                      onPress={removeGroupPhoto}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
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
                  <Ionicons name="camera" size={48} color={colors.primary} />
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

          {isAdmin && (editedGroupName !== groupData?.name || editedDescription !== groupData?.description || newGroupPhoto) && (
            <TouchableOpacity
              style={[styles.saveBasicInfoButton, saving && styles.saveBasicInfoButtonDisabled]}
              onPress={saveGroupBasicInfo}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={colors.textWhite} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.textWhite} />
                  <Text style={styles.saveBasicInfoText}>Salvar Alterações</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Código do Paciente */}
        {groupData?.code && (
          <View style={styles.codeSection}>
            <View style={styles.codeHeader}>
              <Ionicons name="key" size={24} color={colors.secondary} />
              <Text style={styles.codeHeaderTitle}>Código do Paciente</Text>
            </View>
            <Text style={styles.codeDescription}>
              Compartilhe este código com o paciente para que ele possa acessar o aplicativo
            </Text>
            
            <View style={styles.codeCard}>
              <View style={styles.codeDisplay}>
                <Text style={styles.codeLabel}>Código:</Text>
                <Text style={styles.codeText}>{groupData.code}</Text>
              </View>
              
              <View style={styles.codeActions}>
                <TouchableOpacity
                  style={styles.codeActionButton}
                  onPress={copyCodeToClipboard}
                >
                  <Ionicons name="copy-outline" size={20} color={colors.primary} />
                  <Text style={styles.codeActionText}>Copiar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.codeActionButton, styles.shareButton]}
                  onPress={shareCode}
                >
                  <Ionicons name="share-social-outline" size={20} color={colors.textWhite} />
                  <Text style={[styles.codeActionText, styles.shareButtonText]}>Compartilhar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.codeInfoCard}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.codeInfoText}>
                O paciente deve abrir o app, selecionar "Sou Paciente" e digitar este código
              </Text>
            </View>
          </View>
        )}

        {/* Botão de Pânico */}
        <TouchableOpacity
          style={styles.panicCard}
          onPress={() => navigation.navigate('PanicSettings', { groupId, groupName })}
          activeOpacity={0.7}
        >
          <View style={styles.panicIconContainer}>
            <Ionicons name="warning" size={28} color={colors.white} />
          </View>
          <View style={styles.panicInfo}>
            <Text style={styles.panicTitle}>Botão de Pânico</Text>
            <Text style={styles.panicDescription}>
              Configure emergências e contatos prioritários
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
        </TouchableOpacity>

        {/* Botão de Gerenciar Contatos */}
        <View style={styles.quickActionSection}>
          <TouchableOpacity
            style={styles.contactsButton}
            onPress={() => navigation.navigate('GroupContacts', { groupId })}
          >
            <View style={styles.contactsButtonIcon}>
              <Ionicons name="call" size={24} color={colors.textWhite} />
            </View>
            <View style={styles.contactsButtonContent}>
              <Text style={styles.contactsButtonTitle}>Gerenciar Contatos</Text>
              <Text style={styles.contactsButtonSubtitle}>
                Configure contatos rápidos e SOS para o paciente
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Membros do Grupo */}
        {groupData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={24} color={colors.secondary} />
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
                        <Ionicons 
                          name={memberIsPatient ? 'heart' : 'person'} 
                          size={32} 
                          color={memberIsPatient ? colors.secondary : colors.primary} 
                        />
                      </View>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberHeader}>
                          <Text style={styles.memberName}>
                            {member.user?.name || 'Membro'}
                          </Text>
                          {memberIsAdmin && (
                            <View style={styles.adminBadge}>
                              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                              <Text style={styles.adminBadgeText}>Administrador</Text>
                            </View>
                          )}
                          {memberIsPatient && (
                            <>
                              <View style={styles.patientBadge}>
                                <Ionicons name="medkit" size={14} color={colors.secondary} />
                                <Text style={styles.patientBadgeText}>Paciente</Text>
                              </View>
                              <View style={styles.editIconContainer}>
                                <Ionicons name="create-outline" size={18} color={colors.secondary} />
                              </View>
                            </>
                          )}
                          {memberIsCaregiver && !memberIsAdmin && member.user?.profile !== 'professional_caregiver' && (
                            <View style={styles.caregiverBadge}>
                              <Ionicons name="heart" size={14} color={colors.info} />
                              <Text style={styles.caregiverBadgeText}>Cuidador</Text>
                            </View>
                          )}
                        </View>
                        {memberIsCaregiver && !memberIsAdmin && member.user?.profile === 'professional_caregiver' && (
                          <View style={styles.professionalCaregiverBadge}>
                            <Ionicons name="medical" size={14} color={colors.success} />
                            <Text style={styles.professionalCaregiverBadgeText}>Cuidador profissional</Text>
                          </View>
                        )}
                        <Text style={styles.memberRole}>
                          {memberIsAdmin ? 'Cuidador Principal' : 
                           memberIsPatient ? 'Pessoa Acompanhada' : 
                           member.user?.profile === 'professional_caregiver' ? 'Cuidador profissional' :
                           'Cuidador'}
                        </Text>
                        {member.joined_at && (
                          <View style={styles.memberDetail}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textLight} />
                            <Text style={styles.memberDetailText}>
                              Entrou em: {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                            </Text>
                          </View>
                        )}
                        {member.user?.email && (
                          <View style={styles.memberDetail}>
                            <Ionicons name="mail-outline" size={14} color={colors.textLight} />
                            <Text style={styles.memberDetailText}>
                              {member.user.email}
                            </Text>
                          </View>
                        )}
                        
                        {/* Botões de Ação (só visíveis para admin e não para si mesmo) */}
                        {(() => {
                          const shouldShowActions = isAdmin && member.user_id !== user?.id;
                          console.log(`🔧 Membro: ${member.user?.name} | isAdmin: ${isAdmin} | member.user_id: ${member.user_id} | user.id: ${user?.id} | Mostrar ações: ${shouldShowActions}`);
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
                                <Ionicons name="arrow-down-circle-outline" size={18} color={colors.warning} />
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
                                <Ionicons name="arrow-up-circle-outline" size={18} color={colors.success} />
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
                                <Ionicons name="people-outline" size={18} color={colors.info} />
                                <Text style={[styles.actionButtonText, { color: colors.info }]}>
                                  Tornar Cuidador
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                            
                            {/* Trocar Paciente (só para não-pacientes e não para cuidador profissional) */}
                            {member.role !== 'patient' && member.user?.profile !== 'professional_caregiver' && (
                              <TouchableOpacity
                                style={[styles.actionButton, styles.changePatientButton]}
                                onPress={() => handleChangePatient(member)}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="swap-horizontal-outline" size={18} color={colors.info} />
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
                              <Ionicons name="trash-outline" size={18} color={colors.error} />
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
                <Ionicons name="people-outline" size={48} color={colors.gray300} />
                <Text style={styles.emptyMembersText}>Nenhum membro no grupo</Text>
              </View>
            )}

            <View style={styles.membersInfoCard}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.membersInfoText}>
                Atualmente este grupo tem {members.length} membro{members.length !== 1 ? 's' : ''}.
              </Text>
            </View>
          </View>
        )}

        {/* Sinais Vitais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <VitalSignsIcon size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Sinais Vitais</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Selecione os sinais que deseja monitorar. Alertas serão enviados quando os valores
            estiverem fora dos limites.
          </Text>

          {vitalSignsConfig.map((item) => (
            <View key={item.key} style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
              </View>
              <Switch
                value={vitalSigns[item.key]}
                onValueChange={() => toggleVitalSign(item.key)}
                trackColor={{ false: colors.gray200, true: item.color + '60' }}
                thumbColor={vitalSigns[item.key] ? item.color : colors.gray400}
              />
            </View>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Limites Automáticos</Text>
            <Text style={styles.infoText}>
              Os limites iniciais são baseados em valores recomendados. Após coletar dados
              históricos, o sistema calculará os valores basais personalizados do paciente (±20%).
            </Text>
          </View>
        </View>

        {/* Permissões do Acompanhado */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PermissionsIcon size={24} color={colors.secondary} />
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
                    <IconComponent size={24} color={colors.secondary} />
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
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Text style={styles.saveButtonText}>Salvando...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.textWhite} />
                <Text style={styles.saveButtonText}>Salvar Configurações</Text>
              </>
            )}
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
    borderWidth: 2,
    borderColor: colors.error + '30',
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
});

export default GroupSettingsScreen;

