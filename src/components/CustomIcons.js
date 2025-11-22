import React from 'react';
import Svg, { Path, Circle, Rect, Line, G, Ellipse, Polyline } from 'react-native-svg';

// ============================================================================
// ÍCONES DE AÇÕES RÁPIDAS
// ============================================================================

// 💊 Ícone de Medicação - Frasco de remédio
export const MedicationIcon = ({ size = 24, color = '#6366f1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Frasco */}
    <Path
      d="M8 7h8v2H8V7z"
      fill={color}
    />
    <Path
      d="M7 9h10v10c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2V9z"
      fill={color}
      opacity="0.3"
    />
    {/* Tampa */}
    <Rect x="9" y="4" width="6" height="3" rx="1" fill={color} />
    {/* Cruz médica */}
    <Line x1="12" y1="13" x2="12" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="10" y1="15" x2="14" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// 💓 Ícone de Sinais Vitais - Coração com batimento
export const VitalSignsIcon = ({ size = 24, color = '#ec4899' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Coração */}
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={color}
      opacity="0.3"
    />
    {/* Linha de batimento */}
    <Path
      d="M6 12h3l2-4 2 8 2-4h3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// 📅 Ícone de Consulta - Calendário com cruz médica
export const AppointmentIcon = ({ size = 24, color = '#3b82f6' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Calendário */}
    <Rect x="3" y="6" width="18" height="15" rx="2" fill={color} opacity="0.3" />
    <Rect x="3" y="4" width="18" height="4" rx="2" fill={color} />
    {/* Linhas do topo */}
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    {/* Cruz médica */}
    <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="10" y1="14" x2="14" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// 💬 Ícone de Mensagens - Balões de conversa
export const MessagesIcon = ({ size = 24, color = '#10b981' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Balão grande */}
    <Path
      d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
      fill={color}
      opacity="0.3"
    />
    {/* Pontinhos de conversa */}
    <Circle cx="8" cy="10" r="1.5" fill={color} />
    <Circle cx="12" cy="10" r="1.5" fill={color} />
    <Circle cx="16" cy="10" r="1.5" fill={color} />
  </Svg>
);

// ============================================================================
// ÍCONES DE NAVEGAÇÃO
// ============================================================================

// 🏠 Ícone Home - Casa acolhedora
export const HomeIcon = ({ size = 24, color = '#6366f1', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={filled ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {filled && <Rect x="10" y="14" width="4" height="6" fill={color} opacity="0.6" />}
  </Svg>
);

// 👥 Ícone de Grupos - Pessoas juntas
export const GroupsIcon = ({ size = 24, color = '#6366f1', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Pessoa central */}
    <Circle cx="12" cy="8" r="3" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" />
    <Path
      d="M12 12c-3.31 0-6 2.69-6 6v2h12v-2c0-3.31-2.69-6-6-6z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth="2"
      opacity={filled ? 0.8 : 1}
    />
    {/* Pessoa esquerda */}
    <Circle cx="5" cy="9" r="2" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5" opacity="0.6" />
    <Path
      d="M2 20v-1.5c0-2 1.34-3.5 3-3.5"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
      opacity="0.6"
    />
    {/* Pessoa direita */}
    <Circle cx="19" cy="9" r="2" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5" opacity="0.6" />
    <Path
      d="M22 20v-1.5c0-2-1.34-3.5-3-3.5"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
      opacity="0.6"
    />
  </Svg>
);

// 🔔 Ícone de Notificações - Sino
export const NotificationIcon = ({ size = 24, color = '#6366f1', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Sino */}
    <Path
      d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={filled ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 👤 Ícone de Perfil - Pessoa
export const ProfileIcon = ({ size = 24, color = '#6366f1', filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" />
    <Path
      d="M4 20v-2c0-3.31 2.69-6 6-6h4c3.31 0 6 2.69 6 6v2"
      stroke={color}
      strokeWidth="2"
      fill={filled ? color : 'none'}
      opacity={filled ? 0.6 : 1}
      strokeLinecap="round"
    />
  </Svg>
);

// ============================================================================
// ÍCONES FUNCIONAIS
// ============================================================================

// 🧓 Ícone de Idoso/Acompanhado - Pessoa com bengala
export const ElderlyIcon = ({ size = 24, color = '#6366f1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Cabeça */}
    <Circle cx="12" cy="5" r="3" fill={color} />
    {/* Corpo */}
    <Path
      d="M12 8c-2 0-3.5 1.5-3.5 3.5V18h2v4h3v-4h2v-6.5C15.5 9.5 14 8 12 8z"
      fill={color}
      opacity="0.7"
    />
    {/* Bengala */}
    <Path
      d="M16 10c0-1.1.9-2 2-2s2 .9 2 2c0 .5-.2.9-.5 1.3L17 22"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

// 🏥 Ícone de Hospital/Emergência
export const EmergencyIcon = ({ size = 24, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Cruz de emergência */}
    <Path
      d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"
      fill={color}
      opacity="0.3"
    />
    {/* Cruz branca */}
    <Path
      d="M12 6v12M6 12h12"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

// 📋 Ícone de Histórico Médico
export const MedicalHistoryIcon = ({ size = 24, color = '#6366f1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Prancheta */}
    <Rect x="5" y="2" width="14" height="20" rx="2" fill={color} opacity="0.3" />
    <Rect x="8" y="1" width="8" height="4" rx="1" fill={color} />
    {/* Linhas de texto */}
    <Line x1="8" y1="9" x2="16" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="8" y1="15" x2="13" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    {/* Cruz médica pequena */}
    <Path
      d="M17 16v4M15 18h4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// 🎯 Ícone de Código de Convite
export const InviteCodeIcon = ({ size = 24, color = '#6366f1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Ticket/Convite */}
    <Rect x="3" y="6" width="18" height="12" rx="2" fill={color} opacity="0.3" />
    {/* Código de barras estilizado */}
    <Line x1="7" y1="9" x2="7" y2="15" stroke={color} strokeWidth="1.5" />
    <Line x1="10" y1="9" x2="10" y2="15" stroke={color} strokeWidth="2" />
    <Line x1="12" y1="9" x2="12" y2="15" stroke={color} strokeWidth="1" />
    <Line x1="14" y1="9" x2="14" y2="15" stroke={color} strokeWidth="2" />
    <Line x1="17" y1="9" x2="17" y2="15" stroke={color} strokeWidth="1.5" />
    {/* Cortes laterais */}
    <Circle cx="3" cy="12" r="1.5" fill="white" />
    <Circle cx="21" cy="12" r="1.5" fill="white" />
  </Svg>
);

// 👨‍⚕️ Ícone de Cuidador
export const CaregiverIcon = ({ size = 24, color = '#6366f1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Pessoa com coração */}
    <Circle cx="12" cy="6" r="3" fill={color} />
    <Path
      d="M12 10c-3 0-5.5 2-5.5 4.5V20h11v-5.5C17.5 12 15 10 12 10z"
      fill={color}
      opacity="0.6"
    />
    {/* Coração pequeno */}
    <Path
      d="M12 14l-1-1c-1.5-1.5-1.5-3.5 0-4s3.5-.5 4 1c.5-1.5 2.5-2 4-1s1.5 2.5 0 4l-1 1-3 3-3-3z"
      fill="#ec4899"
      scale="0.3"
      transform="translate(8, 12)"
    />
  </Svg>
);

// 📱 Ícone de App Companion (para idoso)
export const CompanionAppIcon = ({ size = 24, color = '#6366f1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Celular */}
    <Rect x="6" y="2" width="12" height="20" rx="2" fill={color} opacity="0.3" />
    <Rect x="6" y="2" width="12" height="3" rx="2" fill={color} />
    <Circle cx="12" cy="19" r="1.5" fill={color} />
    {/* Coração no centro */}
    <Path
      d="M12 15l-2-2c-1-1-1-2.5 0-3s2.5-.5 3 .5c.5-1 1.5-1.5 3-.5s1 2 0 3l-2 2-2 2-2-2z"
      fill="#ec4899"
      scale="0.7"
      transform="translate(2, 1)"
    />
  </Svg>
);

// ⚙️ Ícone de Configurações/Permissões
export const PermissionsIcon = ({ size = 24, color = '#6366f1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Engrenagem */}
    <Path
      d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      fill={color}
      opacity="0.3"
    />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

// ✅ Ícone de Sucesso/Check
export const SuccessIcon = ({ size = 24, color = '#10b981' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} opacity="0.3" />
    <Path
      d="M9 12l2 2 4-4"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// ❌ Ícone de Erro
export const ErrorIcon = ({ size = 24, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} opacity="0.3" />
    <Path
      d="M15 9l-6 6M9 9l6 6"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
  </Svg>
);

// 📤 Ícone de Compartilhar
export const ShareIcon = ({ size = 24, color = '#6366f1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Círculos conectados */}
    <Circle cx="18" cy="5" r="3" fill={color} />
    <Circle cx="6" cy="12" r="3" fill={color} opacity="0.7" />
    <Circle cx="18" cy="19" r="3" fill={color} opacity="0.7" />
    {/* Linhas de conexão */}
    <Line x1="8.5" y1="13" x2="15.5" y2="18" stroke={color} strokeWidth="2" />
    <Line x1="8.5" y1="11" x2="15.5" y2="6" stroke={color} strokeWidth="2" />
  </Svg>
);

// 📍 Ícone de Localização/Endereço
export const LocationIcon = ({ size = 24, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
      fill={color}
      opacity="0.3"
    />
    <Circle cx="12" cy="9" r="2.5" fill={color} />
  </Svg>
);

// ============================================================================
// ÍCONES ADICIONAIS PARA UI
// ============================================================================

// 📅 Ícone de Calendário (para botão Agenda)
export const CalendarIcon = ({ size = 24, color = '#f59e0b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Corpo do calendário */}
    <Rect x="3" y="6" width="18" height="15" rx="2" fill={color} opacity="0.3" />
    {/* Topo do calendário */}
    <Rect x="3" y="4" width="18" height="4" rx="2" fill={color} />
    {/* Argolas */}
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    {/* Dias */}
    <Circle cx="8" cy="12" r="1" fill={color} />
    <Circle cx="12" cy="12" r="1" fill={color} />
    <Circle cx="16" cy="12" r="1" fill={color} />
    <Circle cx="8" cy="16" r="1" fill={color} />
    <Circle cx="12" cy="16" r="1" fill={color} />
  </Svg>
);

// ⚙️ Ícone de Configurações/Settings
export const SettingsIcon = ({ size = 24, color = '#6366f1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Engrenagem */}
    <Path
      d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z"
      fill={color}
      opacity="0.3"
    />
    {/* Centro */}
    <Circle cx="12" cy="12" r="3" fill={color} />
  </Svg>
);

// 🔴 Ícone de Pulse/Batimento (para sinais vitais)
export const PulseIcon = ({ size = 24, color = '#10b981' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12h4l3-8 4 16 3-8h4"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// ⏰ Ícone de Relógio/Tempo
export const TimeIcon = ({ size = 24, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" fill={color} opacity="0.3" />
    <Path
      d="M12 6v6l4 2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 👤 Ícone de Pessoa
export const PersonIcon = ({ size = 24, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" fill={color} opacity="0.3" />
    <Path
      d="M5 20c0-4 3-7 7-7s7 3 7 7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// 🧭 Ícone de Navegação/Bússola
export const NavigateIcon = ({ size = 24, color = '#3b82f6' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
    <Path
      d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
      fill={color}
    />
  </Svg>
);

// ✏️ Ícone de Editar/Lápis
export const EditIcon = ({ size = 24, color = '#6366f1' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
      fill={color}
      opacity="0.3"
    />
    <Path
      d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      fill={color}
    />
  </Svg>
);

// ➡️ Ícone de Seta para Frente
export const ChevronForwardIcon = ({ size = 24, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ⬅️ Ícone de Seta para Trás
export const ArrowBackIcon = ({ size = 24, color = '#1f2937' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ➕ Ícone de Adicionar/Mais
export const AddIcon = ({ size = 24, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
  </Svg>
);

// ✕ Ícone de Fechar/Close
export const CloseIcon = ({ size = 24, color = '#1f2937' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

// 📍 Ícone de Pin/Marcador de Mapa
export const MapPinIcon = ({ size = 24, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
      fill={color}
    />
    <Circle cx="12" cy="9" r="2.5" fill="#ffffff" />
  </Svg>
);

// 🩺 Ícone Médico (cruz médica)
export const MedicalIcon = ({ size = 24, color = '#ec4899' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} opacity="0.3" />
    <Path
      d="M12 8v8M8 12h8"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
  </Svg>
);

export default {
  // Ações Rápidas
  MedicationIcon,
  VitalSignsIcon,
  AppointmentIcon,
  MessagesIcon,
  
  // Navegação
  HomeIcon,
  GroupsIcon,
  NotificationIcon,
  ProfileIcon,
  
  // Funcionais
  ElderlyIcon,
  EmergencyIcon,
  MedicalHistoryIcon,
  InviteCodeIcon,
  CaregiverIcon,
  CompanionAppIcon,
  PermissionsIcon,
  SuccessIcon,
  ErrorIcon,
  ShareIcon,
  LocationIcon,
  
  // UI/Ações
  CalendarIcon,
  SettingsIcon,
  PulseIcon,
  TimeIcon,
  PersonIcon,
  NavigateIcon,
  EditIcon,
  ChevronForwardIcon,
  ArrowBackIcon,
  AddIcon,
  CloseIcon,
  MapPinIcon,
  MedicalIcon,
};

