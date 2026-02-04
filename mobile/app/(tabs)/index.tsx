import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleStartMatch = () => {
    // Navigate to matching screen
    router.push('/matching/searching');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Logo */}
      <View style={[styles.logoContainer, { marginTop: theme.spacing.huge }]}>
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.logo, { borderRadius: theme.borderRadius.xl }]}
        >
          <Text style={styles.logoIcon}>💬</Text>
        </LinearGradient>
      </View>

      {/* Title */}
      <Text
        style={[
          styles.title,
          { color: theme.colors.text, marginTop: theme.spacing.xxl },
          theme.typography.title,
        ]}
      >
        ChatRoom
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
          theme.typography.body,
        ]}
      >
        Connect with random people from around the world
      </Text>

      {/* Start Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleStartMatch}
          activeOpacity={1}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <LinearGradient
              colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>Start</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Info Text */}
      <Text
        style={[
          styles.infoText,
          { color: theme.colors.textMuted, marginTop: theme.spacing.xxl },
          theme.typography.bodySmall,
        ]}
      >
        Tap to find someone to chat with
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 60,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  buttonContainer: {
    marginTop: 80,
  },
  startButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  startButtonText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoText: {
    textAlign: 'center',
  },
});