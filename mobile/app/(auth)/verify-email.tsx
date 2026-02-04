import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';

export default function VerifyEmailScreen() {
  const { theme } = useTheme();
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!isLoaded) {
      Alert.alert('Loading', 'Please wait a moment and try again.');
      return;
    }

    if (!code || code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      // Verify the email address
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        // Set the active session
        await setActive({ session: completeSignUp.createdSessionId });
        
        Alert.alert(
          'Success!',
          'Your account has been created successfully.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        Alert.alert('Verification incomplete', 'Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);

      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];

        switch (error.code) {
          case 'form_code_incorrect':
            Alert.alert('Incorrect Code', 'The verification code is incorrect. Please try again.');
            break;
          case 'verification_expired':
            Alert.alert('Code Expired', 'The verification code has expired. Please request a new one.');
            break;
          default:
            Alert.alert('Error', error.longMessage || error.message || 'Verification failed.');
        }
      } else {
        Alert.alert('Verification Failed', 'Unable to verify your email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;

    setResending(true);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (err: any) {
      console.error('Resend error:', err);
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { marginTop: theme.spacing.huge }]}>
          <LinearGradient
            colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconGradient, { borderRadius: theme.borderRadius.full }]}
          >
            <Ionicons name="mail" size={48} color="#FFFFFF" />
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
          Verify Your Email
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.md },
            theme.typography.body,
          ]}
        >
          We've sent a verification code to{'\n'}
          <Text style={{ fontWeight: '600' }}>{email}</Text>
        </Text>

        {/* Code Input */}
        <View style={[styles.form, { marginTop: theme.spacing.xxxl }]}>
          <Input
            label="Verification Code"
            placeholder="Enter 6-digit code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            leftIcon="key-outline"
            autoFocus
          />

          <Button
            title="Verify Email"
            onPress={handleVerify}
            loading={loading}
            fullWidth
            gradient
            style={{ marginTop: theme.spacing.md }}
          />

          {/* Resend Code */}
          <View style={[styles.resendContainer, { marginTop: theme.spacing.xl }]}>
            <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
              Didn't receive the code?{' '}
            </Text>
            <Button
              title={resending ? 'Sending...' : 'Resend'}
              onPress={handleResendCode}
              variant="ghost"
              size="small"
              loading={resending}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
  },
});