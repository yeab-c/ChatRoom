import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useMatching } from '../../src/hooks/useMatching';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [scaleAnim] = useState(new Animated.Value(1));

  const {
    searching,
    matched,
    chatId,
    otherUser,
    loading,
    startMatch,
    cancelMatch,
    getSearchTime,
  } = useMatching();

  const [searchTime, setSearchTime] = useState(0);

  // Update search timer
  useEffect(() => {
    if (searching) {
      const interval = setInterval(() => {
        setSearchTime(getSearchTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [searching]);

  // Navigate to TEMP CHAT when matched
  useEffect(() => {
    console.log('Navigation useEffect triggered');
    console.log('  - matched:', matched);
    console.log('  - chatId:', chatId);
    console.log('  - otherUser:', otherUser);

    if (matched && chatId && otherUser) {
      console.log('Match found! Navigating to temp-chat...');
      console.log('Chat ID:', chatId);
      console.log('Other user:', otherUser);

      router.replace({
        pathname: '/matching/temp-chat',
        params: {
          id: chatId,
          otherUser: JSON.stringify(otherUser),
        },
      });
    } else {
      console.log('Not navigating - conditions not met');
    }
  }, [matched, chatId, otherUser, router]);

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

  const handleStartMatch = async () => {
    if (searching) {
      // Cancel if already searching
      await cancelMatch();
    } else {
      // Start new match
      await startMatch();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Logo */}
      <View style={[styles.logoContainer, { marginTop: theme.spacing.huge }]}>
        <Image
          source={require('../../assets/images/chatroom.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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
        {searching
          ? 'Searching for someone to chat with...'
          : 'Connect with random people from Bits College'
        }
      </Text>

      {/* Search Timer */}
      {searching && (
        <Text
          style={[
            styles.timerText,
            { color: theme.colors.primary, marginTop: theme.spacing.md },
          ]}
        >
          {Math.floor(searchTime / 60)}:{(searchTime % 60).toString().padStart(2, '0')}
        </Text>
      )}

      {/* Start/Cancel Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleStartMatch}
          activeOpacity={1}
          disabled={loading}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <LinearGradient
              colors={
                searching
                  ? ['#EF4444', '#DC2626'] // Red for cancel
                  : [theme.colors.gradientStart, theme.colors.gradientEnd]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startButton}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <>
                  {searching ? (
                    <>
                      <Text style={styles.startButtonIcon}>✕</Text>
                      <Text style={styles.startButtonSubtext}>Cancel</Text>
                    </>
                  ) : (
                    <Text style={styles.startButtonText}>Start</Text>
                  )}
                </>
              )}
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
        {searching
          ? 'Looking for available users...'
          : 'Tap to find someone to chat with'
        }
      </Text>

      {/* User Info */}
      {user && (
        <View style={[styles.userInfo, { marginTop: theme.spacing.xl }]}>
          <Text style={[styles.userInfoText, { color: theme.colors.textMuted }]}>
            Logged in as <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{user.name}</Text>
          </Text>
        </View>
      )}
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
    width: 160,
    height: 160,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
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
  startButtonIcon: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startButtonSubtext: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  infoText: {
    textAlign: 'center',
  },
  userInfo: {
    alignItems: 'center',
  },
  userInfoText: {
    fontSize: 14,
  },
});