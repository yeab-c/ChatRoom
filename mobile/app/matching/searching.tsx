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
import { Button } from '../../src/components/common/Button';

export default function SearchingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
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

    // Mock: Find match after 3-5 seconds
    const matchTimeout = setTimeout(() => {
      // Simulate finding a match
      router.replace('/matching/temp-chat');
    }, Math.random() * 2000 + 3000);

    // Timeout after 30 seconds
    const timeoutTimer = setTimeout(() => {
      router.replace('/matching/timeout');
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(matchTimeout);
      clearTimeout(timeoutTimer);
    };
  }, []);

  const handleCancel = () => {
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