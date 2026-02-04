import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useSocket } from '../../src/context/SocketContext';
import { Button } from '../../src/components/common/Button';

export default function SearchingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { socket, onMatchFound, onMatchTimeout } = useSocket();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Timer
    const interval = setInterval(() => {
      setSearchTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) {
      console.warn('Socket not connected');
      return;
    }

    console.log('Starting match search via socket...');
    console.log('Socket ID:', socket.id);
    console.log('Socket connected:', socket.connected);

    // Emit start-matching event
    socket.emit('start-matching');
    console.log('Emitted start-matching event');

    // Listen for match found - Navigate to TEMP CHAT
    const handleMatchFound = (data: { chatId: string; otherUser: any }) => {
      console.log('MATCH FOUND EVENT RECEIVED!', data);
      console.log('Navigating to temp-chat with chatId:', data.chatId);

      // Navigate to TEMPORARY CHAT (not regular chat)
      router.replace({
        pathname: '/matching/temp-chat',
        params: {
          id: data.chatId,
          otherUser: JSON.stringify(data.otherUser),
        },
      });
    };

    // Listen for match timeout
    const handleMatchTimeout = () => {
      console.log('Match search timed out');
      router.replace('/matching/timeout');
    };

    // Listen for match searching confirmation
    const handleMatchSearching = () => {
      console.log('Match search confirmed by server');
    };

    // Listen for match error
    const handleMatchError = (error: { message: string }) => {
      console.error('Match error:', error);
      router.back();
    };

    // Listen for match cancelled
    const handleMatchCancelled = () => {
      console.log('Match search cancelled');
    };

    // Register listeners via SocketContext
    console.log('Registering match-found listener via SocketContext');
    onMatchFound(handleMatchFound);
    onMatchTimeout(handleMatchTimeout);

    // Also listen directly on socket as backup
    console.log('Registering match-found listener directly on socket');
    socket.on('match-found', handleMatchFound);

    socket.on('match-searching', handleMatchSearching);
    socket.on('match-error', handleMatchError);
    socket.on('match-cancelled', handleMatchCancelled);

    console.log('All socket listeners registered');

    // Cleanup (IMPORTANT: Remove all listeners)
    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('match-found', handleMatchFound);
      socket.off('match-searching', handleMatchSearching);
      socket.off('match-error', handleMatchError);
      socket.off('match-cancelled', handleMatchCancelled);
    };
  }, [socket, router]);

  const handleCancel = () => {
    if (socket) {
      console.log('Cancelling match search...');
      socket.emit('cancel-matching');
    }
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Animated Circle */}
      <Animated.View
        style={[
          styles.circle,
          {
            transform: [{ scale: pulseAnim }],
            backgroundColor: theme.colors.primary + '20',
            borderColor: theme.colors.primary,
          },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              backgroundColor: theme.colors.primary + '40',
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Animated.View>

      {/* Text */}
      <Text
        style={[
          styles.title,
          { color: theme.colors.text, marginTop: theme.spacing.xxxl },
          theme.typography.heading,
        ]}
      >
        Finding a match...
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: theme.colors.textSecondary, marginTop: theme.spacing.md },
          theme.typography.body,
        ]}
      >
        Please wait while we connect you with someone
      </Text>

      {/* Timer */}
      <Text
        style={[
          styles.timer,
          { color: theme.colors.textMuted, marginTop: theme.spacing.lg },
          theme.typography.caption,
        ]}
      >
        {searchTime}s
      </Text>

      {/* Cancel Button */}
      <Button
        title="Cancel"
        onPress={handleCancel}
        variant="outline"
        style={{ marginTop: theme.spacing.xxxl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  timer: {
    fontSize: 18,
    fontWeight: '500',
  },
});