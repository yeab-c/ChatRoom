import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { chatService, groupService } from '../services/api';
import type { ChatListItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useChatList = () => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user, isAuthenticated } = useAuth();
  
   // Load chats on mount - only when user is fully authenticated and synced
   
  useEffect(() => {
    if (isAuthenticated && user) {
      loadChats(1);
    }
  }, [isAuthenticated, user]);

  
   // Load chats from backend (includes both one-on-one and groups)
   
  const loadChats = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }
      setError(null);

      // Fetch both one-on-one chats and groups in parallel
      const [chatsResponse, groupsResponse] = await Promise.all([
        chatService.getChats(pageNum, 20),
        groupService.getUserGroups(),
      ]);

      // Transform groups to match ChatListItem format
      const groupChats = groupsResponse.map((group: any) => ({
        id: group.id,
        chatId: group.mongoGroupId,
        isGroup: true,
        groupName: group.name,
        groupAvatar: group.avatar,
        memberCount: group.members?.length || 0,
        otherUser: null, // Groups don't have otherUser
        lastMessage: group.lastMessage
          ? {
              content: group.lastMessage.content,
              createdAt: group.lastMessage.createdAt,
            }
          : undefined,
        unreadCount: group.unreadCount || 0,
        updatedAt: group.lastMessage?.createdAt || group.updatedAt || group.createdAt,
      })) as any;

      // Merge and sort by updatedAt
      const allChats = [...chatsResponse.chats, ...groupChats].sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });

      if (pageNum === 1) {
        setChats(allChats as any);
      } else {
        setChats((prev) => [...prev, ...chatsResponse.chats]);
      }

      setHasMore(chatsResponse.meta.page < chatsResponse.meta.totalPages);
      setPage(pageNum);

      console.log(`Loaded ${chatsResponse.chats.length} chats + ${groupChats.length} groups (page ${pageNum})`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load chats';
      
      
      if (err.response?.status === 429) {
        console.warn('Rate limit hit - will retry later');
        setError(null);
      } else {
        setError(errorMessage);
        console.error('Failed to load chats:', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  
   // Refresh chats (pull-to-refresh)
   
  const refresh = async () => {
    setRefreshing(true);
    await loadChats(1);
  };

  
   // Load more chats (pagination)
   
  const loadMore = () => {
    if (!loading && hasMore) {
      loadChats(page + 1);
    }
  };

  
   //Delete a chat
   
  const deleteChat = async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);

      // Remove from local state
      setChats((prev) => prev.filter((chat) => chat.chatId !== chatId));

      console.log('Chat deleted:', chatId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete chat';
      console.error('Failed to delete chat:', err);
      Alert.alert('Error', errorMessage);
      throw err;
    }
  };

  
   // Update chat's last message 
   
  const updateChatLastMessage = useCallback((chatId: string, message: string, time: Date) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.chatId === chatId
          ? {
              ...chat,
              lastMessage: {
                content: message,
                createdAt: time.toISOString(),
              },
              updatedAt: time.toISOString(),
            }
          : chat
      )
    );
  }, []);

  
   // Increment unread count for a chat
   
  const incrementUnread = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.chatId === chatId
          ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 }
          : chat
      )
    );
  }, []);

  
   // Reset unread count for a chat
   
  const resetUnread = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.chatId === chatId
          ? { ...chat, unreadCount: 0 }
          : chat
      )
    );
  }, []);

  
   // Get total unread count across all chats
   
  const getTotalUnread = useCallback(() => {
    return chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
  }, [chats]);

  
   // Update user online status
   
  const updateUserOnlineStatus = useCallback((userId: string, isOnline: boolean) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.otherUser.id === userId
          ? {
              ...chat,
              otherUser: { ...chat.otherUser, isOnline },
            }
          : chat
      )
    );
  }, []);

  return {
    // Data
    chats,
    loading,
    refreshing,
    error,
    hasMore,

    // Actions
    loadMore,
    refresh,
    deleteChat,

    // Updates (for real-time)
    updateChatLastMessage,
    incrementUnread,
    resetUnread,
    updateUserOnlineStatus,
    getTotalUnread,
  };
};