import apiClient from './client';

export interface ChatListItem {
  id: string;
  chatId: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  type: 'text' | 'image';
  content: string;
  imageUrl?: string;
  readBy: string[];
  deliveredTo: string[];
  createdAt: string;
}

export interface SendMessageData {
  chatId: string;
  chatType?: 'one-on-one' | 'group';
  type: 'text' | 'image';
  content: string;
  imageUrl?: string;
  replyTo?: string;
}

class ChatService {
  /**
   * Get all saved chats for current user (paginated)
   * Backend endpoint: GET /api/chats?page=1&limit=20
   */
  async getChats(page: number = 1, limit: number = 20): Promise<{
    chats: ChatListItem[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await apiClient.get('/chats', {
        params: { page, limit },
      });

      // Backend returns: { success: true, data: [...], meta: {...} }
      return {
        chats: response.data.data,
        meta: response.data.meta,
      };
    } catch (error: any) {
      console.error('Failed to get chats:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get messages for a chat (paginated)
   * Backend endpoint: GET /api/messages/:chatId?page=1&limit=50
   */
  async getMessages(
    chatId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: Message[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await apiClient.get(`/messages/${chatId}`, {
        params: { page, limit },
      });

      // Backend returns: { success: true, data: [...], meta: {...} }
      return {
        messages: response.data.data,
        meta: response.data.meta,
      };
    } catch (error: any) {
      console.error('Failed to get messages:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send a message
   * Backend endpoint: POST /api/messages
   */
  async sendMessage(data: SendMessageData): Promise<Message> {
    try {
      const response = await apiClient.post('/messages', data);

      // Backend returns: { success: true, data: Message, message: "Message sent" }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to send message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Mark message as read
   * Backend endpoint: PUT /api/messages/:messageId/read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await apiClient.put(`/messages/${messageId}/read`);
      console.log('Message marked as read');
    } catch (error: any) {
      console.error('Failed to mark as read:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete a message
   * Backend endpoint: DELETE /api/messages/:messageId
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await apiClient.delete(`/messages/${messageId}`);
      console.log('Message deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete a chat
   * Backend endpoint: DELETE /api/chats/:chatId
   */
  async deleteChat(chatId: string): Promise<void> {
    try {
      await apiClient.delete(`/chats/${chatId}`);
      console.log('Chat deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete chat:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Save a temporary chat
   * Backend endpoint: POST /api/chats/:chatId/save
   */
  async saveChat(chatId: string): Promise<{
    data: {
      chatId: string;
      isSaved: boolean;
      savedBy: string[];
      message?: string;
    };
  }> {
    try {
      const response = await apiClient.post(`/chats/${chatId}/save`);

      // Backend returns: { success: true, data: { chatId, isSaved, savedBy }, message: "..." }
      return {
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('Failed to save chat:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get chat details (including expiresAt for temporary chats)
   * Backend endpoint: GET /api/chats/:chatId
   */
  async getChatDetails(chatId: string): Promise<{
    chatId: string;
    type: 'temporary' | 'permanent';
    isTemporary: boolean;
    expiresAt?: string;
    savedBy: string[];
    isSaved: boolean;
    participants: string[];
    otherUser: {
      id: string;
      name: string;
      avatar: string;
      isOnline: boolean;
    };
    createdAt: string;
    serverTime: string;
  }> {
    try {
      const response = await apiClient.get(`/chats/${chatId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get chat details:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create permanent chat between group members
   * Backend endpoint: POST /api/chats/group-member-chat
   */
  async createGroupMemberChat(data: {
    otherUserId: string;
    groupId: string;
  }): Promise<{
    chatId: string;
    otherUser: {
      id: string;
      name: string;
      avatar: string;
      isOnline: boolean;
    };
  }> {
    const response = await apiClient.post('/chats/group-member-chat', data);
    // Backend returns: { success: true, data: { chatId, otherUser }, message: "..." }
    return response.data.data;
  }

  /**
   * Terminate temporary chat (when user leaves without saving)
   * Backend endpoint: POST /api/chats/:chatId/terminate
   */
  async terminateChat(chatId: string): Promise<void> {
    try {
      await apiClient.post(`/chats/${chatId}/terminate`);
      console.log('Chat terminated successfully');
    } catch (error: any) {
      console.error('Failed to terminate chat:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new ChatService();





