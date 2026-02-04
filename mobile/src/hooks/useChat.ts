import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSocket } from '../context/SocketContext';
import { chatService } from '../services';
import { Message, Chat } from '../types';

export const useChat = (chatId: string) => {
  const { socket, joinChat, leaveChat, sendMessage: socketSendMessage } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Load chat and messages
  useEffect(() => {
    loadChat();
    loadMessages();
  }, [chatId]);

  // Join chat room when component mounts
  useEffect(() => {
    if (socket && chatId) {
      joinChat(chatId);

      // Listen for new messages
      socket.on('new-message', handleNewMessage);
      socket.on('user-typing', handleTyping);
      socket.on('user-stop-typing', handleStopTyping);

      return () => {
        leaveChat(chatId);
        socket.off('new-message', handleNewMessage);
        socket.off('user-typing', handleTyping);
        socket.off('user-stop-typing', handleStopTyping);
      };
    }
  }, [socket, chatId]);

  const loadChat = async () => {
    try {
      const chatData = await chatService.getChatById(chatId);
      setChat(chatData);
    } catch (error) {
      console.error('Failed to load chat:', error);
      Alert.alert('Error', 'Failed to load chat');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messagesData = await chatService.getMessages(chatId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = useCallback((message: Message) => {
    if (message.chatId === chatId) {
      setMessages((prev) => [...prev, message]);
    }
  }, [chatId]);

  const handleTyping = useCallback((data: { chatId: string; userId: string }) => {
    if (data.chatId === chatId) {
      setIsTyping(true);
    }
  }, [chatId]);

  const handleStopTyping = useCallback((data: { chatId: string; userId: string }) => {
    if (data.chatId === chatId) {
      setIsTyping(false);
    }
  }, [chatId]);

  const sendMessage = async (content: string, type: 'text' | 'image' = 'text') => {
    try {
      setSending(true);
      
      // Send via Socket.IO for real-time
      socketSendMessage(chatId, content, type);
      
      // Also save to backend
      const newMessage = await chatService.sendMessage(chatId, type, content);
      
      // Message will be added via socket listener
      return newMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageIds: string[]) => {
    try {
      await chatService.markAsRead(chatId, messageIds);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return {
    chat,
    messages,
    loading,
    sending,
    isTyping,
    sendMessage,
    markAsRead,
    refreshMessages: loadMessages,
  };
};