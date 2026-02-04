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
import { useSignUp } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';

export default function SignupScreen() {
  const { theme } = useTheme();
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateEmail = (email: string) => {
    const emailRegex = /@bitscollege\.edu\.et$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return {
      isValid: hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && password.length >= 8,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      hasMinLength: password.length >= 8,
    };
  };

  const handleSignup = async () => {
    if (!isLoaded) {
      Alert.alert('Please Wait', 'Loading...');
      return;
    }

    setErrors({ name: '', email: '', password: '', confirmPassword: '' });

    let hasErrors = false;
    const newErrors = { name: '', email: '', password: '', confirmPassword: '' };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      hasErrors = true;
    }

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
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        const missingRequirements = [];
        if (!passwordValidation.hasMinLength) missingRequirements.push('at least 8 characters');
        if (!passwordValidation.hasUpperCase) missingRequirements.push('1 uppercase letter');
        if (!passwordValidation.hasLowerCase) missingRequirements.push('1 lowercase letter');
        if (!passwordValidation.hasNumber) missingRequirements.push('1 number');
        if (!passwordValidation.hasSpecialChar) missingRequirements.push('1 special character');
        
        newErrors.password = `Password must contain: ${missingRequirements.join(', ')}`;
        hasErrors = true;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      hasErrors = true;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const signUpAttempt = await signUp.create({
        emailAddress: email.trim().toLowerCase(),
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
      });

      await signUpAttempt.prepareEmailAddressVerification({ strategy: 'email_code' });

      Alert.alert(
        'Verification Required',
        'A verification code has been sent to your email. Please verify your email to continue.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push({
                pathname: '/(auth)/verify-email',
                params: { email: email.trim().toLowerCase() },
              });
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Signup error:', err);

      if (err.errors && err.errors.length > 0) {
        const error = err.errors[0];

        switch (error.code) {
          case 'form_identifier_exists':
            Alert.alert('Account Exists', 'An account with this email already exists.');
            break;
          case 'form_password_pwned':
            Alert.alert('Weak Password', 'This password has been found in a data breach. Please choose a stronger password.');
            break;
          case 'form_param_format_invalid':
            Alert.alert('Invalid Format', 'Please check your email format.');
            break;
          case 'form_password_length_too_short':
            Alert.alert('Password Too Short', 'Password must be at least 8 characters.');
            break;
          default:
            Alert.alert('Signup Failed', error.longMessage || error.message || 'Please try again.');
        }
      } else {
        Alert.alert('Signup Failed', 'Unable to create account. Please try again.');
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
            { color: theme.colors.text, marginTop: theme.spacing.xl },
            theme.typography.heading,
          ]}
        >
          Create Account
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
            theme.typography.bodySmall,
          ]}
        >
          Join ChatRoom and meet new people
        </Text>

        {/* Form */}
        <View style={[styles.form, { marginTop: theme.spacing.xxl }]}>
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            leftIcon="person-outline"
            error={errors.name}
            autoComplete="name"
          />

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
            placeholder="Must include: A-Z, a-z, 0-9, special char"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.password}
            textContentType="newPassword"
            autoComplete="password-new"
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.confirmPassword}
            textContentType="newPassword"
            autoComplete="password-new"
          />

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            fullWidth
            gradient
            style={{ marginTop: theme.spacing.md }}
          />
        </View>

        {/* Login Link */}
        <View style={[styles.footer, { marginTop: theme.spacing.xl }]}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Text style={[styles.link, { color: theme.colors.primary }]}>Login</Text>
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
    paddingVertical: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 40,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
});
