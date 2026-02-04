import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatar: string;
  bio?: string;
  gender?: string;
  age?: number;
  country?: string;
  hobbies?: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

class AuthService {
  /**
   * Sync user with backend (called after Clerk authentication)
   * Backend endpoint: POST /api/auth/sync
   */
  async syncUser(clerkToken: string | null): Promise<User> {
    if (!clerkToken) {
      throw new Error('No Clerk token provided for syncUser');
    }

    try {
      // No need for setAuthToken anymore
      const response = await apiClient.post('/auth/sync', {}, {
        headers: { Authorization: `Bearer ${clerkToken}` }
      });

      const user = response.data.data;

      await AsyncStorage.setItem('@user', JSON.stringify(user));
      console.log('User synced successfully:', user.email);

      return user;
    } catch (error: any) {
      console.error('Failed to sync user:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get current user from backend
   * Backend endpoint: GET /api/auth/me
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get('/auth/me');
      const user = response.data.data;
      await AsyncStorage.setItem('@user', JSON.stringify(user));
      return user;
    } catch (error: any) {
      console.error('Failed to get current user:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Logout - clear backend session and local storage
   * Backend endpoint: POST /api/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await AsyncStorage.multiRemove(['@clerk_token', '@user']);
      console.log('User logged out successfully');
    }
  }

  /**
   * Get cached user from local storage (no API call)
   */
  async getCachedUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem('@user');
      if (userJson) return JSON.parse(userJson);
      return null;
    } catch (error) {
      console.error('Error getting cached user:', error);
      return null;
    }
  }
}

export default new AuthService();
