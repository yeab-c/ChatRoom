import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { matchingService } from '../services/api';
import type { MatchResult } from '../services/api';

export const useMatching = () => {
  const { onMatchFound, onMatchTimeout, isConnected } = useSocket();
  const { user, isAuthenticated } = useAuth();

  const [searching, setSearching] = useState(false);
  const [matched, setMatched] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);

  
   // Setup socket listeners for match events
   
  useEffect(() => {
    if (!isConnected) return;

    // Handle match found from socket
    const handleMatchFound = (data: { chatId: string; otherUser: any }) => {
      console.log('Match found via socket:', data);
      setSearching(false);
      setMatched(true);
      setChatId(data.chatId);
      setOtherUser(data.otherUser);
      setError(null);
    };

    // Handle match timeout
    const handleMatchTimeout = () => {
      console.log('Match search timed out');
      setSearching(false);
      setMatched(false);
      setChatId(null);
      setOtherUser(null);
      setError('No match found. Please try again.');
      Alert.alert(
        'Match Timeout',
        'No match found at this time. Would you like to try again?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: startMatch },
        ]
      );
    };

    // Register listeners
    onMatchFound(handleMatchFound);
    onMatchTimeout(handleMatchTimeout);

    return () => {
      // Socket context handles cleanup
    };
  }, [isConnected]);

  
   // Check current match status on mount - only when user is fully synced
   
  useEffect(() => {
    if (isAuthenticated && user) {
      checkStatus();
    }
  }, [isAuthenticated, user]);

  
    //Start searching for a match
  const startMatch = async () => {
    if (!isAuthenticated) {
      Alert.alert('Not Authenticated', 'Please log in first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearchStartTime(Date.now());

      const result: MatchResult = await matchingService.startMatch();

      if (result.chatId && result.otherUser) {
        // Match found immediately
        console.log('Match found immediately:', result);
        setMatched(true);
        setSearching(false);
        setChatId(result.chatId);
        setOtherUser(result.otherUser);
      } else {
        // Searching for match - will get socket event when found
        console.log('Started searching for match');
        setSearching(true);
        setMatched(false);
        setChatId(null);
        setOtherUser(null);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to start match';
      setError(errorMessage);
      console.error('Failed to start match:', err);
      Alert.alert('Error', errorMessage);
      setSearching(false);
    } finally {
      setLoading(false);
    }
  };

  
   // Cancel match search
   
  const cancelMatch = async () => {
    try {
      setLoading(true);
      await matchingService.cancelMatch();

      setSearching(false);
      setMatched(false);
      setChatId(null);
      setOtherUser(null);
      setSearchStartTime(null);
      setError(null);

      console.log('Match search cancelled');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel match';
      console.error('Failed to cancel match:', err);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  
   // Check current match status(ONLY call if authenticated)
   
  const checkStatus = async () => {
    if (!isAuthenticated) {
      console.log('Skipping match status check - not authenticated');
      return;
    }

    try {
      const status = await matchingService.getMatchStatus();

      console.log('Match status:', status);

      // Only set matched state if currently searching(This prevents old matched status from interfering)
      if (status.searching) {
        setSearching(true);
        setMatched(status.matched); // Set matched status if searching
        if (status.chatId) {
          setChatId(status.chatId);
        }
        if (status.otherUser) {
          setOtherUser(status.otherUser);
        }
      } else {
        setSearching(false);
        // Clear old matched status if not searching
        if (status.matched) { // If matched is true but not searching, it's an old state
          console.log('Clearing old matched status');
          setMatched(false);
          setChatId(null);
          setOtherUser(null);
        }
      }
    } catch (err: any) {
      console.error('Failed to check match status:', err);
      
    }
  };

  
   // Save chat (make it permanent)
   
  const saveChat = async (chatIdToSave: string) => {
    try {
      setLoading(true);
      const result = await matchingService.saveChat(chatIdToSave);

      console.log('Chat save result:', result);

      if (result.isSaved) {
        Alert.alert(
          'Chat Saved!',
          'This chat is now permanent and has been added to your saved chats.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Waiting for Other User',
          result.message || 'The other user also needs to save this chat to make it permanent.',
          [{ text: 'OK' }]
        );
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save chat';
      console.error('Failed to save chat:', err);
      Alert.alert('Error', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  
   // Reset match state
   
  const reset = () => {
    setSearching(false);
    setMatched(false);
    setChatId(null);
    setOtherUser(null);
    setError(null);
    setSearchStartTime(null);
  };

  
   // Get elapsed search time in seconds
   
  const getSearchTime = (): number => {
    if (!searchStartTime) return 0;
    return Math.floor((Date.now() - searchStartTime) / 1000);
  };

  return {
    // State
    searching,
    matched,
    chatId,
    otherUser,
    loading,
    error,
    isConnected,

    // Actions
    startMatch,
    cancelMatch,
    checkStatus,
    saveChat,
    reset,

    // Helpers
    getSearchTime,
  };
};