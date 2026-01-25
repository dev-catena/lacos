import React from 'react';
import { View } from 'react-native';
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
export const AppointmentIcon = ({ size = 24, color = '#3b82f6' }) => {
  const iconColor = color || '#3b82f6';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Calendário */}
        <Rect x="3" y="6" width="18" height="15" rx="2" fill={iconColor} opacity="0.3" />
        <Rect x="3" y="4" width="18" height="4" rx="2" fill={iconColor} />
        {/* Linhas do topo */}
        <Line x1="8" y1="2" x2="8" y2="6" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        <Line x1="16" y1="2" x2="16" y2="6" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        {/* Cruz médica */}
        <Line x1="12" y1="12" x2="12" y2="16" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        <Line x1="10" y1="14" x2="14" y2="14" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

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
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
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
  </View>
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
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
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
  </View>
);

// 👤 Ícone de Perfil - Pessoa
export const ProfileIcon = ({ size = 24, color = '#6366f1', filled = false }) => {
  // Garantir que a cor seja sempre válida
  const iconColor = color || '#6366f1';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle 
        cx="12" 
        cy="8" 
        r="4" 
        fill={filled ? iconColor : 'none'} 
        stroke={iconColor} 
        strokeWidth={filled ? 0 : 2}
        strokeLinecap="round"
      />
      <Path
        d="M4 20v-2c0-3.31 2.69-6 6-6h4c3.31 0 6 2.69 6 6v2"
        stroke={iconColor}
        strokeWidth={filled ? 0 : 2}
        fill={filled ? iconColor : 'none'}
        opacity={filled ? 0.6 : 1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

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
export const CalendarIcon = ({ size = 24, color = '#f59e0b' }) => {
  const iconColor = color || '#f59e0b';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Corpo do calendário */}
        <Rect x="3" y="6" width="18" height="15" rx="2" fill={iconColor} opacity="0.3" />
        {/* Topo do calendário */}
        <Rect x="3" y="4" width="18" height="4" rx="2" fill={iconColor} />
        {/* Argolas */}
        <Line x1="8" y1="2" x2="8" y2="6" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        <Line x1="16" y1="2" x2="16" y2="6" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        {/* Dias */}
        <Circle cx="8" cy="12" r="1" fill={iconColor} />
        <Circle cx="12" cy="12" r="1" fill={iconColor} />
        <Circle cx="16" cy="12" r="1" fill={iconColor} />
        <Circle cx="8" cy="16" r="1" fill={iconColor} />
        <Circle cx="12" cy="16" r="1" fill={iconColor} />
      </Svg>
    </View>
  );
};

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
export const PersonIcon = ({ size = 24, color = '#6b7280' }) => {
  const iconColor = color || '#6b7280';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="4" fill={iconColor} opacity="0.3" />
        <Path
          d="M5 20c0-4 3-7 7-7s7 3 7 7"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

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
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
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

// ⬇️ Ícone de Seta para Baixo (Chevron Down)
export const ChevronDownIcon = ({ size = 24, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9l6 6 6-6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 👁️ Ícone de Olho Aberto (Eye)
export const EyeIcon = ({ size = 24, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
  </Svg>
);

// 👁️‍🗨️ Ícone de Olho Fechado (Eye Off)
export const EyeOffIcon = ({ size = 24, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
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
export const MedicalIcon = ({ size = 24, color = '#ec4899' }) => {
  const iconColor = color || '#ec4899';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" fill={iconColor} opacity="0.3" />
        <Path
          d="M12 8v8M8 12h8"
          stroke={iconColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// 📄 Ícone de Documento
export const DocumentIcon = ({ size = 24, color = '#6366f1' }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          fill={iconColor}
          opacity="0.3"
        />
        <Path
          d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// 🧾 Ícone de Receita
export const ReceiptIcon = ({ size = 24, color = '#10b981' }) => {
  const iconColor = color || '#10b981';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 2h16v20l-4-4-4 4-4-4-4 4V2z"
          fill={iconColor}
          opacity="0.3"
        />
        <Path
          d="M8 8h8M8 12h8M8 16h4"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// 📞 Ícone de Chamada
export const CallIcon = ({ size = 24, color = '#ef4444' }) => {
  const iconColor = color || '#ef4444';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
          fill={iconColor}
          opacity="0.3"
        />
        <Path
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 🎤 Ícone de Microfone
export const MicIcon = ({ size = 24, color = '#6366f1', muted = false }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {muted ? (
          <>
            <Path
              d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
              fill={iconColor}
              opacity="0.3"
            />
            <Path
              d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
              stroke={iconColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Line x1="1" y1="1" x2="23" y2="23" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <Path
              d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
              fill={iconColor}
              opacity="0.3"
            />
            <Path
              d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
              stroke={iconColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </Svg>
    </View>
  );
};

// 📹 Ícone de Vídeo
export const VideoIcon = ({ size = 24, color = '#6366f1', off = false }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {off ? (
          <>
            <Path
              d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"
              fill={iconColor}
              opacity="0.3"
            />
            <Path
              d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"
              stroke={iconColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Line x1="1" y1="1" x2="23" y2="23" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <Path
              d="M23 7l-7 5 7 5V7z"
              fill={iconColor}
            />
            <Path
              d="M14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"
              fill={iconColor}
              opacity="0.3"
            />
          </>
        )}
      </Svg>
    </View>
  );
};

// 💬 Ícone de Chat
export const ChatIcon = ({ size = 24, color = '#6366f1' }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          fill={iconColor}
          opacity="0.3"
        />
        <Path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Circle cx="9" cy="12" r="1" fill={iconColor} />
        <Circle cx="15" cy="12" r="1" fill={iconColor} />
      </Svg>
    </View>
  );
};

// 📧 Ícone de Email/Mail
export const MailIcon = ({ size = 24, color = '#6366f1' }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
          fill={iconColor}
          opacity="0.3"
        />
        <Path
          d="M22 6l-10 7L2 6"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 👥 Ícone de Pessoas/Grupo
export const PeopleIcon = ({ size = 24, color = '#6366f1' }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="9" cy="7" r="4" fill={iconColor} opacity="0.3" />
        <Path
          d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 📁 Ícone de Pasta/Arquivos
export const FolderIcon = ({ size = 24, color = '#6366f1' }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
          fill={iconColor}
          opacity="0.3"
        />
        <Path
          d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// ⭐ Ícone de Estrela (para avaliações)
export const StarIcon = ({ size = 24, color = '#fbbf24', filled = false }) => {
  const iconColor = color || '#fbbf24';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={filled ? iconColor : 'none'}
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={filled ? 1 : 0.5}
        />
      </Svg>
    </View>
  );
};

// ⚠️ Ícone de Alerta/Erro
export const AlertIcon = ({ size = 24, color = '#ef4444' }) => {
  const iconColor = color || '#ef4444';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" fill={iconColor} opacity="0.3" />
        <Path
          d="M12 8v4M12 16h.01"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 📜 Ícone de Histórico/Timeline
export const HistoryIcon = ({ size = 24, color = '#3b82f6' }) => {
  const iconColor = color || '#3b82f6';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" fill={iconColor} opacity="0.3" />
        <Path
          d="M12 6v6l4 2"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="12" cy="12" r="9" stroke={iconColor} strokeWidth="2" />
      </Svg>
    </View>
  );
};

// 🏥 Ícone de Medical Kit (Médicos)
export const MedicalKitIcon = ({ size = 24, color = '#FF6B6B' }) => {
  const iconColor = color || '#FF6B6B';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 8h-3V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2z"
          fill={iconColor}
          opacity="0.3"
        />
        <Path
          d="M20 8h-3V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM12 13v4M10 15h4"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 🖼️ Ícone de Imagens/Mídias
export const ImagesIcon = ({ size = 24, color = '#FF6F00' }) => {
  const iconColor = color || '#FF6F00';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="3" width="18" height="18" rx="2" fill={iconColor} opacity="0.3" />
        <Circle cx="8.5" cy="8.5" r="1.5" fill={iconColor} />
        <Path
          d="M21 15l-5-5L5 21"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// ⚠️ Ícone de Warning (Sensor de Queda)
export const WarningIcon = ({ size = 24, color = '#FF6B6B' }) => {
  const iconColor = color || '#FF6B6B';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          fill={iconColor}
          opacity="0.3"
        />
        <Path
          d="M12 9v4M12 17h.01"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// ℹ️ Ícone de Informação
export const InfoIcon = ({ size = 24, color = '#3b82f6' }) => {
  const iconColor = color || '#3b82f6';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" fill={iconColor} opacity="0.3" />
        <Path
          d="M12 16v-4M12 8h.01"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 🗑️ Ícone de Lixeira/Excluir
export const TrashIcon = ({ size = 24, color = '#ef4444' }) => {
  const iconColor = color || '#ef4444';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Line x1="10" y1="11" x2="10" y2="17" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        <Line x1="14" y1="11" x2="14" y2="17" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

// ⬇️ Ícone de Download
export const DownloadIcon = ({ size = 24, color = '#6366f1' }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 💰 Ícone de Dinheiro
export const MoneyIcon = ({ size = 24, color = '#10b981' }) => {
  const iconColor = color || '#10b981';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" fill={iconColor} opacity="0.3" />
        <Path
          d="M12 6v12M9 9h6M9 15h6"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="12" cy="12" r="1" fill={iconColor} />
      </Svg>
    </View>
  );
};

// 🔍 Ícone de Busca
export const SearchIcon = ({ size = 24, color = '#6b7280' }) => {
  const iconColor = color || '#6b7280';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="11" cy="11" r="8" stroke={iconColor} strokeWidth="2" />
        <Path
          d="m21 21-4.35-4.35"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 🎛️ Ícone de Filtro
export const FilterIcon = ({ size = 24, color = '#6366f1', filled = false }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
          fill={filled ? iconColor : 'none'}
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={filled ? 1 : 0.7}
        />
      </Svg>
    </View>
  );
};

// ✅ Ícone de Check/Checkmark
export const CheckIcon = ({ size = 24, color = '#10b981' }) => {
  const iconColor = color || '#10b981';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" fill={iconColor} opacity="0.3" />
        <Path
          d="M9 12l2 2 4-4"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 🧪 Ícone de Frasco/Exame Laboratorial
export const FlaskIcon = ({ size = 24, color = '#3b82f6' }) => {
  const iconColor = color || '#3b82f6';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 2v6M15 2v6M12 2v6M6 8h12M5 8l1 12h12l1-12H5z"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M5 8l1 12h12l1-12"
          fill={iconColor}
          opacity="0.3"
        />
      </Svg>
    </View>
  );
};

// 🖼️ Ícone de Imagem
export const ImageIcon = ({ size = 24, color = '#10b981' }) => {
  const iconColor = color || '#10b981';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="3" width="18" height="18" rx="2" fill={iconColor} opacity="0.3" />
        <Circle cx="8.5" cy="8.5" r="1.5" fill={iconColor} />
        <Path
          d="M21 15l-5-5L5 21"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 👤 Ícone de Pessoa Masculina
export const MaleIcon = ({ size = 24, color = '#3b82f6' }) => {
  const iconColor = color || '#3b82f6';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="10" cy="8" r="4" fill={iconColor} opacity="0.3" />
        <Path
          d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M20 8v6M17 11h6"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 👩 Ícone de Pessoa Feminina
export const FemaleIcon = ({ size = 24, color = '#ec4899' }) => {
  const iconColor = color || '#ec4899';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="4" fill={iconColor} opacity="0.3" />
        <Path
          d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M14 2v6M11 5h6"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 🏋️ Ícone de Fitness Outline (para fisioterapia)
export const FitnessOutlineIcon = ({ size = 24, color = '#10b981' }) => {
  const iconColor = color || '#10b981';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6.5 6.5L12 12l5.5-5.5M12 12v9M12 12H3M12 12h9"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="12" cy="12" r="2" fill={iconColor} opacity="0.3" />
      </Svg>
    </View>
  );
};

// 🧪 Ícone de Flask Outline (para exames)
export const FlaskOutlineIcon = ({ size = 24, color = '#3b82f6' }) => {
  const iconColor = color || '#3b82f6';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 2v6M15 2v6M12 2v6M6 8h12M5 8l1 12h12l1-12H5z"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M5 8l1 12h12l1-12"
          fill={iconColor}
          opacity="0.2"
        />
      </Svg>
    </View>
  );
};

// 📝 Ícone de Text Outline (para título)
export const TextOutlineIcon = ({ size = 24, color = '#6b7280' }) => {
  const iconColor = color || '#6b7280';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 4h16M4 8h12M4 12h16M4 16h8"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// 📹 Ícone de Video Cam Outline (para teleconsulta)
export const VideoCamOutlineIcon = ({ size = 24, color = '#1f2937' }) => {
  const iconColor = color || '#1f2937';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M23 7l-7 5 7 5V7z"
          fill={iconColor}
          opacity="0.3"
        />
        <Path
          d="M14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};

// ⚠️ Ícone de Alert Circle Outline (para alertas)
export const AlertCircleOutlineIcon = ({ size = 24, color = '#f59e0b' }) => {
  const iconColor = color || '#f59e0b';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2" fill="none" />
        <Path
          d="M12 8v4M12 16h.01"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// ✅ Ícone de Checkmark Circle (para seleção)
export const CheckmarkCircleIcon = ({ size = 24, color = '#10b981' }) => {
  const iconColor = color || '#10b981';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" fill={iconColor} opacity="0.3" />
        <Path
          d="M9 12l2 2 4-4"
          stroke={iconColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// ⭐ Ícone de Star Half (meio preenchido)
export const StarHalfIcon = ({ size = 24, color = '#fbbf24' }) => {
  const iconColor = color || '#fbbf24';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={iconColor}
          opacity="0.5"
        />
        <Path
          d="M12 2v15.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={iconColor}
        />
      </Svg>
    </View>
  );
};

// ⭐ Ícone de Star Outline (vazio)
export const StarOutlineIcon = ({ size = 24, color = '#9ca3af' }) => {
  const iconColor = color || '#9ca3af';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};

// 🎓 Ícone de School (para formação)
export const SchoolIcon = ({ size = 24, color = '#6366f1' }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
          fill={iconColor}
          opacity="0.3"
        />
        <Path
          d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};

// ℹ️ Ícone de Information Circle (preenchido)
export const InformationCircleIcon = ({ size = 24, color = '#3b82f6' }) => {
  const iconColor = color || '#3b82f6';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" fill={iconColor} opacity="0.3" />
        <Path
          d="M12 16v-4M12 8h.01"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// ℹ️ Ícone de Information Circle Outline (vazio)
export const InformationCircleOutlineIcon = ({ size = 24, color = '#6366f1' }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2" fill="none" />
        <Path
          d="M12 16v-4M12 8h.01"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// ✅ Ícone de Checkmark (simples)
export const CheckmarkIcon = ({ size = 24, color = '#6366f1' }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 6L9 17l-5-5"
          stroke={iconColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// 🩺 Ícone de Medical Outline (para comorbidades)
export const MedicalOutlineIcon = ({ size = 24, color = '#f59e0b' }) => {
  const iconColor = color || '#f59e0b';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={iconColor} strokeWidth="2" fill="none" />
        <Path
          d="M12 8v8M8 12h8"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// 💊 Ícone de Pills Outline (para medicações)
export const PillsOutlineIcon = ({ size = 24, color = '#6366f1' }) => {
  const iconColor = color || '#6366f1';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M8 7h8v2H8V7z"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M7 9h10v10c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2V9z"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Rect x="9" y="4" width="6" height="3" rx="1" fill={iconColor} opacity="0.3" />
        <Line x1="12" y1="13" x2="12" y2="17" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        <Line x1="10" y1="15" x2="14" y2="15" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

// 📹 Ícone de Video Camera (para iniciar consulta)
export const VideoCamIcon = ({ size = 24, color = '#ffffff' }) => {
  const iconColor = color || '#ffffff';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M23 7l-7 5 7 5V7z"
          fill={iconColor}
        />
        <Path
          d="M14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"
          fill={iconColor}
          opacity="0.3"
        />
      </Svg>
    </View>
  );
};

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
  TrashIcon,
  DownloadIcon,
  MoneyIcon,
  SearchIcon,
  FilterIcon,
  CheckIcon,
  FlaskIcon,
  ImageIcon,
  MaleIcon,
  FemaleIcon,
  NavigateIcon,
  EditIcon,
  ChevronForwardIcon,
  ArrowBackIcon,
  AddIcon,
  CloseIcon,
  MapPinIcon,
  MedicalIcon,
  DocumentIcon,
  ReceiptIcon,
  CallIcon,
  MicIcon,
  VideoIcon,
  ChatIcon,
  
  // Email/Mail
  MailIcon,
  
  // People/Grupo
  PeopleIcon,
  
  // Folder/Arquivos
  FolderIcon,
  
  // Star/Avaliação
  StarIcon,
  
  // Alert/Erro
  AlertIcon,
  
  // Histórico
  HistoryIcon,
  
  // Medical Kit (Médicos)
  MedicalKitIcon,
  
  // Images (Mídias)
  ImagesIcon,
  
  // Warning (Sensor de Queda)
  WarningIcon,
  
  // Medical Outline (para comorbidades)
  MedicalOutlineIcon,
  
  // Pills Outline (para medicações)
  PillsOutlineIcon,
  
  // Video Camera (para iniciar consulta)
  VideoCamIcon,
  
  // Text Outline (para título)
  TextOutlineIcon,
  
  // Video Cam Outline (para teleconsulta)
  VideoCamOutlineIcon,
  
  // Alert Circle Outline (para alertas)
  AlertCircleOutlineIcon,
  
  // Checkmark Circle (para seleção)
  CheckmarkCircleIcon,
  
  // Star (para avaliações)
  StarIcon,
  
  // Star Half (para avaliações)
  StarHalfIcon,
  
  // Star Outline (para avaliações)
  StarOutlineIcon,
  
  // School (para formação)
  SchoolIcon,
  
  // Information Circle (para informações)
  InformationCircleIcon,
  
  // Information Circle Outline (para informações)
  InformationCircleOutlineIcon,
  
  // Checkmark (para confirmação)
  CheckmarkIcon,
  
  // Fitness Outline (para fisioterapia)
  FitnessOutlineIcon,
  
  // Flask Outline (para exames)
  FlaskOutlineIcon,
  
  // Close Circle (para fechar/bloquear)
  CloseCircleIcon,
  
  // Chevron Back (seta para esquerda)
  ChevronBackIcon,
  
  // Save Outline (para salvar)
  SaveOutlineIcon,
  
  // Lock Closed (cadeado fechado)
  LockClosedIcon,
  
  // Add Circle Outline (adicionar)
  AddCircleOutlineIcon,
  
  // Time Outline (para horários)
  TimeOutlineIcon,
  
  // Location Outline (para localização)
  LocationOutlineIcon,
  
  // Heart (coração)
  HeartIcon,
  
  // Alert Circle (preenchido)
  AlertCircleIcon,
  
  // Video Cam Off (vídeo desligado)
  VideoCamOffIcon,
  
  // Send (enviar)
  SendIcon,
  
  // Document Attach (anexar documento)
  DocumentAttachIcon,
  
  // Paper Plane (avião de papel)
  PaperPlaneIcon,
};

// ============================================================================
// ÍCONES PARA PERFIL DE PACIENTE
// ============================================================================

// 📧 Ícone de Email Outline
export const MailOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="22,6 12,13 2,6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 👥 Ícone de Pessoas Outline
export const PeopleOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 👤 Ícone de Pessoa Outline
export const PersonOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  </View>
);

// 📅 Ícone de Calendário Outline
export const CalendarOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  </View>
);

// ❓ Ícone de Ajuda Outline
export const HelpCircleOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  </View>
);

// 📞 Ícone de Telefone Outline
export const CallOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 🚪 Ícone de Logout Outline
export const LogOutOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="16 17 21 12 16 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  </View>
);

// 📷 Ícone de Câmera
export const CameraIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  </View>
);

// 🔒 Ícone de Cadeado Outline
export const LockClosedOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth="2" />
      <Path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 🔔 Ícone de Notificações Outline
export const NotificationsOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 🔑 Ícone de Chave Outline
export const KeyOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 📄 Ícone de Documento Outline
export const DocumentTextOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="14 2 14 8 20 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="2" />
      <Polyline points="10 9 9 9 8 9" stroke={color} strokeWidth="2" />
    </Svg>
  </View>
);

// 💬 Ícone WhatsApp
export const WhatsAppIcon = ({ size = 24, color = '#25D366' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </Svg>
);

// ⏰ Ícone de Relógio Outline
export const TimeOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  </View>
);

// 🆔 Ícone de Cartão/ID Outline
export const CardOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke={color} strokeWidth="2" />
    <Line x1="1" y1="10" x2="23" y2="10" stroke={color} strokeWidth="2" />
  </Svg>
);

// 📍 Ícone de Localização Outline
export const LocationOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  </View>
);

// ✏️ Ícone de Editar Outline
export const CreateOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 🗑️ Ícone de Lixeira Outline
export const TrashOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="3 6 5 6 21 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ❌ Ícone de Círculo com X (Close Circle)
export const CloseCircleIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  </View>
);

// ⬅️ Ícone de Chevron Back (seta para esquerda)
export const ChevronBackIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="15 18 9 12 15 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 💾 Ícone de Salvar Outline
export const SaveOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="17 21 17 13 7 13 7 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="7 3 7 8 15 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 🔒 Ícone de Cadeado Fechado (preenchido)
export const LockClosedIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill={color} />
      <Path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// ➕ Ícone de Adicionar Círculo Outline
export const AddCircleOutlineIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  </View>
);

// ❤️ Ícone de Coração (Heart)
export const HeartIcon = ({ size = 24, color = '#ec4899' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={color}
        stroke={color}
        strokeWidth="1"
      />
    </Svg>
  </View>
);

// ⚠️ Ícone de Alert Circle (preenchido)
export const AlertCircleIcon = ({ size = 24, color = '#ef4444' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} />
      <Path
        d="M12 8v4M12 16h.01"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

// 📹 Ícone de Vídeo Desligado
export const VideoCamOffIcon = ({ size = 24, color = '#6b7280' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  </View>
);

// 📤 Ícone de Enviar (Send)
export const SendIcon = ({ size = 24, color = '#6366f1' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// 📎 Ícone de Document Attach
export const DocumentAttachIcon = ({ size = 24, color = '#6366f1' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// ✈️ Ícone de Avião de Papel (Paper Plane)
export const PaperPlaneIcon = ({ size = 24, color = '#6366f1' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);


