import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Socket URL - same as your backend
const SOCKET_URL = __DEV__
  ? 'http://192.168.100.63:5000'
  : process.env.EXPO_PUBLIC_SOCKET_URL || 'https://your-production-url.com';


// Import Message type from API service for consistency
export type { Message } from '../api/chat';

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  /**
   * Initialize socket connection
   */
  async connect(userId: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      // Get Clerk token
      const token = await AsyncStorage.getItem('@clerk_token');

      if (!token) {
        throw new Error('No auth token found');
      }

      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        auth: {
          token,
          userId,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.setupEventHandlers();
      console.log('Socket connecting...');
    } catch (error) {
      console.error('Socket connection error:', error);
      throw error;
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✓ Socket connected:', this.socket?.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('✗ Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected manually');
    }
  }

  /**
   * Check if socket is connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }


  // CHAT EVENTS


  /**
   * Join a chat room
   */
  joinChat(chatId: string, userId: string): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.emit('join-chat', { chatId, userId });
    console.log('Joined chat:', chatId);
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId: string, userId: string): void {
    if (!this.socket) return;
    this.socket.emit('leave-chat', { chatId, userId });
    console.log('Left chat:', chatId);
  }

  /**
   * Send a message
   */
  sendMessage(
    chatId: string,
    senderId: string,
    type: 'text' | 'image',
    content: string,
    imageUrl?: string
  ): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.emit('send-message', {
      chatId,
      senderId,
      type,
      content,
      imageUrl,
    });
  }

  /**
   * Listen for new messages
   */
  onNewMessage(callback: (message: any) => void): void {
    if (!this.socket) return;
    this.socket.on('new-message', callback);
  }

  /**
   * Remove new message listener
   */
  offNewMessage(callback?: (message: any) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off('new-message', callback);
    } else {
      this.socket.off('new-message');
    }
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatId: string, userId: string): void {
    if (!this.socket) return;
    this.socket.emit('typing', { chatId, userId });
  }

  /**
   * Send stop typing indicator
   */
  sendStopTyping(chatId: string, userId: string): void {
    if (!this.socket) return;
    this.socket.emit('stop-typing', { chatId, userId });
  }

  /**
   * Listen for typing indicators
   */
  onUserTyping(callback: (data: TypingIndicator) => void): void {
    if (!this.socket) return;
    this.socket.on('user-typing', callback);
  }

  /**
   * Listen for stop typing indicators
   */
  onUserStopTyping(callback: (data: TypingIndicator) => void): void {
    if (!this.socket) return;
    this.socket.on('user-stop-typing', callback);
  }

  /**
   * Mark messages as read
   */
  markMessagesAsRead(chatId: string, userId: string, messageIds: string[]): void {
    if (!this.socket) return;
    this.socket.emit('mark-read', { chatId, userId, messageIds });
  }

  /**
   * Listen for messages read event
   */
  onMessagesRead(callback: (data: { userId: string; messageIds: string[] }) => void): void {
    if (!this.socket) return;
    this.socket.on('messages-read', callback);
  }


  // MATCHING EVENTS


  /**
   * Listen for match found event
   */
  onMatchFound(callback: (data: { chatId: string; otherUser: any }) => void): void {
    if (!this.socket) return;
    this.socket.on('match-found', callback);
  }

  /**
   * Listen for match timeout
   */
  onMatchTimeout(callback: () => void): void {
    if (!this.socket) return;
    this.socket.on('match-timeout', callback);
  }


  // CHAT SAVE EVENTS


  /**
   * Listen for chat saved event
   */
  onChatSaved(callback: (data: { chatId: string; savedBy: string[]; isSaved: boolean }) => void): void {
    if (!this.socket) return;
    this.socket.on('chat-saved', callback);
  }

  /**
   * Listen for chat terminated event
   */
  onChatTerminated(callback: (data: { chatId: string; reason: string; message?: string }) => void): void {
    if (!this.socket) return;
    this.socket.on('chat-terminated', callback);
  }


  // USER STATUS EVENTS


  /**
   * Listen for user online status
   */
  onUserOnline(callback: (userId: string) => void): void {
    if (!this.socket) return;
    this.socket.on('user-online', callback);
  }

  /**
   * Listen for user offline status
   */
  onUserOffline(callback: (userId: string) => void): void {
    if (!this.socket) return;
    this.socket.on('user-offline', callback);
  }


  // GROUP EVENTS


  /**
   * Join a group chat
   */
  joinGroup(groupId: string, userId: string): void {
    if (!this.socket) return;
    this.socket.emit('join-group', { groupId, userId });
    console.log('Joined group:', groupId);
  }

  /**
   * Leave a group chat
   */
  leaveGroup(groupId: string, userId: string): void {
    if (!this.socket) return;
    this.socket.emit('leave-group', { groupId, userId });
    console.log('Left group:', groupId);
  }

  /**
   * Listen for group updates
   */
  onGroupUpdate(callback: (data: { groupId: string; type: string; data: any }) => void): void {
    if (!this.socket) return;
    this.socket.on('group-update', callback);
  }


  // NOTIFICATION EVENTS


  /**
   * Listen for notifications
   */
  onNotification(callback: (data: { type: string; message: string; data?: any }) => void): void {
    if (!this.socket) return;
    this.socket.on('notification', callback);
  }


  // CLEANUP


  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    console.log('All socket listeners removed');
  }
}

// Export singleton instance
export default new SocketService();












