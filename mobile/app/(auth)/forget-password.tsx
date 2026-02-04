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
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /@bitscollege\.edu\.et$/;
    return emailRegex.test(email);
  };

  const handleSendCode = async () => {
    if (!isLoaded) {
      Alert.alert('Please Wait', 'Loading...');
      return;
    }

    if (!email || !validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid @bitscollege.edu.et email address.');
      return;
    }

    setLoading(true);

    try {
      // Request password reset code from Clerk
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim().toLowerCase(),
      });

      Alert.alert(
        'Code Sent',
        'A password reset code has been sent to your email.',
        [{ text: 'OK', onPress: () => setStep('code') }]
      );
    } catch (err: any) {
      console.error('Password reset error:', err);
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your email.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      // Reset password with Clerk
      const result = await signIn?.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });

      if (result?.status === 'complete') {
        Alert.alert(
          'Success!',
          'Your password has been reset successfully. Please login with your new password.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to reset password. Please try again.');
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
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { marginTop: theme.spacing.huge }]}>
          <LinearGradient
            colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconGradient, { borderRadius: theme.borderRadius.full }]}
          >
            <Ionicons name="key" size={48} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            { color: theme.colors.text, marginTop: theme.spacing.xxl },
            theme.typography.heading,
          ]}
        >
          {step === 'email' ? 'Reset Password' : 'Enter Code'}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.md },
            theme.typography.body,
          ]}
        >
          {step === 'email'
            ? 'Enter your email to receive a reset code'
            : 'Enter the code sent to your email'}
        </Text>

        {/* Form */}
        <View style={[styles.form, { marginTop: theme.spacing.xxxl }]}>
          {step === 'email' ? (
            <>
              <Input
                label="Email"
                placeholder="your.email@bitscollege.edu.et"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
                autoFocus
              />

              <Button
                title="Send Reset Code"
                onPress={handleSendCode}
                loading={loading}
                fullWidth
                gradient
                style={{ marginTop: theme.spacing.md }}
              />
            </>
          ) : (
            <>
              <Input
                label="Reset Code"
                placeholder="Enter 6-digit code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                leftIcon="shield-checkmark-outline"
                autoFocus
              />

              <Input
                label="New Password"
                placeholder="New password (min 8 characters)"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                leftIcon="lock-closed-outline"
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
              />

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
                gradient
                style={{ marginTop: theme.spacing.md }}
              />

              <Button
                title="Resend Code"
                onPress={handleSendCode}
                variant="ghost"
                style={{ marginTop: theme.spacing.lg }}
              />
            </>
          )}

          {/* Back to Login */}
          <Button
            title="Back to Login"
            onPress={() => router.back()}
            variant="outline"
            style={{ marginTop: theme.spacing.xl }}
          />
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
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconGradient: {
    width: 100,
    height: 100,
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
  form: {
    width: '100%',
  },
});