import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/common/Button';

export default function TimeoutScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const handleTryAgain = () => {
    router.replace('/matching/searching');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.colors.warning + '20',
            borderRadius: theme.borderRadius.full,
          },
        ]}
      >
        <Ionicons name="time-outline" size={64} color={theme.colors.warning} />
      </View>

      {/* Text */}
      <Text
        style={[
          styles.title,
          { color: theme.colors.text, marginTop: theme.spacing.xxl },
          theme.typography.heading,
        ]}
      >
        No Match Found
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: theme.colors.textSecondary, marginTop: theme.spacing.md },
          theme.typography.body,
        ]}
      >
        We couldn't find anyone available right now. Please try again later.
      </Text>

      {/* Buttons */}
      <View style={[styles.buttonContainer, { marginTop: theme.spacing.xxxl }]}>
        <Button
          title="Try Again"
          onPress={handleTryAgain}
          gradient
          fullWidth
        />
        <Button
          title="Go Home"
          onPress={handleGoHome}
          variant="outline"
          fullWidth
          style={{ marginTop: theme.spacing.lg }}
        />
      </View>
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
  iconContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  buttonContainer: {
    width: '100%',
  },
});