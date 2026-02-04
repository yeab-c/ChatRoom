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
import { Message } from '../../src/types';

export default function GroupChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  // Mock group data
  const group = {
    id: id as string,
    name: 'Weekend Hangout',
    avatar: '',
    memberCount: 5,
    creatorId: '1', // user's id
  };

  const isCreator = group.creatorId === user?.id;

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
      sender: user!,
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
      sender: user!,
    };

    setMessages([...messages, newMessage]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleBack = () => {
    router.push('/(tabs)/chats');
  };

  const handleGroupInfo = () => {
    router.push({
      pathname: '/group/info',
      params: { groupId: id },
    });
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave ${group.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Left Group', `You have left ${group.name}.`);
            router.replace('/(tabs)/chats');
          },
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete ${group.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', `${group.name} has been deleted.`);
            router.replace('/(tabs)/chats');
          },
        },
      ]
    );
  };

  const showOptionsMenu = () => {
    const options = isCreator
      ? [
          { text: 'Delete Group', onPress: handleDeleteGroup, style: 'destructive' as const },
          { text: 'Cancel', style: 'cancel' as const },
        ]
      : [
          { text: 'Leave Group', onPress: handleLeaveGroup, style: 'destructive' as const },
          { text: 'Cancel', style: 'cancel' as const },
        ];

    Alert.alert(group.name, 'Choose an action', options);
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

        <TouchableOpacity style={styles.headerCenter} onPress={handleGroupInfo}>
          <Avatar uri={group.avatar} name={group.name} size="small" />
          <View style={{ marginLeft: theme.spacing.md }}>
            <Text style={[styles.headerName, { color: theme.colors.text }]}>{group.name}</Text>
            <Text style={[styles.headerStatus, { color: theme.colors.textMuted }]}>
              {group.memberCount} members
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
          <View>
            {item.senderId !== user?.id && (
              <Text style={[styles.senderName, { color: theme.colors.primary, marginLeft: theme.spacing.lg, marginTop: theme.spacing.sm }]}>
                {item.sender?.name}
              </Text>
            )}
            <MessageBubble message={item} isOwnMessage={item.senderId === user?.id} />
          </View>
        )}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted, marginTop: theme.spacing.md }]}>
              Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Input */}
      <MessageInput onSendText={handleSendText} onSendImage={handleSendImage} />
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
  senderName: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
  },
});