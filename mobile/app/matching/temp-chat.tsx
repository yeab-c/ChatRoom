import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Avatar } from '../../src/components/common/Avatar';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { MessageInput } from '../../src/components/chat/MessageInput';
import { SaveChatBanner } from '../../src/components/chat/SaveChatBanner';
import { Message } from '../../src/types';

export default function TempChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [savedByMe, setSavedByMe] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  // Mock other user
  const otherUser = {
    id: '2',
    name: 'Sarah',
    avatar: '',
    isOnline: true,
  };

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          handleExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Show save reminder at 2 minutes left
    const reminderTimeout = setTimeout(() => {
      if (!savedByMe) {
        Alert.alert(
          'Chat Expiring Soon',
          'This chat will expire in 2 minutes. Would you like to save it?',
          [
            { text: 'Save Chat', onPress: handleSaveChat },
            { text: 'Not Now', style: 'cancel' },
          ]
        );
      }
    }, 13 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(reminderTimeout);
    };
  }, [savedByMe]);

  const handleExpire = () => {
    Alert.alert(
      'Chat Expired',
      'This temporary chat has expired and will be deleted.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  const handleSaveChat = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setSavedByMe(true);
      setIsSaving(false);
      Alert.alert('Chat Saved!', 'Waiting for the other person to save too.');
    }, 1000);
  };

  const handleBack = () => {
    if (!savedByMe) {
      Alert.alert(
        'Leave Chat?',
        `If you leave now, you'll lose this connection with ${otherUser.name}. Are you sure?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } else {
      router.replace('/(tabs)/chats');
    }
  };

  const handleSendText = (text: string) => {
    const newMessage: Message = {
      _id: Date.now().toString(),
      chatId: 'temp-chat-1',
      senderId: user!.id,
      type: 'text',
      content: text,
      readBy: [user!.id],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMessages([...messages, newMessage]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendImage = (imageUrl: string) => {
    const newMessage: Message = {
      _id: Date.now().toString(),
      chatId: 'temp-chat-1',
      senderId: user!.id,
      type: 'image',
      content: imageUrl,
      readBy: [user!.id],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMessages([...messages, newMessage]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            paddingTop: 50,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Avatar uri={otherUser.avatar} name={otherUser.name} size="small" online={otherUser.isOnline} />
          <View style={{ marginLeft: theme.spacing.md }}>
            <Text style={[styles.headerName, { color: theme.colors.text }]}>
              {otherUser.name}
            </Text>
            <Text style={[styles.headerStatus, { color: theme.colors.warning }]}>
              Temporary • {formatTime(timeLeft)}
            </Text>
          </View>
        </View>

        <View style={{ width: 24 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwnMessage={item.senderId === user?.id}
          />
        )}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              Start chatting! This is a temporary chat.
            </Text>
          </View>
        }
      />

      {/* Save Banner */}
      <SaveChatBanner
        onSave={handleSaveChat}
        isSaving={isSaving}
        savedByMe={savedByMe}
        waitingForOther={savedByMe}
      />

      {/* Input */}
      <MessageInput
        onSendText={handleSendText}
        onSendImage={handleSendImage}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});