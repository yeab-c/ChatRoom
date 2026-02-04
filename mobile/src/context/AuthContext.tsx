import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService, { User } from '../services/api/auth';
import { setTokenGetter } from '../services/api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  clerkUser: any;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { signOut, getToken } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Setup token getter for API client
  useEffect(() => {
    if (getToken) {
      setTokenGetter(getToken);
    }
  }, [getToken]);

  // Load user when Clerk is ready
  useEffect(() => {
    if (isClerkLoaded) {
      loadUser();
    }
  }, [clerkUser, isClerkLoaded]);

  // Redirect based on auth status
  useEffect(() => {
    if (isLoading || !isClerkLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!clerkUser && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (clerkUser && user && inAuthGroup) {
      // Only redirect when user is fully loaded
      router.replace('/(tabs)');
    }
  }, [clerkUser, user, segments, isLoading, isClerkLoaded]);

  /**
   * Load user from cache or sync with backend
   */
  const loadUser = async () => {
    try {
      setIsLoading(true);

      if (!clerkUser) {
        setUser(null);
        await AsyncStorage.multiRemove(['@clerk_token', '@user']);
        return;
      }

      // Get Clerk token
      const token = await getToken();
      if (!token) {
        console.warn('No Clerk token available');
        setUser(null);
        return;
      }

      // IMPORTANT: Save token FIRST before any API calls
      await AsyncStorage.setItem('@clerk_token', token);
      console.log('Clerk token saved to AsyncStorage');

      // Try cached user first for faster UI
      const cachedUser = await authService.getCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
        console.log('Loaded cached user');
      }

      // Sync with backend
      try {
        const backendUser = await authService.syncUser(token);
        setUser(backendUser);
        console.log('User synced with backend:', backendUser.email);
      } catch (error: any) {
        console.error('Backend sync failed:', error.response?.data || error.message);

        // If backend sync fails but we have cached user, keep using it
        if (cachedUser) {
          console.log('Using cached user (backend sync failed)');
        } else {
          // No cached user and sync failed - log out
          console.error('No cached user, logging out');
          await handleLogout();
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  
   // Refresh user from backend
   
  const refreshUser = async () => {
    if (!clerkUser) return;

    try {
      const token = await getToken();
      if (token) {
        // Update token in AsyncStorage
        await AsyncStorage.setItem('@clerk_token', token);

        const backendUser = await authService.getCurrentUser();
        setUser(backendUser);
        console.log('User refreshed from backend');
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  
   // Logout handler
   
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Backend logout error:', error);
    }

    await signOut();
    setUser(null);
    router.replace('/(auth)/login');
  };

  const logout = async () => {
    try {
      await handleLogout();
    } catch (error) {
      console.error('Logout failed:', error);
      await signOut();
      setUser(null);
      router.replace('/(auth)/login');
    }
  };

  
   // Update user locally (optimistic)
   
  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!clerkUser && !!user,
        clerkUser,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};