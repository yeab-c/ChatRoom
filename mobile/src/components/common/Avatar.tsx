import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  online?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = '?',
  size = 'medium',
  online,
  style,
  onPress,
}) => {
  const { theme } = useTheme();

  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 120,
  };

  const avatarSize = sizeMap[size];
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const content = (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
        />
      ) : (
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
        >
          <Text style={[styles.initials, { fontSize: avatarSize / 2.5, color: '#FFFFFF' }]}>
            {initials}
          </Text>
        </LinearGradient>
      )}
      {online !== undefined && (
        <View
          style={[
            styles.onlineIndicator,
            {
              backgroundColor: online ? theme.colors.online : theme.colors.offline,
              width: avatarSize / 5,
              height: avatarSize / 5,
              borderRadius: avatarSize / 10,
              borderWidth: 2,
              borderColor: theme.colors.background,
            },
          ]}
        />
      )}
    </View>
  );

  if (onPress && uri) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
});