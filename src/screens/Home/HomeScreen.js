import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ProfileIcon } from '../../components/CustomIcons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { LacosIcon, LacosLogoFull } from '../../components/LacosLogo';
import groupService from '../../services/groupService';
import activityService from '../../services/activityService';
import planService from '../../services/planService';
import API_CONFIG from '../../config/api';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import {
  MedicationIcon,
  VitalSignsIcon,
  AppointmentIcon,
  MessagesIcon,
  PeopleIcon,
  ChevronForwardIcon,
  AddIcon,
  CalendarIcon,
  DocumentIcon,
  TimeIcon,
  PersonIcon,
  WarningIcon,
  ErrorIcon,
  TrashIcon,
} from '../../components/CustomIcons';

const HomeScreen = ({ navigation }) => {
  const { user, signed } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [participatingGroups, setParticipatingGroups] = useState([]);
  const [selectedTab, setSelectedTab] = useState('myGroups');
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (!signed || !user) {
      console.error('❌ HomeScreen - ACESSO NEGADO: Usuário não autenticado!');
      console.error('❌ Este é um BUG DE SEGURANÇA - bloqueando acesso');
    }
  }, [signed, user]);

  // Carregar plano do usuário - PRIMEIRO, antes de tudo
  useEffect(() => {
    if (signed && user) {
      console.log('🚀 HomeScreen - Carregando plano imediatamente...');
      loadUserPlan();
    }
  }, [signed, user]);

  // Carregar grupos e atividades quando a tela recebe foco
  useFocusEffect(
    React.useCallback(() => {
      if (signed && user) {
        // Garantir que o plano seja carregado primeiro
        if (!userPlan) {
          console.log('🔄 HomeScreen - Plano não carregado ainda, recarregando...');
          loadUserPlan();
        }
        // Sempre recarregar grupos quando a tela recebe foco
        console.log('🔄 HomeScreen - useFocusEffect: Recarregando grupos...');
        loadGroups();
        loadActivities(); // Carregar atividades independentemente dos grupos
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signed, user])
  );

  const loadUserPlan = async () => {
    try {
      console.log('📦 HomeScreen - Carregando plano do usuário...');
      const result = await planService.getUserPlan();
      
      if (result.success && result.plan) {
        console.log('✅ HomeScreen - Plano carregado:', result.plan.name);
        console.log('📋 HomeScreen - Features do plano:', JSON.stringify(result.plan.features, null, 2));
        console.log('🔍 HomeScreen - buscarCuidadores:', result.plan.features?.buscarCuidadores);
        setUserPlan(result.plan);
      } else {
        console.warn('⚠️ HomeScreen - Plano não encontrado ou erro ao carregar');
        console.warn('⚠️ HomeScreen - Result:', result);
        setUserPlan(null);
      }
    } catch (error) {
      console.error('❌ HomeScreen - Erro ao carregar plano:', error);
      setUserPlan(null);
    }
  };

  const loadGroups = async () => {
    console.log('🔄 HomeScreen - Carregando grupos...');
    setLoading(true);
    try {
      // Buscar grupos da API
      const result = await groupService.getMyGroups();
      
      if (result.success && result.data) {
        const groups = result.data;
        console.log(`✅ HomeScreen - ${groups.length} grupo(s) encontrado(s)`);
        console.log(`🔍 HomeScreen - RESPOSTA COMPLETA DA API (getMyGroups):`, JSON.stringify(groups, null, 2));
        
        // Debug: verificar photo_url de cada grupo - INVESTIGAÇÃO DETALHADA
        groups.forEach(g => {
          console.log(`📸 HomeScreen - INVESTIGAÇÃO Grupo ${g.id} (${g.name}):`, {
            photo_url: g.photo_url,
            photo: g.photo,
            hasPhotoUrl: !!g.photo_url,
            hasPhoto: !!g.photo,
            photo_url_type: typeof g.photo_url,
            photo_url_length: g.photo_url ? g.photo_url.length : 0,
            photo_url_starts_with_http: g.photo_url ? g.photo_url.startsWith('http') : false,
            photo_url_includes_storage: g.photo_url ? g.photo_url.includes('storage') : false,
            full_group_object: JSON.stringify(g, null, 2),
          });
          
          // Testar URL se existir
          if (g.photo_url) {
            const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
            let testUrl = g.photo_url;
            if (!g.photo_url.startsWith('http')) {
              testUrl = g.photo_url.startsWith('/') 
                ? `${baseUrl}${g.photo_url}` 
                : `${baseUrl}/${g.photo_url}`;
            }
            console.log(`🔗 HomeScreen - URL FINAL construída para grupo ${g.id}:`, testUrl);
          }
        });
        
        // Se não tem grupos, apenas setar estado vazio
        // HomeScreen vai renderizar NoGroupsScreen condicionalmente
        if (groups.length === 0) {
          console.log('ℹ️ HomeScreen - Nenhum grupo encontrado');
          setMyGroups([]);
          setParticipatingGroups([]);
          setLoading(false);
          return;
        }
        
        // "Meus Grupos" = grupos que EU criei (is_creator=true)
        // "Participo" = grupos onde fui convidado (is_creator=false)
        // FALLBACK: Se is_creator não existir, usa is_admin como critério temporário
        const myCreatedGroups = groups.filter(g => {
          if (g.is_creator !== undefined) {
            return g.is_creator === true;
          }
          // Fallback: considera que admins são criadores
          return g.is_admin === true;
        });
        
        const joinedGroups = groups.filter(g => {
          if (g.is_creator !== undefined) {
            return g.is_creator === false;
          }
          // Fallback: não-admins são participantes
          return g.is_admin === false;
        });
        
        console.log(`✅ HomeScreen - Meus Grupos: ${myCreatedGroups.length}, Participo: ${joinedGroups.length}`);
        
        setMyGroups(myCreatedGroups);
        setParticipatingGroups(joinedGroups);
        
        // Carregar atividades recentes
        loadActivities();
      } else {
        console.warn('⚠️ HomeScreen - Erro ao buscar grupos');
        // Em caso de erro, setar estado vazio
        setMyGroups([]);
        setParticipatingGroups([]);
      }
    } catch (error) {
      console.error('❌ HomeScreen - Erro ao carregar grupos:', error);
      // Em caso de erro, setar estado vazio
      setMyGroups([]);
      setParticipatingGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      console.log('📊 HomeScreen - Carregando atividades recentes...');
      const result = await activityService.getRecentActivities(10);
      
      // Sempre usar result.data, mesmo se result.success for false (pode ter array vazio)
      const activities = result.data || [];
      
      if (activities.length > 0) {
        console.log('📊 HomeScreen - Dados brutos das atividades:', JSON.stringify(activities, null, 2));
        
        const formattedActivities = activities.map(activity => {
          // Extrair group_id de diferentes formas possíveis
          const groupId = activity.group_id || activity.group?.id || activity.group_id || null;
          const groupName = activity.group?.name || activity.group_name || 'Grupo';
          
          console.log(`📋 HomeScreen - Formatando atividade:`, {
            id: activity.id,
            action_type: activity.action_type,
            group_id: groupId,
            group_name: groupName,
            has_group_object: !!activity.group,
          });
          
          return {
            id: activity.id,
            title: activityService.getActivityTypeLabel(activity.action_type),
            description: activity.description,
            groupName: groupName,
            groupId: groupId,
            icon: activityService.getActivityIcon(activity.action_type),
            color: activityService.getActivityColor(activity.action_type),
            time: moment(activity.created_at).fromNow(),
            dateTime: moment(activity.created_at).format('DD/MM/YYYY [às] HH:mm'),
            timestamp: activity.created_at,
            action_type: activity.action_type, // Armazenar o tipo original para filtrar notificações
          };
        });
        
        console.log(`✅ HomeScreen - ${formattedActivities.length} atividade(s) formatada(s):`, formattedActivities.map(a => ({ id: a.id, title: a.title, groupName: a.groupName })));
        
        setRecentActivities(formattedActivities);
        console.log(`✅ HomeScreen - ${formattedActivities.length} atividade(s) carregada(s)`);
      } else {
        console.warn('⚠️ HomeScreen - Nenhuma atividade encontrada. Result:', result);
        setRecentActivities([]);
      }
    } catch (error) {
      // Se for timeout (408), apenas logar como warning e continuar
      if (error.status === 408) {
        console.warn('⚠️ HomeScreen - Timeout ao carregar atividades, continuando sem atividades');
      } else {
        console.error('❌ HomeScreen - Erro ao carregar atividades:', error);
      }
      // Sempre setar array vazio para não travar a tela
      setRecentActivities([]);
    }
  };

  const handleGroupPress = () => {
    navigation.navigate('Groups');
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Código obrigatório',
        text2: 'Digite o código de convite',
      });
      return;
    }

    setJoiningGroup(true);
    try {
      const result = await groupService.joinWithCode(inviteCode.trim());
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Sucesso!',
          text2: `Você entrou no grupo ${result.data.group.name}`,
        });
        setInviteModalVisible(false);
        setInviteCode('');
        
        // Recarregar grupos
        loadGroups();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: result.error || 'Código inválido',
        });
      }
    } catch (error) {
      console.error('Erro ao entrar no grupo:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível entrar no grupo',
      });
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleMedication = () => {
    Alert.alert(
      'Em Desenvolvimento',
      'Funcionalidade de Medicação em desenvolvimento',
      [{ text: 'OK' }]
    );
  };

  const handleVitalSigns = () => {
    Alert.alert(
      'Em Desenvolvimento',
      'Funcionalidade de Sinais Vitais em desenvolvimento',
      [{ text: 'OK' }]
    );
  };

  const handleAppointment = () => {
    Alert.alert(
      'Em Desenvolvimento',
      'Funcionalidade de Consultas em desenvolvimento',
      [{ text: 'OK' }]
    );
  };

  const handleMessages = () => {
    Alert.alert(
      'Em Desenvolvimento',
      'Funcionalidade de Mensagens em desenvolvimento',
      [{ text: 'OK' }]
    );
  };

  // GUARD: Se não estiver autenticado, mostrar mensagem de erro
  if (!signed || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <ErrorIcon size={80} color={colors.error} />
          <Text style={styles.errorTitle}>Acesso Negado</Text>
          <Text style={styles.errorText}>
            Você precisa estar logado para acessar esta tela.
          </Text>
          <Text style={styles.errorSubtext}>
            Este é um erro de navegação. Por favor, reinicie o aplicativo.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando grupos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LacosIcon size={40} />
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => {
              console.log('📱 HomeScreen - Navegando para Profile');
              navigation.navigate('Profile');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.profileIconContainer}>
              {/* Ícone SVG de silhueta de perfil */}
              <ProfileIcon size={32} color={colors.primary} filled={false} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Loja - Se a feature estiver habilitada no plano */}
        {(() => {
          // Se o plano ainda não foi carregado, não mostrar (evita flash)
          if (!userPlan) {
            return false;
          }
          
          const featureEnabled = planService.isFeatureEnabled(userPlan, 'loja');
          
          console.log('🛒 HomeScreen - Verificação loja:', {
            featureEnabled,
            userPlanName: userPlan?.name,
            features: userPlan?.features,
            loja: userPlan?.features?.loja,
            featuresType: typeof userPlan?.features,
          });
          
          return featureEnabled;
        })() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loja</Text>
            <TouchableOpacity
              style={styles.caregiverSearchCard}
              onPress={() => navigation.navigate('Store')}
              activeOpacity={0.7}
            >
              <View style={[styles.caregiverSearchIcon, { backgroundColor: '#FF6B6B20' }]}>
                <Ionicons name="storefront-outline" size={32} color="#FF6B6B" />
              </View>
              <View style={styles.caregiverSearchContent}>
                <Text style={styles.caregiverSearchTitle}>Loja de Produtos</Text>
                <Text style={styles.caregiverSearchDescription}>
                  Compre produtos para cuidados e bem-estar
                </Text>
              </View>
              <ChevronForwardIcon size={24} color="#2D5016" />
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs de Grupos */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsRow}>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'myGroups' && styles.tabActive]}
              onPress={() => setSelectedTab('myGroups')}
            >
              <Text style={[styles.tabText, selectedTab === 'myGroups' && styles.tabTextActive]}>
                Meus Grupos
              </Text>
              {selectedTab === 'myGroups' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'participating' && styles.tabActive]}
              onPress={() => setSelectedTab('participating')}
            >
              <Text style={[styles.tabText, selectedTab === 'participating' && styles.tabTextActive]}>
                Participo
              </Text>
              {selectedTab === 'participating' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>
          
          {selectedTab === 'myGroups' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateGroup')}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Conteúdo das Tabs */}
        <View style={styles.tabContent}>
          {selectedTab === 'myGroups' ? (
            // Meus Grupos
            myGroups.length > 0 ? (
              myGroups.map((group) => (
                <TouchableOpacity 
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => navigation.navigate('GroupDetail', {
                    groupId: group.id,
                    groupName: group.name,
                    accompaniedName: group.accompanied_name,
                  })}
                  activeOpacity={0.7}
                >
                  {(() => {
                    const photoUrl = group.photo_url || group.photo;
                    
                    if (photoUrl) {
                      // Construir URL completa se necessário (mesma lógica do GroupSettingsScreen que funciona)
                      let fullPhotoUrl = photoUrl;
                      if (!photoUrl.startsWith('http')) {
                        // Se não for URL completa, construir usando a base URL da API
                        const baseUrl = API_CONFIG.BASE_URL.replace('/api', ''); // Remover /api do final
                        fullPhotoUrl = photoUrl.startsWith('/') 
                          ? `${baseUrl}${photoUrl}` 
                          : `${baseUrl}/${photoUrl}`;
                      }
                      
                      // Adicionar cache-busting como no GroupSettingsScreen (que funciona)
                      const separator = fullPhotoUrl.includes('?') ? '&' : '?';
                      const timestamp = Date.now();
                      const photoUrlWithCache = `${fullPhotoUrl}${separator}t=${timestamp}`;
                      
                      // INVESTIGAÇÃO: Testar se a URL está acessível antes de renderizar
                      fetch(photoUrlWithCache, { method: 'HEAD' })
                        .then(response => {
                          console.log(`🔍 HomeScreen - TESTE FETCH HEAD para grupo ${group.id}:`, {
                            url: photoUrlWithCache,
                            status: response.status,
                            statusText: response.statusText,
                            ok: response.ok,
                            headers: Object.fromEntries(response.headers.entries()),
                          });
                        })
                        .catch(error => {
                          console.error(`❌ HomeScreen - ERRO no FETCH HEAD para grupo ${group.id}:`, {
                            url: photoUrlWithCache,
                            error: error.message,
                            stack: error.stack,
                          });
                        });
                      
                      console.log(`📸 HomeScreen - INVESTIGAÇÃO DETALHADA - Grupo ${group.id} (${group.name}):`, {
                        original_photoUrl: photoUrl,
                        original_photo_url_from_api: group.photo_url,
                        original_photo_from_api: group.photo,
                        fullPhotoUrl_construida: fullPhotoUrl,
                        photoUrlWithCache_final: photoUrlWithCache,
                        baseUrl: API_CONFIG.BASE_URL.replace('/api', ''),
                        starts_with_http: fullPhotoUrl.startsWith('http'),
                        includes_storage: fullPhotoUrl.includes('storage'),
                      });
                      
                      return (
                        <Image
                          key={`group-photo-${group.id}-${timestamp}`}
                          source={{ uri: photoUrlWithCache, cache: 'reload' }}
                          style={styles.groupPhoto}
                          onError={(error) => {
                            console.error('❌ HomeScreen - ERRO NO COMPONENTE IMAGE para grupo:', {
                              grupo_id: group.id,
                              grupo_nome: group.name,
                              error: error,
                              nativeError: error.nativeEvent,
                              photo_url_original: group.photo_url,
                              photo_original: group.photo,
                              uri_tentada: photoUrlWithCache,
                              fullPhotoUrl: fullPhotoUrl,
                            });
                          }}
                          onLoad={() => {
                            console.log(`✅ HomeScreen - Foto do grupo ${group.id} carregada com sucesso:`, photoUrlWithCache);
                          }}
                          onLoadStart={() => {
                            console.log(`🔄 HomeScreen - Iniciando carregamento da foto do grupo ${group.id}:`, photoUrlWithCache);
                          }}
                          resizeMode="cover"
                        />
                      );
                    }
                    
                    // Se não há foto, mostrar ícone
                    console.log(`⚠️ HomeScreen - Grupo ${group.id} (${group.name}) não tem foto`);
                    return (
                      <View style={styles.groupIcon}>
                        <PeopleIcon size={32} color={colors.primary} />
                      </View>
                    );
                  })()}
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupDescription}>
                      {group.accompanied_name ? `Acompanhando ${group.accompanied_name}` : 'Grupo de cuidados'}
                    </Text>
                  </View>
                  <ChevronForwardIcon size={24} color={colors.gray400} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <PeopleIcon size={48} color={colors.gray300} />
                <Text style={styles.emptyStateTitle}>Nenhum grupo criado</Text>
                <Text style={styles.emptyStateText}>
                  Crie um grupo para acompanhar alguém especial
                </Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={handleCreateGroup}
                  activeOpacity={0.8}
                >
                  <AddIcon size={20} color={colors.textWhite} />
                  <Text style={styles.createButtonText}>Criar Grupo</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            // Grupos que Participo
            participatingGroups.length > 0 ? (
              participatingGroups.map((group) => (
                <TouchableOpacity 
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => navigation.navigate('GroupDetail', {
                    groupId: group.id,
                    groupName: group.name,
                    accompaniedName: group.accompanied_name,
                  })}
                  activeOpacity={0.7}
                >
                  {(() => {
                    const photoUrl = group.photo_url || group.photo;
                    
                    if (photoUrl) {
                      // Construir URL completa se necessário (mesma lógica do GroupSettingsScreen que funciona)
                      let fullPhotoUrl = photoUrl;
                      if (!photoUrl.startsWith('http')) {
                        // Se não for URL completa, construir usando a base URL da API
                        const baseUrl = API_CONFIG.BASE_URL.replace('/api', ''); // Remover /api do final
                        fullPhotoUrl = photoUrl.startsWith('/') 
                          ? `${baseUrl}${photoUrl}` 
                          : `${baseUrl}/${photoUrl}`;
                      }
                      
                      // Adicionar cache-busting como no GroupSettingsScreen (que funciona)
                      const separator = fullPhotoUrl.includes('?') ? '&' : '?';
                      const timestamp = Date.now();
                      const photoUrlWithCache = `${fullPhotoUrl}${separator}t=${timestamp}`;
                      
                      // INVESTIGAÇÃO: Testar se a URL está acessível antes de renderizar
                      fetch(photoUrlWithCache, { method: 'HEAD' })
                        .then(response => {
                          console.log(`🔍 HomeScreen - TESTE FETCH HEAD para grupo ${group.id}:`, {
                            url: photoUrlWithCache,
                            status: response.status,
                            statusText: response.statusText,
                            ok: response.ok,
                            headers: Object.fromEntries(response.headers.entries()),
                          });
                        })
                        .catch(error => {
                          console.error(`❌ HomeScreen - ERRO no FETCH HEAD para grupo ${group.id}:`, {
                            url: photoUrlWithCache,
                            error: error.message,
                            stack: error.stack,
                          });
                        });
                      
                      console.log(`📸 HomeScreen - INVESTIGAÇÃO DETALHADA - Grupo ${group.id} (${group.name}):`, {
                        original_photoUrl: photoUrl,
                        original_photo_url_from_api: group.photo_url,
                        original_photo_from_api: group.photo,
                        fullPhotoUrl_construida: fullPhotoUrl,
                        photoUrlWithCache_final: photoUrlWithCache,
                        baseUrl: API_CONFIG.BASE_URL.replace('/api', ''),
                        starts_with_http: fullPhotoUrl.startsWith('http'),
                        includes_storage: fullPhotoUrl.includes('storage'),
                      });
                      
                      return (
                        <Image
                          key={`group-photo-${group.id}-${timestamp}`}
                          source={{ uri: photoUrlWithCache, cache: 'reload' }}
                          style={styles.groupPhoto}
                          onError={(error) => {
                            console.error('❌ HomeScreen - ERRO NO COMPONENTE IMAGE para grupo:', {
                              grupo_id: group.id,
                              grupo_nome: group.name,
                              error: error,
                              nativeError: error.nativeEvent,
                              photo_url_original: group.photo_url,
                              photo_original: group.photo,
                              uri_tentada: photoUrlWithCache,
                              fullPhotoUrl: fullPhotoUrl,
                            });
                          }}
                          onLoad={() => {
                            console.log(`✅ HomeScreen - Foto do grupo ${group.id} carregada com sucesso:`, photoUrlWithCache);
                          }}
                          onLoadStart={() => {
                            console.log(`🔄 HomeScreen - Iniciando carregamento da foto do grupo ${group.id}:`, photoUrlWithCache);
                          }}
                          resizeMode="cover"
                        />
                      );
                    }
                    
                    // Se não há foto, mostrar ícone
                    console.log(`⚠️ HomeScreen - Grupo ${group.id} (${group.name}) não tem foto`);
                    return (
                      <View style={styles.groupIcon}>
                        <PeopleIcon size={32} color={colors.secondary} />
                      </View>
                    );
                  })()}
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupDescription}>
                      {group.accompanied_name ? `Acompanhando ${group.accompanied_name}` : 'Membro do grupo'}
                    </Text>
                  </View>
                  <ChevronForwardIcon size={24} color={colors.gray400} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <PeopleIcon size={48} color={colors.gray300} />
                <Text style={styles.emptyStateTitle}>Nenhum grupo ainda</Text>
                <Text style={styles.emptyStateText}>
                  Use um código de convite para entrar em um grupo
                </Text>
                <TouchableOpacity 
                  style={[styles.createButton, { backgroundColor: colors.secondary }]}
                  onPress={() => setInviteModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <AddIcon size={20} color={colors.textWhite} />
                  <Text style={styles.createButtonText}>Entrar em Grupo</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>

        {/* Últimas Atualizações */}
        {(() => {
          const currentGroups = selectedTab === 'myGroups' ? myGroups : participatingGroups;
          const hasGroups = currentGroups.length > 0;
          
          // Filtrar atividades de TODOS os grupos do usuário (tanto "Meus Grupos" quanto "Participo")
          // Isso garante que atividades não sejam perdidas se o usuário estiver na aba errada
          const allUserGroups = [...myGroups, ...participatingGroups];
          const allUserGroupIds = allUserGroups.map(g => g.id).filter(id => id != null);
          
          // Usar IDs dos grupos para comparação (mais confiável que nomes)
          const currentGroupIds = currentGroups.map(g => g.id).filter(id => id != null);
          
          console.log(`📊 HomeScreen - DEBUG: Total de atividades recebidas: ${recentActivities.length}`);
          console.log(`📊 HomeScreen - DEBUG: Meus Grupos: ${myGroups.length}, Participo: ${participatingGroups.length}`);
          console.log(`📊 HomeScreen - DEBUG: Grupos atuais (IDs):`, currentGroupIds);
          console.log(`📊 HomeScreen - DEBUG: TODOS os grupos do usuário (IDs):`, allUserGroupIds);
          console.log(`📊 HomeScreen - DEBUG: Grupos atuais (nomes):`, currentGroups.map(g => ({ id: g.id, name: g.name })));
          console.log(`📊 HomeScreen - DEBUG: Todas as atividades:`, recentActivities.map(a => ({ 
            id: a.id, 
            title: a.title,
            groupName: a.groupName, 
            groupId: a.groupId 
          })));
          
          const filteredActivities = recentActivities.filter(activity => {
            // Se a atividade tem groupId, comparar diretamente com TODOS os grupos do usuário
            if (activity.groupId) {
              // Primeiro verificar se está nos grupos da aba atual
              const matchesCurrentTab = currentGroupIds.includes(activity.groupId);
              // Se não estiver, verificar se está em qualquer grupo do usuário
              const matchesAnyGroup = allUserGroupIds.includes(activity.groupId);
              
              if (matchesCurrentTab) {
                console.log(`✅ HomeScreen - Atividade "${activity.title}" corresponde ao grupo ID ${activity.groupId} (aba atual)`);
                return true;
              } else if (matchesAnyGroup) {
                // Atividade pertence a um grupo do usuário, mas não está na aba atual
                // Ainda assim mostrar, pois é uma atividade válida
                console.log(`✅ HomeScreen - Atividade "${activity.title}" corresponde ao grupo ID ${activity.groupId} (outra aba)`);
                return true;
              } else {
                console.log(`❌ HomeScreen - Atividade "${activity.title}" NÃO corresponde: groupId ${activity.groupId} não está em [${allUserGroupIds.join(', ')}]`);
                return false;
              }
            }
            
            // Se não tem groupId, tentar comparar por nome
            if (activity.groupName && activity.groupName !== 'Grupo') {
              const matches = currentGroups.some(group => {
                const groupName = group.name || group.groupName || '';
                const match = groupName === activity.groupName && groupName !== '';
                
                if (!match && groupName && activity.groupName) {
                  console.log(`🔍 HomeScreen - Atividade não corresponde por nome: grupo "${groupName}" (ID: ${group.id}) !== atividade "${activity.groupName}"`);
                }
                
                return match;
              });
              
              if (matches) {
                console.log(`✅ HomeScreen - Atividade "${activity.title}" corresponde ao grupo (por nome)`);
              }
              
              return matches;
            }
            
            // Se não tem nem groupId nem groupName válido, não mostrar
            console.log(`⚠️ HomeScreen - Atividade "${activity.title}" sem grupo válido (groupId: ${activity.groupId}, groupName: ${activity.groupName})`);
            return false;
          });
          
          console.log(`📊 HomeScreen - RESULTADO: Total de atividades: ${recentActivities.length}, Filtradas: ${filteredActivities.length}`);

          if (!hasGroups) {
            return null; // Não mostrar seção se não há grupos
          }

          return (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Últimas Atualizações</Text>
              </View>

              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => {
                  // Verificar se é uma notificação
                  const notificationTypes = [
                    'medication_created',
                    'medication_updated',
                    'medication_discontinued',
                    'medication_completed',
                    'prescription_created',
                    'consultation_created',
                    'appointment_created',
                    'appointment_cancelled',
                    'occurrence_created',
                    'document_created',
                    'member_joined',
                    'member_promoted',
                    'member_removed',
                    'group_photo_updated',
                    'vital_sign_recorded',
                    'smartwatch_registered',
                    'caregiver_hired',
                  ];
                  const isNotification = activity.action_type && notificationTypes.includes(activity.action_type);
                  
                  return (
                    <View key={activity.id} style={styles.activityCardContainer}>
                      <TouchableOpacity
                        style={styles.activityCard}
                        onPress={() => {
                          // Navegar para o grupo quando clicar na atividade
                          if (activity.groupId) {
                            const group = allUserGroups.find(g => g.id === activity.groupId);
                            if (group) {
                              // Mapear tipo de atividade para o card correto
                              const getCardFromActivityType = (actionType) => {
                                const cardMap = {
                                  // Agenda
                                  'appointment_cancelled': 'agenda',
                                  'appointment_created': 'agenda',
                                  'consultation_created': 'agenda',
                                  
                                  // Medicamentos
                                  'medication_created': 'medications',
                                  'medication_updated': 'medications',
                                  'medication_discontinued': 'medications',
                                  'medication_completed': 'medications',
                                  
                                  // Documentos
                                  'document_created': 'documents',
                                  
                                  // Receitas
                                  'prescription_created': 'prescriptions',
                                  
                                  // Sinais Vitais
                                  'vital_sign_recorded': 'vitalsigns',
                                };
                                return cardMap[actionType] || null;
                              };

                              const targetCard = getCardFromActivityType(activity.action_type);
                              
                              navigation.navigate('GroupDetail', {
                                groupId: activity.groupId,
                                groupName: activity.groupName || group.name,
                                openCard: targetCard, // Parâmetro para indicar qual card abrir
                              });
                            }
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                          {(() => {
                            // Mapear ícones do Ionicons para componentes SVG
                            const iconMap = {
                              'person-add': PersonIcon,
                              'arrow-up-circle': AddIcon,
                              'person-remove': PersonIcon,
                              'swap-horizontal': PeopleIcon,
                              'add-circle': AddIcon,
                              'create': AddIcon,
                              'medical': MedicationIcon,
                              'create-outline': AddIcon,
                              'close-circle': AddIcon,
                              'checkmark-done-circle': AddIcon,
                              'document-text': DocumentIcon,
                              'calendar': CalendarIcon,
                              'calendar-outline': CalendarIcon,
                              'warning': WarningIcon,
                              'notifications': MessagesIcon,
                            };
                            const IconComponent = iconMap[activity.icon] || CalendarIcon;
                            return <IconComponent size={24} color={activity.color} />;
                          })()}
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={styles.activityTitle}>{activity.title}</Text>
                          <Text style={styles.activityDescription}>{activity.description}</Text>
                          <View style={styles.activityMeta}>
                            <View style={styles.activityMetaLeft}>
                              <Text style={styles.activityGroup}>{activity.groupName}</Text>
                              <Text style={styles.activityTime}>• {activity.time}</Text>
                            </View>
                            {isNotification && (
                              <TouchableOpacity
                                onPress={async (e) => {
                                  e.stopPropagation(); // Prevent card navigation
                                  try {
                                    const result = await activityService.deleteActivity(activity.id);
                                    if (result.success) {
                                      const updatedActivities = recentActivities.filter(a => a.id !== activity.id);
                                      setRecentActivities(updatedActivities);
                                      Toast.show({
                                        type: 'success',
                                        text1: 'Notificação removida',
                                        text2: 'A notificação foi removida com sucesso.',
                                      });
                                      setTimeout(async () => {
                                        await loadActivities();
                                      }, 1000);
                                    } else {
                                      Toast.show({
                                        type: 'error',
                                        text1: 'Erro ao remover',
                                        text2: result.error || 'Não foi possível remover a notificação.',
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Erro ao deletar notificação:', error);
                                    Toast.show({
                                      type: 'error',
                                      text1: 'Erro',
                                      text2: 'Não foi possível deletar a notificação.',
                                    });
                                  }
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.deleteLink}>excluir</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          {activity.dateTime && (
                            <Text style={styles.activityDateTime}>{activity.dateTime}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyActivities}>
                  <TimeIcon size={48} color={colors.gray300} />
                  <Text style={styles.emptyActivitiesText}>
                    {selectedTab === 'myGroups' 
                      ? 'Nenhuma atividade recente nos seus grupos'
                      : 'Nenhuma atividade recente nos grupos que você participa'}
                  </Text>
                </View>
              )}
            </View>
          );
        })()}
      </ScrollView>

      {/* Modal para entrar em grupo */}
      <Modal
        visible={inviteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalOverlay}
            onPress={() => setInviteModalVisible(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Entrar no Grupo</Text>
                <TouchableOpacity
                  onPress={() => setInviteModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>
                  Digite o código de convite que você recebeu:
                </Text>
                
                <View style={styles.codeInputContainer}>
                  <Ionicons name="key-outline" size={20} color={colors.gray400} />
                  <TextInput
                    style={styles.codeInput}
                    placeholder="Ex: ABC123XYZ"
                    placeholderTextColor={colors.gray400}
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="characters"
                    maxLength={20}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.joinButton, joiningGroup && styles.joinButtonDisabled]}
                  onPress={handleJoinWithCode}
                  disabled={joiningGroup}
                >
                  {joiningGroup ? (
                    <ActivityIndicator color={colors.textWhite} />
                  ) : (
                    <Text style={styles.joinButtonText}>Entrar no Grupo</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.error,
    marginTop: 24,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray600,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 16,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingContainer: {
    flexDirection: 'column',
  },
  greeting: {
    fontSize: 14,
    color: colors.textLight,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  profileIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.error + '10',
    marginRight: 8,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tabsRow: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  tabActive: {
    // Tab ativo
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textLight,
  },
  tabTextActive: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: colors.gray200, // Adicionar background para debug
    borderWidth: 1, // Adicionar borda para debug
    borderColor: colors.border, // Adicionar borda para debug
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  emptyState: {
    backgroundColor: colors.backgroundLight,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  viewMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  actionBigCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionBigCardIcon: {
    marginRight: 16,
  },
  actionBigCardContent: {
    flex: 1,
  },
  actionBigCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 4,
  },
  actionBigCardDescription: {
    fontSize: 13,
    color: colors.textWhite,
    opacity: 0.9,
  },
  activityCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  activityCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  activityMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityGroup: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  activityDateTime: {
    fontSize: 11,
    color: colors.gray400,
    fontStyle: 'italic',
    marginTop: 2,
    width: '100%',
  },
  deleteLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  emptyActivities: {
    backgroundColor: colors.backgroundLight,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyActivitiesText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 12,
  },
  caregiverSearchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B8E6B8', // Verde pastel suave
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  caregiverSearchIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(45, 80, 22, 0.15)', // Verde escuro com transparência para fundo pastel
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  caregiverSearchContent: {
    flex: 1,
  },
  caregiverSearchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016', // Verde escuro para contraste com fundo pastel
    marginBottom: 4,
  },
  caregiverSearchDescription: {
    fontSize: 14,
    color: '#4A7C2A', // Verde médio para contraste
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    gap: 16,
  },
  modalLabel: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 8,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  codeInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
});

export default HomeScreen;

