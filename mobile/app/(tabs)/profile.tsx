import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const hobbies = user?.hobbies?.split(',').map(h => h.trim()).filter(Boolean) || [];

  const handleEditProfile = () => {
    router.push('/settings/edit-profile');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
        <TouchableOpacity onPress={handleSettings}>
          <Ionicons name="settings-outline" size={26} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Avatar Section */}
        <View style={[styles.avatarSection, { paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xxl }]}>
          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={[styles.avatarImage, { borderRadius: 75 }]}
            />
          ) : (
            <LinearGradient
              colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.avatarGradient, { borderRadius: 75 }]}
            >
              <Text style={styles.avatarText}>
                {user?.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || '?'}
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Info Container */}
        <View style={[styles.infoContainer, { paddingHorizontal: theme.spacing.lg }]}>
          {/* Username */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md }]}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Username</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>{user?.name}</Text>
          </View>

          {/* Bio */}
          {user?.bio && (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md }]}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>Bio</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{user.bio}</Text>
            </View>
          )}

          {/* Gender & Age Row */}
          {(user?.gender || user?.age) && (
            <View style={[styles.row, { marginBottom: theme.spacing.md }]}>
              {user?.gender && (
                <View style={[styles.halfCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, flex: 1, marginRight: user?.age ? theme.spacing.sm : 0 }]}>
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>Gender</Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>{user.gender}</Text>
                </View>
              )}
              {user?.age && (
                <View style={[styles.halfCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, flex: 1, marginLeft: user?.gender ? theme.spacing.sm : 0 }]}>
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>Age</Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>{user.age}</Text>
                </View>
              )}
            </View>
          )}

          {/* Country */}
          {user?.country && (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md }]}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>Country</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{user.country}</Text>
            </View>
          )}

          {/* Hobbies */}
          {hobbies.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md }]}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>Hobbies</Text>
              <View style={[styles.hobbiesContainer, { marginTop: theme.spacing.sm }]}>
                {hobbies.map((hobby, index) => (
                  <View
                    key={index}
                    style={[
                      styles.hobbyChip,
                      {
                        backgroundColor: theme.colors.primary + '20',
                        borderRadius: theme.borderRadius.full,
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        marginRight: theme.spacing.sm,
                        marginBottom: theme.spacing.sm,
                      },
                    ]}
                  >
                    <Text style={[styles.hobbyText, { color: theme.colors.primary }]}>
                      {hobby}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Edit Profile Button */}
          <TouchableOpacity
            onPress={handleEditProfile}
            style={[
              styles.editButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.md,
                paddingVertical: theme.spacing.lg,
                marginTop: theme.spacing.lg,
              },
            ]}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarImage: {
    width: 150,
    height: 150,
  },
  avatarGradient: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: {
    fontSize: 60,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoContainer: {
    width: '100%',
  },
  card: {},
  row: {
    flexDirection: 'row',
  },
  halfCard: {},
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    lineHeight: 22,
  },
  hobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hobbyChip: {},
  hobbyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});