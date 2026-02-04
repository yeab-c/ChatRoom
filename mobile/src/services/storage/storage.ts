import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  /**
   * Save data to storage
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  }

  /**
   * Get data from storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  /**
   * Remove data from storage
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
      throw error;
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }

  /**
   * Get multiple items
   */
  async getMultiple<T>(keys: string[]): Promise<{ [key: string]: T | null }> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: { [key: string]: T | null } = {};

      pairs.forEach(([key, value]) => {
        result[key] = value ? JSON.parse(value) : null;
      });

      return result;
    } catch (error) {
      console.error('Storage getMultiple error:', error);
      return {};
    }
  }

  /**
   * Set multiple items
   */
  async setMultiple(items: { [key: string]: any }): Promise<void> {
    try {
      const pairs = Object.entries(items).map(([key, value]) => [key, JSON.stringify(value)] as const);
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('Storage setMultiple error:', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  }
}

export default new StorageService();
