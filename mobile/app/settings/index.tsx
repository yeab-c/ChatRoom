import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleBlockedUsers = () => {
    router.push('/settings/blocked-user');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: 60,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Settings Options */}
      <View style={[styles.section, { marginTop: theme.spacing.lg }]}>
        {/* Dark Mode */}
        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.lg,
              marginHorizontal: theme.spacing.lg,
            },
          ]}
          onPress={toggleTheme}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.sm },
              ]}
            >
              <Ionicons name="moon" size={24} color={theme.colors.text} />
            </View>
            <View style={{ marginLeft: theme.spacing.md }}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textMuted }]}>
                Switch to dark theme
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Blocked Users */}
        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.lg,
              marginHorizontal: theme.spacing.lg,
              marginTop: theme.spacing.md,
            },
          ]}
          onPress={handleBlockedUsers}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.sm },
              ]}
            >
              <Ionicons name="ban" size={24} color={theme.colors.text} />
            </View>
            <View style={{ marginLeft: theme.spacing.md }}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                Blocked Users
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textMuted }]}>
                Manage blocked users
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={[styles.section, { marginTop: theme.spacing.xxxl }]}>
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: theme.colors.error,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.lg,
              marginHorizontal: theme.spacing.lg,
            },
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          <Text style={[styles.logoutText, { marginLeft: theme.spacing.sm }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  section: {},
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});