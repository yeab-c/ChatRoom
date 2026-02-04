import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { ChatListItem as ChatListItemType } from '../../types';

interface ChatListItemProps {
  chat: ChatListItemType;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ chat }) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (chat.type === 'group') {
      router.push(`/group/${chat.chatId}`);
    } else {
      router.push(`/chat/${chat.chatId}`);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
      ]}
      activeOpacity={0.7}
    >
      <Avatar
        uri={chat.displayAvatar}
        name={chat.displayName}
        size="medium"
        online={chat.otherUser?.isOnline}
      />

      <View style={[styles.content, { marginLeft: theme.spacing.md, flex: 1 }]}>
        <View style={styles.header}>
          <Text
            style={[
              styles.name,
              { color: theme.colors.text },
              theme.typography.body,
              { fontWeight: '600' },
            ]}
            numberOfLines={1}
          >
            {chat.displayName}
          </Text>
          <Text style={[styles.time, { color: theme.colors.textMuted }, theme.typography.caption]}>
            {chat.lastMessageTime}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text
            style={[
              styles.message,
              { color: theme.colors.textSecondary, flex: 1 },
              theme.typography.bodySmall,
            ]}
            numberOfLines={1}
          >
            {chat.isTyping ? 'Typing...' : chat.lastMessageText}
          </Text>
          {chat.unreadCount && chat.unreadCount > 0 ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.colors.badge,
                  borderRadius: theme.borderRadius.full,
                  minWidth: 20,
                  height: 20,
                  paddingHorizontal: 6,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: theme.colors.badgeText }]}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    flex: 1,
  },
  time: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    marginRight: 8,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
