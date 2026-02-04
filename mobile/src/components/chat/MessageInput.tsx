import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useImagePicker } from '../../hooks/useImagePicker';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendImage: (imageUrl: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendText,
  onSendImage,
  onTyping,
  onStopTyping,
  placeholder = 'Type a message...',
}) => {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const { showImagePickerOptions, isUploading } = useImagePicker();
  let typingTimeout: NodeJS.Timeout;

  const handleTextChange = (value: string) => {
    setText(value);
    
    // Typing indicator logic
    if (onTyping && value.length > 0) {
      onTyping();
      
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        onStopTyping?.();
      }, 1000);
    } else if (value.length === 0) {
      onStopTyping?.();
    }
  };

  const handleSend = () => {
    if (text.trim()) {
      onSendText(text.trim());
      setText('');
      onStopTyping?.();
    }
  };

  const handleImagePick = () => {
    showImagePickerOptions(
      (imageUrl) => {
        onSendImage(imageUrl);
      },
      { folder: 'messages', maxWidth: 1024, maxHeight: 1024, quality: 0.7 }
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleImagePick}
          disabled={isUploading}
          style={[styles.iconButton, { marginRight: theme.spacing.sm }]}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons name="image-outline" size={24} color={theme.colors.textMuted} />
          )}
        </TouchableOpacity>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.full,
              paddingHorizontal: theme.spacing.lg,
              flex: 1,
            },
          ]}
        >
          <TextInput
            value={text}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, { color: theme.colors.text }]}
            multiline
            maxLength={1000}
          />
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim()}
          style={[
            styles.sendButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.full,
              marginLeft: theme.spacing.sm,
            },
          ]}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
  },
  iconButton: {
    padding: 8,
  },
  inputContainer: {
    minHeight: 44,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});