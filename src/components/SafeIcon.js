import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { 
  ArrowBackIcon, 
  InformationCircleOutlineIcon,
  CameraIcon,
  TrashIcon,
  CheckmarkCircleIcon,
  KeyOutlineIcon,
  ShareIcon,
  WarningIcon,
  CallIcon,
  ChevronForwardIcon,
  PeopleIcon,
  HeartIcon,
  PersonIcon,
  MedicalIcon,
  EditIcon,
  CalendarIcon,
  MailIcon,
  CheckmarkIcon,
  LocationIcon,
  LocationOutlineIcon,
  ChevronDownIcon,
  CloseIcon,
  AddIcon,
  MedicalOutlineIcon,
  DocumentAttachIcon,
  TrashOutlineIcon,
  CreateOutlineIcon,
  TimeIcon,
  TimeOutlineIcon,
  DocumentIcon,
  AddCircleOutlineIcon,
  FlaskIcon,
  FlaskOutlineIcon,
  FitnessOutlineIcon,
  EyeIcon,
  EyeOffIcon,
  SearchIcon,
  ImagesIcon,
  CloseCircleIcon,
  MoneyIcon,
  FolderIcon,
  ReceiptIcon,
  ImageIcon,
  MessagesIcon,
  PulseIcon,
  VideoIcon,
  VideoCamIcon,
  MicIcon,
  HomeIcon,
  SettingsIcon,
  NotificationIcon,
  NotificationsOutlineIcon,
  LogOutOutlineIcon,
  HelpCircleOutlineIcon,
  PlayIcon,
  PauseIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  MusicalNotesIcon,
} from './CustomIcons';

/**
 * Mapeamento de nomes de Ionicons para ícones SVG customizados
 */
const iconMap = {
  'arrow-back': ArrowBackIcon,
  'information-circle': InformationCircleOutlineIcon,
  'information-circle-outline': InformationCircleOutlineIcon,
  'camera': CameraIcon,
  'trash-outline': TrashOutlineIcon,
  'checkmark-circle': CheckmarkCircleIcon,
  'checkmark-circle-outline': CheckmarkCircleIcon, // Para filtros de status
  'checkmark-done-circle': CheckmarkCircleIcon, // Para status concluído
  'checkmark-done-circle-outline': CheckmarkCircleIcon, // Para estado vazio
  'key': KeyOutlineIcon,
  'key-outline': KeyOutlineIcon, // Para código/chave
  'share-social-outline': ShareIcon,
  'warning': WarningIcon,
  'call': CallIcon,
  'chevron-forward': ChevronForwardIcon,
  'chevron-down': ChevronDownIcon,
  'people': PeopleIcon,
  'people-outline': PeopleIcon,
  'heart': HeartIcon,
  'person': PersonIcon,
  'medical': MedicalIcon,
  'medical-outline': MedicalOutlineIcon,
  'create-outline': CreateOutlineIcon,
  'calendar-outline': CalendarIcon,
  'mail-outline': MailIcon,
  'checkmark': CheckmarkIcon,
  'shield-checkmark': CheckmarkCircleIcon,
  'medkit': MedicalIcon,
  'arrow-down-circle-outline': ArrowBackIcon,
  'arrow-up-circle-outline': CheckmarkCircleIcon,
  'swap-horizontal-outline': ArrowBackIcon,
  'location': LocationIcon,
  'location-outline': LocationOutlineIcon,
  'close': CloseIcon,
  'add': AddIcon,
  'add-circle': AddCircleOutlineIcon, // Para botão de adicionar
  'document-attach': DocumentAttachIcon,
  'document-text': DocumentIcon, // Para receita
  'document-text-outline': DocumentIcon, // Para receita (outline)
  'document': DocumentIcon, // Para documentos gerais
  'folder': FolderIcon, // Para pastas/arquivos
  'folder-open': FolderIcon, // Para pastas abertas (usar FolderIcon)
  'receipt': ReceiptIcon, // Para recibos
  'calendar': CalendarIcon, // Para calendário
  'calendar-outline': CalendarIcon, // Para calendário (outline)
  'flask': FlaskIcon, // Para exames laboratoriais
  'image': ImageIcon, // Para imagens
  'image-outline': ImageIcon, // Imagem (outline)
  'images': ImagesIcon, // Galeria de imagens
  'images-outline': ImagesIcon, // Galeria de imagens (outline)
  'videocam': VideoCamIcon, // Câmera de vídeo
  'videocam-outline': VideoCamIcon, // Câmera de vídeo (outline)
  'videocam-off': VideoIcon, // Vídeo desligado (usar VideoIcon com off)
  'play-circle': VideoIcon, // Play (usar VideoIcon)
  'cloud-upload-outline': DocumentAttachIcon, // Upload (usar DocumentAttachIcon como fallback)
  'chatbox-outline': MessagesIcon, // Chat (usar MessagesIcon como fallback)
  'time-outline': TimeOutlineIcon, // Para horários
  'archive-outline': TrashIcon, // Usar ícone de lixeira como fallback para arquivo
  'apps-outline': MedicalIcon, // Usar ícone médico como fallback para "todos"
  'sunny': CalendarIcon, // Usar calendário como fallback para sol
  'partly-sunny': CalendarIcon, // Usar calendário como fallback para sol parcial
  'moon': CalendarIcon, // Usar calendário como fallback para lua
  // Ícones de formas farmacêuticas
  'ellipse-outline': MedicalIcon, // Cápsula - usar ícone médico como fallback
  'water-outline': FlaskIcon, // Gotas/Solução - usar frasco como fallback
  'flask-outline': FlaskOutlineIcon, // Xarope - usar frasco outline
  'fitness-outline': FitnessOutlineIcon, // Pomada/Creme/Gel - usar fitness outline
  'bandage-outline': MedicalIcon, // Injetável/Ampola - usar ícone médico como fallback
  'square-outline': MedicalIcon, // Adesivo - usar ícone médico como fallback
  'cube-outline': MedicalIcon, // Supositório/Óvulo - usar ícone médico como fallback
  'airplane-outline': MedicalIcon, // Spray/Inalável - usar ícone médico como fallback
  'eye-outline': EyeIcon, // Colírio - usar ícone de olho
  'eye': EyeIcon, // Olho aberto - mostrar senha
  'eye-off': EyeOffIcon, // Olho fechado - ocultar senha
  // Ícones de busca e mídia
  'search': SearchIcon, // Lupa para busca
  'images': ImagesIcon, // Galeria de imagens
  'close-circle': CloseCircleIcon, // Fechar círculo
  // Ícones de dinheiro/preço
  'cash-outline': MoneyIcon, // Dinheiro/preço
  // Ícones adicionais para MedicationDetailsScreen
  'alert': WarningIcon, // Alerta simples
  'alert-circle': WarningIcon, // Alerta/atrasado
  'time': TimeIcon, // Horário
  'pulse': PulseIcon, // Pulse/Batimento (sinais vitais)
  'repeat': TimeIcon, // Frequência/repetição
  'water': FlaskIcon, // Via de administração
  // Ícones para PopularPharmacies
  'map-outline': LocationOutlineIcon, // Mapa
  'call-outline': CallIcon, // Telefone
  // Ícones para AddMedicationScreen
  'infinite': TimeIcon, // Infinito/contínuo
  'settings-outline': CreateOutlineIcon, // Configurações/outros
  // Ícones para AddDoctorScreen
  'person-outline': PersonIcon, // Pessoa/usuário
  'card-outline': DocumentIcon, // Cartão/documento
  'navigate-outline': LocationOutlineIcon, // Navegação
  'star': CheckmarkCircleIcon, // Estrela/favorito
  // Ícones para PanicSettingsScreen
  'mic-outline': MicIcon, // Microfone
  'mic': MicIcon, // Microfone (preenchido)
  'hand-left-outline': PersonIcon, // Mão (usar PersonIcon como fallback)
  'checkmark-circle-outline': CheckmarkCircleIcon, // Checkmark círculo outline
  // Ícones de áudio/playback
  'play': PlayIcon, // Play
  'pause': PauseIcon, // Pause
  'play-circle': PlayCircleIcon, // Play em círculo
  'pause-circle': PauseCircleIcon, // Pause em círculo
  'musical-notes': MusicalNotesIcon, // Notas musicais
  // Ícones para EditPersonalDataScreen
  'home-outline': HomeIcon, // Casa/endereço
  // Ícones para NotificationPreferencesScreen
  'settings': SettingsIcon, // Configurações
  'notifications': NotificationIcon, // Notificações
  'notifications-outline': NotificationsOutlineIcon, // Notificações outline
  'alarm': TimeIcon, // Alarme (usar TimeIcon como fallback)
  'bulb': WarningIcon, // Lâmpada/dica (usar WarningIcon como fallback)
  'cloud-download': DocumentAttachIcon, // Download (usar DocumentAttachIcon como fallback)
  'person-add': PersonIcon, // Adicionar pessoa (usar PersonIcon como fallback)
  'create': CreateOutlineIcon, // Criar/editar
  // Ícones para PatientJoinGroupScreen
  'log-out-outline': LogOutOutlineIcon, // Sair/logout
  'log-in-outline': LogOutOutlineIcon, // Entrar/login (usar LogOutOutlineIcon como fallback)
  'qr-code-outline': KeyOutlineIcon, // QR Code (usar KeyOutlineIcon como fallback)
  'help-circle-outline': HelpCircleOutlineIcon, // Ajuda
};

/**
 * Componente que garante renderização correta de ícones
 * Tenta usar ícone SVG customizado primeiro, depois Ionicons como fallback
 */
const SafeIcon = ({ name, size = 24, color = '#000000', style, ...props }) => {
  // Garantir que a cor não seja undefined ou transparente
  const iconColor = color || '#000000';
  const finalColor = iconColor === 'transparent' || !iconColor ? '#000000' : iconColor;
  
  // Verificar se existe ícone SVG customizado
  const CustomIcon = iconMap[name];
  
  if (CustomIcon) {
    // Usar ícone SVG customizado
    return <CustomIcon size={size} color={finalColor} style={style} {...props} />;
  }
  
  // Fallback para Ionicons
  try {
    return (
      <Ionicons
        name={name}
        size={size}
        color={finalColor}
        style={style}
        {...props}
      />
    );
  } catch (error) {
    // Se Ionicons falhar, retornar um placeholder
    console.warn(`Ícone não encontrado: ${name}`);
    return null;
  }
};

export default SafeIcon;
