import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Avatar } from '../../src/components/common/Avatar';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { MessageInput } from '../../src/components/chat/MessageInput';
import { TypingIndicator } from '../../src/components/chat/TypingIndicator';
import { Message } from '../../src/types';

// Mock messages
const MOCK_MESSAGES: Message[] = [
  {
    _id: '1',
    chatId: 'chat1',
    senderId: '2',
    type: 'text',
    content: "Hey! How's it going?",
    readBy: ['1', '2'],
    createdAt: new Date(Date.now() - 360000),
    updatedAt: new Date(Date.now() - 360000),
  },
  {
    _id: '2',
    chatId: 'chat1',
    senderId: '1',
    type: 'text',
    content: 'Pretty good! Just finished work',
    readBy: ['1'],
    createdAt: new Date(Date.now() - 300000),
    updatedAt: new Date(Date.now() - 300000),
  },
];

export default function ChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Mock other user data
  const otherUser = {
    id: '2',
    name: 'Alex Chen',
    avatar: '',
    isOnline: true,
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const handleSendText = (text: string) => {
    const newMessage: Message = {
      _id: Date.now().toString(),
      chatId: id as string,
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
      chatId: id as string,
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

  const handleBack = () => {
    router.push('/(tabs)/chats');
  };

  const handleViewProfile = () => {
    router.push({
      pathname: '/chat/info',
      params: { chatId: id },
    });
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${otherUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Blocked', `${otherUser.name} has been blocked.`);
            router.push('/(tabs)/chats');
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.prompt(
      'Report User',
      `Why are you reporting ${otherUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: (reason: string | null | undefined) => {
            if (reason?.trim()) {
              Alert.alert('Reported', 'Thank you for reporting. We will review this user.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const showOptionsMenu = () => {
    Alert.alert(
      otherUser.name,
      'Choose an action',
      [
        { text: 'View Profile', onPress: handleViewProfile },
        { text: 'Block User', onPress: handleBlock, style: 'destructive' },
        { text: 'Report User', onPress: handleReport, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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

        <TouchableOpacity style={styles.headerCenter} onPress={handleViewProfile}>
          <Avatar uri={otherUser.avatar} name={otherUser.name} size="small" online={otherUser.isOnline} />
          <View style={{ marginLeft: theme.spacing.md }}>
            <Text style={[styles.headerName, { color: theme.colors.text }]}>
              {otherUser.name}
            </Text>
            <Text style={[styles.headerStatus, { color: theme.colors.textMuted }]}>
              {otherUser.isOnline ? 'Active now' : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={showOptionsMenu} style={styles.optionsButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.text} />
        </TouchableOpacity>
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
        ListFooterComponent={isTyping ? <TypingIndicator userName={otherUser.name} /> : null}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
  },
  optionsButton: {
    padding: 4,
  },
});