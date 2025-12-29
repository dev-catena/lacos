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
  'document-attach': DocumentAttachIcon,
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
