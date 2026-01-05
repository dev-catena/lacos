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
  SearchIcon,
  ImagesIcon,
  CloseCircleIcon,
  MoneyIcon,
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
  // Ícones de busca e mídia
  'search': SearchIcon, // Lupa para busca
  'images': ImagesIcon, // Galeria de imagens
  'close-circle': CloseCircleIcon, // Fechar círculo
  // Ícones de dinheiro/preço
  'cash-outline': MoneyIcon, // Dinheiro/preço
  // Ícones adicionais para MedicationDetailsScreen
  'alert-circle': WarningIcon, // Alerta/atrasado
  'time': TimeIcon, // Horário
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
