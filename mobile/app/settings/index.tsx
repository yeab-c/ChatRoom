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
    Alert.alert(
      'Logout', 
      'Are you sure you want to logout?', 
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/settings/edit-profile');
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

      {/* Account Section */}
      <View style={[styles.section, { marginTop: theme.spacing.lg }]}>
        <Text style={[styles.sectionTitle, { 
          color: theme.colors.textMuted, 
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
        }]}>
          ACCOUNT
        </Text>

        {/* Edit Profile */}
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
          onPress={handleEditProfile}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.sm },
              ]}
            >
              <Ionicons name="person-outline" size={24} color={theme.colors.text} />
            </View>
            <View style={{ marginLeft: theme.spacing.md }}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                Edit Profile
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textMuted }]}>
                Update your information
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Appearance Section */}
      <View style={[styles.section, { marginTop: theme.spacing.xl }]}>
        <Text style={[styles.sectionTitle, { 
          color: theme.colors.textMuted, 
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
        }]}>
          APPEARANCE
        </Text>

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
          activeOpacity={0.7}
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
                {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
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
      </View>

      {/* Privacy Section */}
      <View style={[styles.section, { marginTop: theme.spacing.xl }]}>
        <Text style={[styles.sectionTitle, { 
          color: theme.colors.textMuted, 
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
        }]}>
          PRIVACY
        </Text>

        {/* Blocked Users */}
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
      <View style={[styles.section, { marginTop: theme.spacing.xxxl, marginBottom: theme.spacing.xxxl }]}>
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

      {/* App Info */}
      <View style={[styles.appInfo, { 
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
      }]}>
        <Text style={[styles.appVersion, { color: theme.colors.textMuted, fontSize: 12 }]}>
          ChatRoom v1.0.0
        </Text>
        <Text style={[styles.appCopyright, { color: theme.colors.textMuted, fontSize: 10, marginTop: theme.spacing.xs }]}>
          © 2024 ChatRoom. All rights reserved.
        </Text>
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
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
  appInfo: {},
  appVersion: {},
  appCopyright: {},
});