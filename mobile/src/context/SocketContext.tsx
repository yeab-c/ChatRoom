import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import socketService from '../services/socket/socket';
import { useAuth } from './AuthContext';
import type { Message } from '../services/api';

// Typing indicator type
export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  
  // Connection
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Message events
  onNewMessage: (callback: (message: Message) => void) => void;
  offNewMessage: (callback?: (message: Message) => void) => void;
  sendMessage: (chatId: string, content: string, type: 'text' | 'image', imageUrl?: string) => void;
  
  // Typing events
  onTyping: (callback: (data: TypingIndicator) => void) => void;
  onStopTyping: (callback: (data: TypingIndicator) => void) => void;
  sendTyping: (chatId: string) => void;
  sendStopTyping: (chatId: string) => void;
  
  // User status events
  onUserOnline: (callback: (userId: string) => void) => void;
  onUserOffline: (callback: (userId: string) => void) => void;
  
  // Chat room events
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  
  // Group events
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  onGroupUpdate: (callback: (data: any) => void) => void;
  
  // Matching events
  onMatchFound: (callback: (data: { chatId: string; otherUser: any }) => void) => void;
  onMatchTimeout: (callback: () => void) => void;
  
  // Chat save events
  onChatSaved: (callback: (data: { chatId: string; savedBy: string[]; isSaved: boolean }) => void) => void;
  onChatTerminated: (callback: (data: { chatId: string; reason: string; message?: string }) => void) => void;
  
  // Read receipts
  markAsRead: (chatId: string, messageIds: string[]) => void;
  onMessagesRead: (callback: (data: { userId: string; messageIds: string[] }) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  
   // Initialize socket connection when user is authenticated(Wait for isLoading to be false AND user to be set)
   
  useEffect(() => {
    // Don't try to connect while still loading
    if (isLoading) {
      console.log('Waiting for auth to finish loading...');
      return;
    }

    // Connect only if authenticated and user is loaded
    if (isAuthenticated && user) {
      console.log('User authenticated, connecting socket...');
      connectSocket();
    } else {
      console.log('Not authenticated, disconnecting socket...');
      disconnectSocket();
    }

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user?.id, isLoading]);

  
   // Connect to socket
   
  const connectSocket = useCallback(async () => {
    if (!user?.id) {
      console.log('Cannot connect socket: No user ID');
      return;
    }

    try {
      await socketService.connect(user.id);
      setIsConnected(socketService.getConnectionStatus());
      console.log('Socket service connected');
    } catch (error) {
      console.error('Failed to connect socket:', error);
      setIsConnected(false);
    }
  }, [user?.id]);

  
   // Disconnect socket
   
  const disconnectSocket = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  
   // Monitor connection status
   
  useEffect(() => {
    const interval = setInterval(() => {
      const status = socketService.getConnectionStatus();
      if (status !== isConnected) {
        setIsConnected(status);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected]);


  // MESSAGE EVENTS


  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    socketService.onNewMessage(callback);
  }, []);

  const offNewMessage = useCallback((callback?: (message: Message) => void) => {
    socketService.offNewMessage(callback);
  }, []);

  const sendMessage = useCallback((
    chatId: string,
    content: string,
    type: 'text' | 'image' = 'text',
    imageUrl?: string
  ) => {
    if (!user?.id) return;
    socketService.sendMessage(chatId, user.id, type, content, imageUrl);
  }, [user?.id]);


  // TYPING EVENTS


  const onTyping = useCallback((callback: (data: TypingIndicator) => void) => {
    socketService.onUserTyping(callback);
  }, []);

  const onStopTyping = useCallback((callback: (data: TypingIndicator) => void) => {
    socketService.onUserStopTyping(callback);
  }, []);

  const sendTyping = useCallback((chatId: string) => {
    if (!user?.id) return;
    socketService.sendTyping(chatId, user.id);
  }, [user?.id]);

  const sendStopTyping = useCallback((chatId: string) => {
    if (!user?.id) return;
    socketService.sendStopTyping(chatId, user.id);
  }, [user?.id]);

  // USER STATUS EVENTS

  const onUserOnline = useCallback((callback: (userId: string) => void) => {
    socketService.onUserOnline(callback);
  }, []);

  const onUserOffline = useCallback((callback: (userId: string) => void) => {
    socketService.onUserOffline(callback);
  }, []);


  // CHAT ROOM EVENTS


  const joinChat = useCallback((chatId: string) => {
    if (!user?.id) return;
    socketService.joinChat(chatId, user.id);
  }, [user?.id]);

  const leaveChat = useCallback((chatId: string) => {
    if (!user?.id) return;
    socketService.leaveChat(chatId, user.id);
  }, [user?.id]);


  // GROUP EVENTS


  const joinGroup = useCallback((groupId: string) => {
    if (!user?.id) return;
    socketService.joinGroup(groupId, user.id);
  }, [user?.id]);

  const leaveGroup = useCallback((groupId: string) => {
    if (!user?.id) return;
    socketService.leaveGroup(groupId, user.id);
  }, [user?.id]);

  const onGroupUpdate = useCallback((callback: (data: any) => void) => {
    socketService.onGroupUpdate(callback);
  }, []);


  // MATCHING EVENTS


  const onMatchFound = useCallback((callback: (data: { chatId: string; otherUser: any }) => void) => {
    socketService.onMatchFound(callback);
  }, []);

  const onMatchTimeout = useCallback((callback: () => void) => {
    socketService.onMatchTimeout(callback);
  }, []);


  // CHAT SAVE EVENTS


  const onChatSaved = useCallback((callback: (data: { chatId: string; savedBy: string[]; isSaved: boolean }) => void) => {
    socketService.onChatSaved(callback);
  }, []);

  const onChatTerminated = useCallback((callback: (data: { chatId: string; reason: string; message?: string }) => void) => {
    socketService.onChatTerminated(callback);
  }, []);


  // READ RECEIPTS


  const markAsRead = useCallback((chatId: string, messageIds: string[]) => {
    if (!user?.id) return;
    socketService.markMessagesAsRead(chatId, user.id, messageIds);
  }, [user?.id]);

  const onMessagesRead = useCallback((callback: (data: { userId: string; messageIds: string[] }) => void) => {
    socketService.onMessagesRead(callback);
  }, []);


  // CONTEXT VALUE


  const value: SocketContextType = {
    socket: socketService.getSocket(),
    isConnected,
    
    // Connection
    connect: connectSocket,
    disconnect: disconnectSocket,
    
    // Messages
    onNewMessage,
    offNewMessage,
    sendMessage,
    
    // Typing
    onTyping,
    onStopTyping,
    sendTyping,
    sendStopTyping,
    
    // User status
    onUserOnline,
    onUserOffline,
    
    // Chat rooms
    joinChat,
    leaveChat,
    
    // Groups
    joinGroup,
    leaveGroup,
    onGroupUpdate,
    
    // Matching
    onMatchFound,
    onMatchTimeout,
    
    // Chat save
    onChatSaved,
    onChatTerminated,
    
    // Read receipts
    markAsRead,
    onMessagesRead,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};