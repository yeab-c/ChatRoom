import apiClient from './client';

export interface MatchResult {
  searching?: boolean;
  chatId?: string;
  otherUser?: {
    id: string;
    name: string;
    avatar: string;
  };
  message?: string;
}

export interface MatchStatus {
  searching: boolean;
  matched: boolean;
  chatId?: string;
  otherUser?: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface SaveChatResponse {
  chatId: string;
  isSaved: boolean;
  savedBy: string[];
  message?: string;
}

class MatchingService {
  /**
   * Start searching for a random match
   * Backend endpoint: POST /api/match/start
   */
  async startMatch(): Promise<MatchResult> {
    try {
      const response = await apiClient.post('/match/start');

      // Backend returns:
      // If match found: { success: true, data: { chatId, otherUser }, message: "Match found" }
      // If searching: { success: true, data: { searching: true }, message: "Searching..." }
      const data = response.data.data;

      console.log('Match started:', data);
      return data;
    } catch (error: any) {
      console.error('Failed to start match:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Cancel match search
   * Backend endpoint: POST /api/match/cancel
   */
  async cancelMatch(): Promise<void> {
    try {
      await apiClient.post('/match/cancel');
      console.log('Match cancelled successfully');
    } catch (error: any) {
      console.error('Failed to cancel match:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get current match status
   * Backend endpoint: GET /api/match/status
   */
  async getMatchStatus(): Promise<MatchStatus> {
    try {
      const response = await apiClient.get('/match/status');

      // Backend returns: { success: true, data: { searching, matched, chatId? } }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get match status:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Save temporary chat (both users must save to make it permanent)
   * Backend endpoint: POST /api/chats/:chatId/save
   */
  async saveChat(chatId: string): Promise<SaveChatResponse> {
    try {
      const response = await apiClient.post(`/chats/${chatId}/save`);

      // Backend returns:
      // { success: true, data: { chatId, isSaved, savedBy, message? } }
      const data = response.data.data;

      console.log('Chat save response:', data);
      return data;
    } catch (error: any) {
      console.error('Failed to save chat:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new MatchingService();