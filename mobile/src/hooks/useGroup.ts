import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import groupService, { Group } from '../services/api/group';
import messageService from '../services/api/chat';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Message } from '../types';

export const useGroup = (groupId: string) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<any>(null);

  // Fetch group details
  const fetchGroup = useCallback(async () => {
    try {
      const data = await groupService.getGroupById(groupId);
      setGroup(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load group');
    }
  }, [groupId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!group?.mongoGroupId) return;
    
    try {
      setLoading(true);
      const response = await messageService.getMessages(group.mongoGroupId);
      // Reverse messages so oldest is first (top) and newest is last (bottom)
      const sortedMessages = (response.messages || response).reverse();
      setMessages(sortedMessages);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [group?.mongoGroupId]);

  // Send text message
  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim() || !group?.mongoGroupId) return;

    try {
      setSending(true);
      
      // Send via socket for real-time delivery
      if (socket) {
        socket.emit('send-message', {
          chatId: group.mongoGroupId,
          type: 'text',
          content: text.trim(),
          chatType: 'group',
        });
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [group?.mongoGroupId, socket]);

  // Send image message
  const sendImageMessage = useCallback(async (imageUrl: string) => {
    if (!group?.mongoGroupId) return;
    
    try {
      setSending(true);
      
      // Send via socket for real-time delivery
      if (socket) {
        socket.emit('send-message', {
          chatId: group.mongoGroupId,
          type: 'image',
          content: imageUrl,
          imageUrl,
          chatType: 'group',
        });
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send image');
    } finally {
      setSending(false);
    }
  }, [group?.mongoGroupId, socket]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !group?.mongoGroupId) return;

    const mongoChatId = group.mongoGroupId;

    // Join group room
    socket.emit('join-group', { groupId: mongoChatId });

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      if (message.chatId === mongoChatId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    // Listen for typing indicator
    const handleTyping = (data: { userId: string; userName: string; groupId: string }) => {
      if (data.groupId === mongoChatId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleTyping);
      socket.emit('leave-group', { groupId: mongoChatId });
    };
  }, [socket, group?.mongoGroupId]);

  // Mark messages as read when viewing group
  useEffect(() => {
    if (!socket || !group?.mongoGroupId || messages.length === 0 || !user?.id) return;

    const unreadMessages = messages.filter(
      (m) => !m.readBy?.includes(user.id) && m.sender.id !== user.id
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((m) => m.id);
      socket.emit('mark-read', {
        chatId: group.mongoGroupId,
        messageIds,
      });
      console.log(`Marked ${messageIds.length} group messages as read`);
    }
  }, [messages.length, group?.mongoGroupId, socket, user?.id]);

  // Initial load
  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // Fetch messages after group is loaded
  useEffect(() => {
    if (group) {
      fetchMessages();
    }
  }, [group, fetchMessages]);

  return {
    group,
    messages,
    loading,
    sending,
    isTyping,
    flatListRef,
    sendTextMessage,
    sendImageMessage,
    refreshGroup: fetchGroup,
    refreshMessages: fetchMessages,
  };
};
