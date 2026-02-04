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
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useSocket } from '../../src/context/SocketContext';
import { useChat } from '../../src/hooks/useChat';
import { Avatar } from '../../src/components/common/Avatar';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { MessageInput } from '../../src/components/chat/MessageInput';
import { SaveChatBanner } from '../../src/components/chat/SaveChatBanner';
import { chatService } from '../../src/services/api';

export default function TempChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id, otherUser: otherUserParam } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  const otherUser = otherUserParam ? JSON.parse(otherUserParam as string) : null;

  const {
    messages,
    loading,
    sending,
    sendMessage,
  } = useChat(id as string);

  const { joinChat, leaveChat, onChatSaved, onChatTerminated } = useSocket();

  const [savedByMe, setSavedByMe] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [chatEnded, setChatEnded] = useState(false);
  const [chatDetails, setChatDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [twoMinuteAlertShown, setTwoMinuteAlertShown] = useState(false);
  const [expiryAlertShown, setExpiryAlertShown] = useState(false);

  // Fetch chat details on mount to get expiresAt
  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!id) return;

      try {
        setLoadingDetails(true);
        const details = await chatService.getChatDetails(id as string);
        setChatDetails(details);

        // Calculate time left using server time for accurate sync
        if (details.expiresAt && details.serverTime) {
          const expiryTime = new Date(details.expiresAt).getTime();
          const serverTime = new Date(details.serverTime).getTime();
          const secondsLeft = Math.floor((expiryTime - serverTime) / 1000);
          
          // Ensure we never show more than 15 minutes (900 seconds)
          const cappedSecondsLeft = Math.min(Math.max(0, secondsLeft), 900);
          
          console.log('Timer sync:', {
            expiresAt: details.expiresAt,
            serverTime: details.serverTime,
            expiryTime,
            serverTimeMs: serverTime,
            secondsLeft,
            cappedSecondsLeft,
            minutesLeft: Math.floor(cappedSecondsLeft / 60),
          });
          
          setTimeLeft(cappedSecondsLeft);

          // If already expired, end chat immediately
          if (cappedSecondsLeft <= 0) {
            handleExpire();
          }
        }

        // Check if user already saved
        if (user?.id && details.savedBy.includes(user.id)) {
          setSavedByMe(true);
        }

        // Check if chat is already saved by both
        if (details.isSaved) {
          setChatEnded(true);
        }
      } catch (error) {
        console.error('Failed to fetch chat details:', error);
        Alert.alert('Error', 'Failed to load chat details');
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchChatDetails();
  }, [id, user?.id]);

  // Join chat on mount
  useEffect(() => {
    if (id) {
      joinChat(id as string);
    }
    return () => {
      if (id) {
        leaveChat(id as string);
      }
    };
  }, [id]);

  // Listen for chat save events
  useEffect(() => {
    if (!id) return;

    const handleChatSaved = (data: { chatId: string; savedBy: string[]; isSaved: boolean }) => {
      if (data.chatId !== id) return;

      console.log('Chat saved event received:', data);

      if (data.isSaved) {
        // Both users saved - chat is now permanent, redirect to permanent chat
        setChatEnded(true);
        Alert.alert(
          'Chat Saved!',
          'Both of you have saved this chat. Redirecting to your permanent chat...',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace({
                  pathname: '/chat/[id]',
                  params: { id: id as string, otherUser: JSON.stringify(otherUser) },
                });
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        // Other user saved
        const otherUserSaved = data.savedBy.find(userId => userId !== user?.id);
        if (otherUserSaved && !savedByMe) {
          Alert.alert(
            `${otherUser?.name} Saved the Chat`,
            'The other person has saved this chat. Would you like to save it too to make it permanent?',
            [
              { text: 'Save Chat', onPress: handleSaveChat },
              { text: 'Not Now', style: 'cancel' },
            ]
          );
        }
      }
    };

    const handleChatTerminated = (data: { chatId: string; reason: string; message?: string }) => {
      if (data.chatId !== id) return;

      console.log('Chat terminated event received:', data);
      setChatEnded(true);
      
      // Determine the message based on the reason
      let alertTitle = 'Chat Ended';
      let alertMessage = data.message || `${otherUser?.name} left the chat without saving. This temporary chat has been terminated.`;

      if (data.reason === 'other-left-without-saving') {
        // Person A (who saved) - other person left without saving
        alertTitle = 'Chat Ended';
        alertMessage = `${otherUser?.name} left the chat without saving. The chat has been terminated.`;
      } else if (data.reason === 'you-left-other-saved') {
        // Person B (who didn't save) - they left even though other person saved
        alertTitle = 'Chat Ended';
        alertMessage = `You left the chat even though ${otherUser?.name} had saved it. The chat has been terminated.`;
      } else if (data.reason === 'user-left-without-saving') {
        // Standard termination - neither saved
        alertTitle = 'Chat Ended';
        alertMessage = `${otherUser?.name} left the chat without saving. This temporary chat has been terminated.`;
      }
      
      Alert.alert(
        alertTitle,
        alertMessage,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ],
        { cancelable: false }
      );
    };

    onChatSaved(handleChatSaved);
    onChatTerminated(handleChatTerminated);

    return () => {
      // Cleanup listeners if needed
    };
  }, [id, user?.id, savedByMe, otherUser?.name]);

  // Timer countdown
  useEffect(() => {
    if (chatEnded || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!expiryAlertShown) {
            setExpiryAlertShown(true);
            handleExpire();
          }
          return 0;
        }
        
        // Show 2-minute warning
        if (prev === 120 && !twoMinuteAlertShown && !savedByMe && !chatEnded) {
          setTwoMinuteAlertShown(true);
          Alert.alert(
            'Chat Expiring Soon',
            'This chat will expire in 2 minutes. Would you like to save it?',
            [
              { text: 'Save Chat', onPress: handleSaveChat },
              { text: 'Not Now', style: 'cancel' },
            ]
          );
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [savedByMe, chatEnded, timeLeft, twoMinuteAlertShown, expiryAlertShown]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleExpire = () => {
    if (chatEnded) return;

    setChatEnded(true);

    // If user already saved, just inform them
    if (savedByMe) {
      Alert.alert(
        'Chat Expired',
        `This temporary chat has expired. ${otherUser?.name} didn't save the chat in time, so it won't become permanent.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)');
            },
          },
        ],
        { cancelable: false }
      );
      return;
    }

    // User hasn't saved yet - offer to save
    Alert.alert(
      'Chat Expired',
      'This temporary chat has expired. Would you like to save this chat?',
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => {
            router.replace('/(tabs)');
          },
        },
        {
          text: 'Yes, Save',
          onPress: async () => {
            await handleSaveChat();
            router.replace('/(tabs)');
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleSaveChat = async () => {
    if (isSaving || chatEnded) return;

    try {
      setIsSaving(true);

      const result = await chatService.saveChat(id as string);

      setSavedByMe(true);

      if (result.data?.isSaved) {
        // Both users saved! Chat is now permanent - redirect to permanent chat
        setChatEnded(true);
        Alert.alert(
          'Chat Saved!',
          'Both of you have saved this chat. You can now find it in your Chats tab and continue messaging anytime!',
          [
            {
              text: 'Go to Chat',
              onPress: () => {
                // Navigate to the permanent chat screen
                router.replace({
                  pathname: '/chat/[id]',
                  params: { id: id as string, otherUser: JSON.stringify(otherUser) },
                });
              },
            },
          ]
        );
      } else {
        // Only you saved, waiting for other user
        Alert.alert(
          'Saved!',
          `You've saved this chat. Waiting for ${otherUser?.name} to save too. You can continue chatting while waiting.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Failed to save chat:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save chat');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = async () => {
    if (chatEnded) {
      router.replace('/(tabs)');
      return;
    }

    // If user already saved, just leave without terminating
    if (savedByMe) {
      Alert.alert(
        'Leave Chat?',
        `You've already saved this chat. You can continue chatting with ${otherUser?.name} later if they also save it.`,
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
      return;
    }

    // Check if other user has saved
    const otherUserSaved = chatDetails?.savedBy.find((userId: string) => userId !== user?.id);

    // User hasn't saved - warn about termination
    const warningMessage = otherUserSaved
      ? `${otherUser?.name} has already saved this chat, but if you leave without saving, the chat will be terminated and they will lose it too. Are you sure?`
      : `If you leave now without saving, this chat will be deleted and you'll lose this connection with ${otherUser?.name}. Are you sure?`;

    Alert.alert(
      'Leave Chat?',
      warningMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Without Saving',
          style: 'destructive',
          onPress: async () => {
            try {
              // Terminate the chat on backend
              await chatService.terminateChat(id as string);
              setChatEnded(true);
              
              // Show message if other user had saved
              if (otherUserSaved) {
                Alert.alert(
                  'Chat Ended',
                  `You left the chat even though ${otherUser?.name} had saved it. The chat has been terminated.`,
                  [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
                );
              } else {
                router.replace('/(tabs)');
              }
            } catch (error) {
              console.error('Failed to terminate chat:', error);
              // Still navigate away even if termination fails
              router.replace('/(tabs)');
            }
          },
        },
        {
          text: 'Save & Leave',
          onPress: async () => {
            await handleSaveChat();
            // Don't navigate away immediately - let the save handler do it
          },
        },
      ]
    );
  };

  const handleSendText = async (text: string) => {
    if (chatEnded) {
      Alert.alert('Chat Ended', 'This chat has ended. You cannot send messages.');
      return;
    }
    await sendMessage(text, 'text');
  };

  const handleSendImage = async (imageUrl: string) => {
    if (chatEnded) {
      Alert.alert('Chat Ended', 'This chat has ended. You cannot send messages.');
      return;
    }
    await sendMessage(imageUrl, 'image', imageUrl);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!otherUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.text }}>Invalid chat</Text>
      </View>
    );
  }

  if (loadingDetails) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.text, marginTop: 16 }}>Loading chat...</Text>
      </View>
    );
  }

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
            <Text style={[styles.headerStatus, {
              color: chatEnded
                ? theme.colors.error
                : timeLeft < 120
                  ? theme.colors.error
                  : theme.colors.warning
            }]}>
              {chatEnded ? 'Chat Ended' : `Temporary • ${formatTime(timeLeft)}`}
            </Text>
          </View>
        </View>

        <View style={{ width: 24 }} />
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
            />
          )}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl,
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                Start chatting! This is a temporary chat that will last 15 minutes.
              </Text>
            </View>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Save Banner - Only show if not ended and not saved */}
      {!chatEnded && !savedByMe && (
        <SaveChatBanner
          onSave={handleSaveChat}
          isSaving={isSaving}
          savedByMe={savedByMe}
          waitingForOther={false}
        />
      )}

      {/* Saved Message */}
      {savedByMe && !chatEnded && (
        <View style={[styles.savedBanner, {
          backgroundColor: theme.colors.success + '20',
          padding: theme.spacing.md,
          borderTopWidth: 1,
          borderTopColor: theme.colors.success,
        }]}>
          <Text style={[styles.savedText, { color: theme.colors.success }]}>
            ✓ You've saved this chat. Waiting for {otherUser.name} to save too...
          </Text>
        </View>
      )}

      {/* Input - Disabled if chat ended */}
      <MessageInput
        onSendText={handleSendText}
        onSendImage={handleSendImage}
        disabled={sending || chatEnded}
        placeholder={chatEnded ? 'Chat has ended' : savedByMe ? 'Type a message...' : 'Type a message...'}
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
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
    paddingHorizontal: 20,
  },
  savedBanner: {
    alignItems: 'center',
  },
  savedText: {
    fontSize: 14,
    fontWeight: '600',
  },
});