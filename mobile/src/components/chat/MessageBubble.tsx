import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onImagePress?: (uri: string) => void;
  showSenderInfo?: boolean; // For group chats
  onSenderPress?: (senderId: string, senderName: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  onImagePress,
  showSenderInfo = false,
  onSenderPress,
}) => {
  const { theme } = useTheme();

  const bubbleStyle = isOwnMessage
    ? { backgroundColor: theme.colors.messageSent }
    : { backgroundColor: theme.colors.messageReceived };

  const textColor = isOwnMessage ? '#FFFFFF' : theme.colors.text;

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      {/* Show avatar for other users in group chats */}
      {showSenderInfo && !isOwnMessage && (
        <TouchableOpacity
          onPress={() => onSenderPress?.(message.sender.id, message.sender.name)}
          style={styles.avatarContainer}
        >
          <Avatar
            uri={message.sender.avatar}
            name={message.sender.name}
            size="small"
          />
        </TouchableOpacity>
      )}

      <View style={styles.messageContent}>
        {/* Show sender name for other users in group chats */}
        {showSenderInfo && !isOwnMessage && (
          <Text style={[styles.senderName, { color: theme.colors.primary }]}>
            {message.sender.name}
          </Text>
        )}

        <View
          style={[
            styles.bubble,
            bubbleStyle,
            { borderRadius: theme.borderRadius.lg, padding: theme.spacing.md },
          ]}
        >
          {message.type === 'text' ? (
            <Text style={[styles.text, { color: textColor }]}>{message.content}</Text>
          ) : (
            <TouchableOpacity
              onPress={() => onImagePress?.(message.content)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: message.content }}
                style={[styles.image, { borderRadius: theme.borderRadius.md }]}
              />
            </TouchableOpacity>
          )}
          <Text style={[styles.time, { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : theme.colors.textMuted }]}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 6,
    marginBottom: 2,
  },
  messageContent: {
    flexShrink: 1,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
    marginBottom: 2,
  },
  bubble: {
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'cover',
  },
  time: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});