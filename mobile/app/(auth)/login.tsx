import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateEmail = (email: string) => {
    const emailRegex = /@bitscollege\.edu\.et$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!isLoaded) {
      Alert.alert('Please Wait', 'Loading...');
      return;
    }

    setErrors({ email: '', password: '' });

    let hasErrors = false;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      hasErrors = true;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Must be a @bitscollege.edu.et email';
      hasErrors = true;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      hasErrors = true;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(tabs)');
      } else if (signInAttempt.status === 'needs_first_factor') {
        Alert.alert('Verification Required', 'Please complete two-factor authentication.');
      } else {
        Alert.alert('Sign-in Incomplete', 'Unable to complete sign-in. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);

      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];

        switch (error.code) {
          case 'form_identifier_not_found':
            Alert.alert('Account Not Found', 'No account exists with this email address.');
            break;
          case 'form_password_incorrect':
            Alert.alert('Incorrect Password', 'The password you entered is incorrect.');
            break;
          case 'form_param_format_invalid':
            Alert.alert('Invalid Format', 'Please check your email and password format.');
            break;
          case 'session_exists':
            router.replace('/(tabs)');
            break;
          case 'user_locked':
            Alert.alert('Account Locked', 'Your account has been locked. Please contact support.');
            break;
          default:
            Alert.alert('Login Failed', error.longMessage || error.message || 'Please try again.');
        }
      } else {
        Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={[styles.logoContainer]}>
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
          Connect with random people
        </Text>

        {/* Form */}
        <View style={[styles.form, { marginTop: theme.spacing.xxxl }]}>
          <Input
            label="Email"
            placeholder="your.email@bitscollege.edu.et"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Password"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.password}
            textContentType="password"
            autoComplete="password"
          />

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            gradient
            style={{ marginTop: theme.spacing.md }}
          />

          <Link href="/(auth)/forget-password" asChild>
            <Text style={[styles.forgotPassword, { color: theme.colors.primary, marginTop: theme.spacing.lg, textAlign: 'center' }]}>
              Forgot Password?
            </Text>
          </Link>
        </View>

        {/* Sign Up Link */}
        <View style={[styles.footer, { marginTop: theme.spacing.xl }]}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <Link href="/(auth)/signup" asChild>
            <Text style={[styles.link, { color: theme.colors.primary }]}>Create one</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center', // Center vertically
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 50,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
});