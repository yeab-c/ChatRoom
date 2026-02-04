import React, { useState, useRef, useEffect } from 'react';
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
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendText,
  onSendImage,
  onTyping,
  onStopTyping,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const { uploadMessageImage, isUploading } = useImagePicker();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = (value: string) => {
    setText(value);
    
    // Typing indicator logic
    if (onTyping && value.length > 0) {
      onTyping();
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping?.();
      }, 1000);
    } else if (value.length === 0) {
      onStopTyping?.();
    }
  };

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSendText(text.trim());
      setText('');
      onStopTyping?.();
    }
  };

  const handleImagePick = async () => {
    try {
      // Upload image for message - sends immediately after upload
      const imageUrl = await uploadMessageImage(false);
      
      if (imageUrl) {
        onSendImage(imageUrl);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
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
          disabled={isUploading || disabled}
          style={[styles.iconButton, { marginRight: theme.spacing.sm }]}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons 
              name="image-outline" 
              size={24} 
              color={disabled ? theme.colors.textMuted + '60' : theme.colors.textMuted} 
            />
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
            editable={!disabled}
          />
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          style={[
            styles.sendButton,
            {
              backgroundColor: !text.trim() || disabled ? theme.colors.textMuted : theme.colors.primary,
              borderRadius: theme.borderRadius.full,
              marginLeft: theme.spacing.sm,
              opacity: !text.trim() || disabled ? 0.5 : 1,
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