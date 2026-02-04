import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

interface SaveChatBannerProps {
  onSave: () => void;
  isSaving?: boolean;
  savedByMe?: boolean;
  waitingForOther?: boolean;
}

export const SaveChatBanner: React.FC<SaveChatBannerProps> = ({
  onSave,
  isSaving,
  savedByMe,
  waitingForOther,
}) => {
  const { theme } = useTheme();

  if (savedByMe && waitingForOther) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.success + '20',
            borderTopColor: theme.colors.success,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          },
        ]}
      >
        <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
        <Text
          style={[
            styles.text,
            { color: theme.colors.text, marginLeft: theme.spacing.sm, flex: 1 },
          ]}
        >
          You saved this chat. Waiting for the other person to save too.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
      ]}
    >
      <Ionicons name="bookmark-outline" size={20} color={theme.colors.primary} />
      <Text
        style={[
          styles.text,
          { color: theme.colors.text, marginLeft: theme.spacing.sm, flex: 1 },
        ]}
      >
        Temporary chat
      </Text>
      <Button
        title="Save Chat"
        onPress={onSave}
        loading={isSaving}
        size="small"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  text: {
    fontSize: 14,
  },
});