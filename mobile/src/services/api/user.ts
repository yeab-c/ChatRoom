import apiClient from './client';
import { User } from './auth';

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  gender?: string;
  age?: number;
  country?: string;
  hobbies?: string;
}

export interface UserStats {
  savedChats: number;
  groups: number;
  blockedUsers: number;
}

export interface BlockedUser {
  id: string;
  blockedUser: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
}

class UserService {
  /**
   * Get user profile by ID
   * Backend endpoint: GET /api/users/:id
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get user:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update own profile
   * Backend endpoint: PUT /api/users/me
   */
  async updateProfile(updates: UpdateProfileData): Promise<User> {
    try {
      const response = await apiClient.put('/users/me', updates);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update profile:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update avatar
   * Backend endpoint: PUT /api/users/me/avatar
   */
  async updateAvatar(avatarUrl: string): Promise<User> {
    try {
      const response = await apiClient.put('/users/me/avatar', { avatarUrl });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update avatar:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user statistics
   * Backend endpoint: GET /api/users/me/stats
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await apiClient.get('/users/me/stats');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get user stats:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Report a user
   * Backend endpoint: POST /api/users/:userId/report
   */
  async reportUser(userId: string, reason: string, chatId?: string): Promise<void> {
    try {
      await apiClient.post(`/users/${userId}/report`, {
        reason,
        chatId,
      });
      console.log('User reported successfully');
    } catch (error: any) {
      console.error('Failed to report user:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Block a user
   * Backend endpoint: POST /api/users/:userId/block
   */
  async blockUser(userId: string): Promise<void> {
    try {
      await apiClient.post(`/users/${userId}/block`);
      console.log('User blocked successfully');
    } catch (error: any) {
      console.error('Failed to block user:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Unblock a user
   * Backend endpoint: DELETE /api/users/:userId/block
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${userId}/block`);
      console.log('User unblocked successfully');
    } catch (error: any) {
      console.error('Failed to unblock user:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get blocked users list
   * Backend endpoint: GET /api/users/me/blocked
   */
  async getBlockedUsers(): Promise<any[]> {
    try {
      const response = await apiClient.get('/users/me/blocked');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get blocked users:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new UserService();












