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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useSocket } from '../../src/context/SocketContext';
import { useChat } from '../../src/hooks/useChat';
import { useChatListContext } from '../../src/context/ChatListContext';
import { Avatar } from '../../src/components/common/Avatar';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { MessageInput } from '../../src/components/chat/MessageInput';
import { TypingIndicator } from '../../src/components/chat/TypingIndicator';
import { ImageViewer } from '../../src/components/common/ImageViewer';
import { userService } from '../../src/services/api';

export default function ChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id, otherUser: otherUserParam } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  const { resetUnread } = useChatListContext();

  // Parse other user from params
  const initialOtherUser = otherUserParam ? JSON.parse(otherUserParam as string) : null;
  
  // State for other user (will be updated with real-time data)
  const [otherUser, setOtherUser] = useState(initialOtherUser);

  // Use chat hook
  const {
    messages,
    loading,
    sending,
    isTyping,
    hasMore,
    sendMessage,
    markMessagesAsRead,
    loadMore,
  } = useChat(id as string);

  const { socket, joinChat, leaveChat, onUserOnline, onUserOffline } = useSocket();

  // Local typing state for this user
  const [userTyping, setUserTyping] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Mark messages as read when chat opens or new messages arrive
  // Use a ref to track which messages have been marked to avoid infinite loops
  const markedMessagesRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (messages.length > 0 && user) {
      const unreadMessageIds = messages
        .filter((m) => 
          m.sender.id !== user.id && 
          !m.readBy.includes(user.id) &&
          !markedMessagesRef.current.has(m.id) // Not already marked
        )
        .map((m) => m.id);

      if (unreadMessageIds.length > 0) {
        console.log(`Marking ${unreadMessageIds.length} messages as read in chat ${id}`);
        
        // Add to marked set immediately to prevent re-marking
        unreadMessageIds.forEach(id => markedMessagesRef.current.add(id));
        
        markMessagesAsRead(unreadMessageIds);
      }
    }
  }, [messages.length, user?.id]);

  // Reset unread count in chat list when entering chat
  useEffect(() => {
    if (id) {
      resetUnread(id as string);
    }
    
    // Clear marked messages when leaving chat
    return () => {
      markedMessagesRef.current.clear();
    };
  }, [id]);

  // Fetch fresh user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (otherUser?.id) {
        try {
          const freshUserData = await userService.getUserById(otherUser.id);
          setOtherUser(freshUserData);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // Keep using the initial data if fetch fails
        }
      }
    };

    fetchUserData();
  }, [otherUser?.id]);

  // Listen for online/offline status changes
  useEffect(() => {
    if (!otherUser?.id) return;

    const handleUserOnline = (userId: string) => {
      if (userId === otherUser.id) {
        setOtherUser((prev: any) => prev ? { ...prev, isOnline: true } : prev);
      }
    };

    const handleUserOffline = (userId: string) => {
      if (userId === otherUser.id) {
        setOtherUser((prev: any) => prev ? { ...prev, isOnline: false } : prev);
      }
    };

    onUserOnline(handleUserOnline);
    onUserOffline(handleUserOffline);

    return () => {
      // Cleanup handled by socket context
    };
  }, [otherUser?.id]);

  useEffect(() => {
    if (id) {
      // Join chat room
      joinChat(id as string);
    }

    return () => {
      if (id) {
        // Leave chat room
        leaveChat(id as string);

        // Stop typing when leaving
        if (socket && userTyping) {
          socket.emit('stop-typing', { chatId: id });
        }
      }
    };
  }, [id]);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (messages.length > 0 && user) {
      const unreadMessageIds = messages
        .filter((m) => m.sender.id !== user.id && !m.readBy.includes(user.id))
        .map((m) => m.id);

      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(unreadMessageIds);
      }
    }
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendText = async (text: string) => {
    await sendMessage(text, 'text');

    // Stop typing after sending
    handleStopTyping();
  };

  const handleSendImage = async (imageUrl: string) => {
    await sendMessage(imageUrl, 'image', imageUrl);
  };

  const handleTyping = () => {
    if (socket && !userTyping) {
      socket.emit('typing', { chatId: id });
      setUserTyping(true);
    }
  };

  const handleStopTyping = () => {
    if (socket && userTyping) {
      socket.emit('stop-typing', { chatId: id });
      setUserTyping(false);
    }
  };

  const handleBack = () => {
    router.replace('/(tabs)/chats');
  };

  const handleViewProfile = () => {
    router.push({
      pathname: '/chat/info',
      params: {
        chatId: id,
        otherUser: otherUserParam,
      },
    });
  };

  const handleBlock = async () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${otherUser?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.blockUser(otherUser.id);
              Alert.alert('Blocked', `${otherUser.name} has been blocked.`);
              router.back();
            } catch (error) {
              console.error('Failed to block user:', error);
              Alert.alert('Error', 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.prompt(
      'Report User',
      `Why are you reporting ${otherUser?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (reason?.trim()) {
              try {
                await userService.reportUser(otherUser.id, reason);
                Alert.alert('Reported', 'Thank you for reporting. We will review this user.');
              } catch (error) {
                console.error('Failed to report user:', error);
                Alert.alert('Error', 'Failed to report user');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleShowOptionsMenu = () => {
    setShowOptionsMenu(true);
  };

  if (!otherUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.text }}>Invalid chat</Text>
      </View>
    );
  }

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
          <Avatar 
            uri={otherUser.avatar} 
            name={otherUser.name} 
            size="small" 
            online={otherUser.isOnline}
            onPress={() => otherUser.avatar && setSelectedImage(otherUser.avatar)}
          />
          <View style={{ marginLeft: theme.spacing.md }}>
            <Text style={[styles.headerName, { color: theme.colors.text }]}>
              {otherUser.name}
            </Text>
            <Text style={[styles.headerStatus, { color: theme.colors.textMuted }]}>
              {isTyping ? 'typing...' : otherUser.isOnline ? 'Active now' : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShowOptionsMenu} style={styles.optionsButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading && messages.length === 0 ? (
        <View style={[styles.centerContainer, { flex: 1 }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
            Loading messages...
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwnMessage={item.sender.id === user?.id}
              onImagePress={(uri) => setSelectedImage(uri)}
            />
          )}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl,
          }}
          ListFooterComponent={isTyping ? <TypingIndicator userName={otherUser.name} /> : null}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <MessageInput
        onSendText={handleSendText}
        onSendImage={handleSendImage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        disabled={sending}
      />

      {/* Image Viewer */}
      {selectedImage && (
        <ImageViewer
          visible={!!selectedImage}
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                handleViewProfile();
              }}
            >
              <Ionicons name="person-outline" size={24} color={theme.colors.text} />
              <Text style={[styles.menuText, { color: theme.colors.text }]}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                handleBlock();
              }}
            >
              <Ionicons name="ban-outline" size={24} color={theme.colors.error} />
              <Text style={[styles.menuText, { color: theme.colors.error }]}>Block User</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                handleReport();
              }}
            >
              <Ionicons name="flag-outline" size={24} color={theme.colors.error} />
              <Text style={[styles.menuText, { color: theme.colors.error }]}>Report User</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.cancelItem]}
              onPress={() => setShowOptionsMenu(false)}
            >
              <Text style={[styles.menuText, { color: theme.colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  cancelItem: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    justifyContent: 'center',
  },
});