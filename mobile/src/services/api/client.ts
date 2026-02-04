import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend URL
const API_URL = __DEV__
  ? 'http://192.168.100.63:5000/api'
  : process.env.EXPO_PUBLIC_API_URL || 'https://your-production-url.com/api';

// Axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token getter function - will be set by AuthContext
let getTokenFunction: (() => Promise<string | null>) | null = null;

export const setTokenGetter = (getter: () => Promise<string | null>) => {
  getTokenFunction = getter;
};

// Request interceptor - get fresh token from Clerk
apiClient.interceptors.request.use(
  async (config) => {
    try {
      let token: string | null = null;

      // Try to get fresh token from Clerk first
      if (getTokenFunction) {
        token = await getTokenFunction();
        if (token) {
          // Update AsyncStorage with fresh token
          await AsyncStorage.setItem('@clerk_token', token);
        }
      }

      // Fallback to AsyncStorage if no token getter available
      if (!token) {
        token = await AsyncStorage.getItem('@clerk_token');
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (__DEV__) {
        console.log('API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          hasToken: !!token,
        });
      }
    } catch (error) {
      console.error('Error getting token for API request:', error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and retry on 401
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
      });
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    const originalRequest = error.config;

    // Don't log expected client errors (400-499) except 401
    if (status && status >= 400 && status < 500 && status !== 401) {
      // These are expected errors (validation, forbidden, etc.)
      // Only log in dev mode for debugging
      if (__DEV__ && status !== 403) {
        console.log('API Client Error:', { url: error.config?.url, status, message });
      }
    } else {
      // Log server errors and network errors
      console.error('API Error:', { url: error.config?.url, status, message });
    }

    // Handle 401 - try to refresh token and retry once
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to get fresh token from Clerk
        if (getTokenFunction) {
          const freshToken = await getTokenFunction();
          
          if (freshToken) {
            // Update AsyncStorage with fresh token
            await AsyncStorage.setItem('@clerk_token', freshToken);
            
            // Update the authorization header
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            
            // Retry the original request
            console.log('🔄 Retrying request with fresh token');
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
      }

      // If we get here, token refresh failed - clear tokens
      await AsyncStorage.multiRemove(['@clerk_token', '@user']);
      console.log('Unauthorized - cleared tokens');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
