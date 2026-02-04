export const lightColors = {
  primary: '#4A5FCC',
  primaryDark: '#3A4FB8',
  primaryLight: '#5A6FDC',
  
  // Gradient colors - using shades of the logo blue
  gradientStart: '#4A5FCC',
  gradientEnd: '#5A6FDC',
  
  background: '#F9FAFB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  
  // Chat specific
  messageSent: '#4A5FCC',
  messageReceived: '#F3F4F6',
  online: '#10B981',
  offline: '#9CA3AF',
  
  // Badge
  badge: '#EF4444',
  badgeText: '#FFFFFF',
};

export const darkColors = {
  primary: '#4A5FCC',
  primaryDark: '#5A6FDC',
  primaryLight: '#3A4FB8',
  
  gradientStart: '#4A5FCC',
  gradientEnd: '#5A6FDC',
  
  background: '#111827',
  surface: '#1F2937',
  card: '#374151',
  
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  
  border: '#374151',
  borderLight: '#4B5563',
  
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  
  messageSent: '#4A5FCC',
  messageReceived: '#374151',
  online: '#10B981',
  offline: '#6B7280',
  
  badge: '#EF4444',
  badgeText: '#FFFFFF',
};

export type Colors = typeof lightColors;
