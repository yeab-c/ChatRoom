import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Ionicons name="alert-circle-outline" size={80} color={theme.colors.textMuted} />
      <Text style={[styles.title, { color: theme.colors.text, marginTop: theme.spacing.xl }]}>
        Page Not Found
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm }]}>
        The page you're looking for doesn't exist.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace('/(tabs)')}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            marginTop: theme.spacing.xxl,
          },
        ]}
      >
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
