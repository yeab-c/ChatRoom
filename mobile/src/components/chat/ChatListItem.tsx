import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { ChatListItem as ChatListItemType } from '../../types';

interface ChatListItemProps {
  chat: ChatListItemType;
  onPress?: () => void;
  onDelete?: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ chat, onPress }) => {
  const { theme } = useTheme();
  const router = useRouter();

  // Check if this is a group chat
  const isGroup = (chat as any).isGroup || !chat.otherUser;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      if (isGroup) {
        // Navigate to group chat
        router.push({
          pathname: '/group/[id]',
          params: {
            id: (chat as any).id, // Use PostgreSQL group ID
          },
        });
      } else {
        // Navigate to one-on-one chat
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: chat.chatId,
            otherUser: JSON.stringify(chat.otherUser),
          },
        });
      }
    }
  };

  // Format time
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
  };

  // Get display name and avatar
  const displayName = isGroup 
    ? (chat as any).groupName 
    : chat.otherUser?.name || 'Unknown User';
  
  const displayAvatar = isGroup 
    ? (chat as any).groupAvatar 
    : chat.otherUser?.avatar;

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
      {isGroup ? (
        <View style={[styles.groupAvatar, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="people" size={24} color="#FFFFFF" />
        </View>
      ) : (
        <Avatar
          uri={displayAvatar}
          name={displayName}
          size="medium"
          online={chat.otherUser?.isOnline}
        />
      )}

      <View style={[styles.content, { marginLeft: theme.spacing.md, flex: 1 }]}>
        <View style={styles.header}>
          <Text
            style={[
              styles.name,
              { 
                color: theme.colors.text,
                fontWeight: (chat.unreadCount && chat.unreadCount > 0) ? '700' : '600',
              },
              theme.typography.body,
            ]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text style={[styles.time, { color: theme.colors.textMuted }, theme.typography.caption]}>
            {formatTime((chat.lastMessage?.createdAt || chat.updatedAt) as string)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text
            style={[
              styles.message,
              { 
                color: (chat.unreadCount && chat.unreadCount > 0) ? theme.colors.text : theme.colors.textSecondary,
                fontWeight: (chat.unreadCount && chat.unreadCount > 0) ? '600' : '400',
                flex: 1,
              },
              theme.typography.bodySmall,
            ]}
            numberOfLines={1}
          >
            {chat.lastMessage?.content || (isGroup ? `${(chat as any).memberCount} members` : 'No messages yet')}
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
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
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
