import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onImagePress?: (uri: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  onImagePress,
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
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '75%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  bubble: {
    maxWidth: '100%',
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