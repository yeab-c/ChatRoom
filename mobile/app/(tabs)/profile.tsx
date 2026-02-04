import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, refreshUser, logout } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  
  const [refreshing, setRefreshing] = useState(false);

  const hobbies = user?.hobbies?.split(',').map(h => h.trim()).filter(Boolean) || [];

  const handleEditProfile = () => {
    router.push('/settings/edit-profile');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleRefreshProfile = async () => {
    try {
      setRefreshing(true);
      await refreshUser();
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      Alert.alert('Error', 'Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

  const handleChangeProfilePicture = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose image source',
      [
        {
          text: 'Camera',
          onPress: () => uploadProfilePicture(true),
        },
        {
          text: 'Gallery',
          onPress: () => uploadProfilePicture(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const uploadProfilePicture = async (useCamera: boolean) => {
    try {
      setRefreshing(true);

      // Request permissions
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to continue');
        return;
      }

      // Pick image
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const imageUri = result.assets[0].uri;

      // Convert to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Update Clerk profile image
      if (!clerkUser) {
        throw new Error('User not authenticated');
      }

      await clerkUser.setProfileImage({ file: base64 });
      console.log('Clerk profile image updated');

      // Refresh user data to get new image URL
      await refreshUser();

      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile picture:', error);
      Alert.alert('Error', error.message || 'Failed to update profile picture');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
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

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  // Use Clerk's image URL (already synced in AuthContext)
  const avatarUrl = user.avatar || clerkUser?.imageUrl;

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
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={handleRefreshProfile}
            style={{ marginRight: theme.spacing.md }}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={theme.colors.text} />
            ) : (
              <Ionicons name="refresh-outline" size={26} color={theme.colors.text} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSettings}>
            <Ionicons name="settings-outline" size={26} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Avatar Section */}
        <View style={[styles.avatarSection, { paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xxl }]}>
          <TouchableOpacity 
            onPress={handleChangeProfilePicture}
            disabled={refreshing}
          >
            {avatarUrl ? (
              <View>
                <Image
                  source={{ uri: avatarUrl }}
                  style={[styles.avatarImage, { borderRadius: 75 }]}
                />
                <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </View>
              </View>
            ) : (
              <LinearGradient
                colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.avatarGradient, { borderRadius: 75 }]}
              >
                <Text style={styles.avatarText}>
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || '?'}
                </Text>
                <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </View>
              </LinearGradient>
            )}
          </TouchableOpacity>

          {/* Online Status */}
          <View style={[styles.onlineStatus, { marginTop: theme.spacing.md }]}>
            <View style={[
              styles.onlineDot,
              { backgroundColor: user.isOnline ? '#10B981' : '#6B7280' }
            ]} />
            <Text style={[styles.onlineText, { color: theme.colors.textMuted }]}>
              {user.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          
          {/* Info text about profile picture */}
          <Text style={[styles.clerkInfo, { color: theme.colors.textMuted, marginTop: theme.spacing.sm }]}>
            Tap camera icon to change profile picture
          </Text>
        </View>

        {/* Info Container */}
        <View style={[styles.infoContainer, { paddingHorizontal: theme.spacing.lg }]}>
          {/* Email */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md }]}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Email</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>{user.email}</Text>
          </View>

          {/* Username */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md }]}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Username</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>{user.name}</Text>
          </View>

          {/* Bio */}
          {user.bio && (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md }]}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>Bio</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{user.bio}</Text>
            </View>
          )}

          {/* Gender & Age Row */}
          {(user.gender || user.age) && (
            <View style={[styles.row, { marginBottom: theme.spacing.md }]}>
              {user.gender && (
                <View style={[styles.halfCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, flex: 1, marginRight: user.age ? theme.spacing.sm : 0 }]}>
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>Gender</Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>{user.gender}</Text>
                </View>
              )}
              {user.age && (
                <View style={[styles.halfCard, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, flex: 1, marginLeft: user.gender ? theme.spacing.sm : 0 }]}>
                  <Text style={[styles.label, { color: theme.colors.textMuted }]}>Age</Text>
                  <Text style={[styles.value, { color: theme.colors.text }]}>{user.age}</Text>
                </View>
              )}
            </View>
          )}

          {/* Country */}
          {user.country && (
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

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                paddingVertical: theme.spacing.lg,
                marginTop: theme.spacing.md,
                borderWidth: 1,
                borderColor: '#EF4444',
              },
            ]}
          >
            <Text style={[styles.logoutButtonText, { color: '#EF4444' }]}>Logout</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarImage: {
    width: 150,
    height: 150,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
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
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  onlineText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clerkInfo: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
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
  logoutButton: {
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});