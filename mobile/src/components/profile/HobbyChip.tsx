import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface HobbyChipProps {
  hobby: string;
}

export const HobbyChip: React.FC<HobbyChipProps> = ({ hobby }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.primary + '20',
          borderRadius: theme.borderRadius.full,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          marginRight: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.primary }]}>{hobby}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});