import * as SecureStore from 'expo-secure-store';


 // Token cache for Clerk authentication
 // Stores tokens securely using expo-secure-store

export const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.error('Error getting token from secure store:', err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('Error saving token to secure store:', err);
      return;
    }
  },
};