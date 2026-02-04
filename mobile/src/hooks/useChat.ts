import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocket } from '../context/SocketContext';
import { chatService } from '../services/api';
import type { Message } from '../services/api';

interface UseChatOptions {
  autoLoad?: boolean;
  pageSize?: number;
}

const MAX_CACHED_MESSAGES = 30;

export const useChat = (chatId: string, options: UseChatOptions = {}) => {
  const { autoLoad = true, pageSize = 50 } = options;

  const {
    isConnected,
    joinChat,
    leaveChat,
    sendMessage: socketSendMessage,
    onNewMessage,
    offNewMessage,
    onTyping,
    onStopTyping,
    sendTyping: socketSendTyping,
    sendStopTyping: socketSendStopTyping,
    markAsRead: socketMarkAsRead,
  } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
   // Get cache key for this chat
   
  const getCacheKey = () => `@chat_messages_${chatId}`;

  
   // Load cached messages from AsyncStorage
   
  const loadCachedMessages = async () => {
    try {
      const cached = await AsyncStorage.getItem(getCacheKey());
      if (cached) {
        const cachedMessages = JSON.parse(cached);
        setMessages(cachedMessages);
        console.log(`Loaded ${cachedMessages.length} cached messages for chat ${chatId}`);
        return cachedMessages;
      }
    } catch (error) {
      console.error('Failed to load cached messages:', error);
    }
    return null;
  };

  
   // Save messages to AsyncStorage (keep last 30)
   
  const cacheMessages = async (messagesToCache: Message[]) => {
    try {
      // Keep only the last 30 messages
      const messagesToStore = messagesToCache.slice(-MAX_CACHED_MESSAGES);
      await AsyncStorage.setItem(getCacheKey(), JSON.stringify(messagesToStore));
      console.log(`Cached ${messagesToStore.length} messages for chat ${chatId}`);
    } catch (error) {
      console.error('Failed to cache messages:', error);
    }
  };

  // Load cached messages first, then fetch from server
  useEffect(() => {
    if (autoLoad && chatId) {
      // Load cached messages immediately for instant display
      loadCachedMessages();
      
      // Then fetch fresh messages from server
      loadMessages(1);
    }
  }, [chatId, autoLoad]);

  // Join chat room and setup socket listeners
  useEffect(() => {
    if (!chatId || !isConnected) return;

    // Join chat
    joinChat(chatId);
    console.log('Joined chat:', chatId);

    // Handle new messages
    const handleNewMessage = (message: Message) => {
      if (message.chatId === chatId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          const updated = [...prev, message];
          
          // Cache the updated messages
          cacheMessages(updated);
          
          return updated;
        });
      }
    };

    // Handle typing indicators
    const handleTyping = (data: { chatId: string; userId: string }) => {
      if (data.chatId === chatId) {
        setIsTyping(true);
        setTypingUserId(data.userId);
      }
    };

    const handleStopTyping = (data: { chatId: string; userId: string }) => {
      if (data.chatId === chatId) {
        setIsTyping(false);
        setTypingUserId(null);
      }
    };

    // Register listeners
    onNewMessage(handleNewMessage);
    onTyping(handleTyping);
    onStopTyping(handleStopTyping);

    // Cleanup
    return () => {
      leaveChat(chatId);
      offNewMessage(handleNewMessage);
      console.log('Left chat:', chatId);
    };
  }, [chatId, isConnected]);

  
   // Load messages from backend
   
  const loadMessages = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await chatService.getMessages(chatId, pageNum, pageSize);

      if (pageNum === 1) {
        const newMessages = response.messages.reverse(); // Reverse to show oldest first
        setMessages(newMessages);
        
        // Cache the messages
        cacheMessages(newMessages);
      } else {
        setMessages((prev) => {
          const updated = [...response.messages.reverse(), ...prev];
          
          // Cache the updated messages
          cacheMessages(updated);
          
          return updated;
        });
      }

      setHasMore(response.meta.page < response.meta.totalPages);
      setPage(pageNum);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load messages';
      setError(errorMessage);
      console.error('Failed to load messages:', err);
      
      // If offline and we have cached messages, don't show error
      const cached = await loadCachedMessages();
      if (!cached) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  
   // Load more messages (pagination)
   
  const loadMore = () => {
    if (!loading && hasMore) {
      loadMessages(page + 1);
    }
  };

  
   // Send a message
   
  const sendMessage = async (
    content: string,
    type: 'text' | 'image' = 'text',
    imageUrl?: string
  ) => {
    if (!content.trim() && type === 'text') return;

    try {
      setSending(true);
      setError(null);

      // Send using socket (backend will save to DB and broadcast)
      socketSendMessage(chatId, content.trim(), type, imageUrl);

      // The new message will be received through the socket 'new-message' event and added to the UI through the handleNewMessage callback

      console.log('Message sent via socket'); 
      // No return value here as the message object is not immediately available from socket emit
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send message';
      setError(errorMessage);
      console.error('Failed to send message:', err);
      Alert.alert('Error', errorMessage);
      throw err;
    } finally {
      setSending(false);
    }
  };


   // Mark messages as read
   
  const markMessagesAsRead = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    
    try {
      // Only notify via socket - backend will handle the update
      socketMarkAsRead(chatId, messageIds);

      console.log('Messages marked as read via socket:', messageIds.length);
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
    }
  };

  
   // Delete a message
   
  const deleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);

      // Remove from UI
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      console.log('Message deleted:', messageId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete message';
      console.error('Failed to delete message:', err);
      Alert.alert('Error', errorMessage);
    }
  };

  
   // Send typing indicator
   
  const sendTyping = useCallback(() => {
    socketSendTyping(chatId);
  }, [chatId, socketSendTyping]);

  
   // Send stop typing indicator
   
  const sendStopTyping = useCallback(() => {
    socketSendStopTyping(chatId);
  }, [chatId, socketSendStopTyping]);

  
   // Refresh messages
   
  const refresh = () => {
    loadMessages(1);
  };

  return {
    // Data
    messages,
    loading,
    sending,
    error,
    hasMore,
    isConnected,

    // Typing
    isTyping,
    typingUserId,
    sendTyping,
    sendStopTyping,

    // Actions
    sendMessage,
    deleteMessage,
    markMessagesAsRead,
    loadMore,
    refresh,
  };
};












