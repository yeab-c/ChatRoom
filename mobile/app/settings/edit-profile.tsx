import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useImagePicker } from '../../src/hooks/useImagePicker';
import { userService } from '../../src/services/api';
import { Button } from '../../src/components/common/Button';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, updateUser, refreshUser } = useAuth();
  const router = useRouter();
  const { uploadProfilePicture, isUploading } = useImagePicker();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [country, setCountry] = useState(user?.country || '');
  const [hobbies, setHobbies] = useState(user?.hobbies || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleChangeAvatar = async () => {
    try {
      // Upload new avatar
      const imageUrl = await uploadProfilePicture(false);

      if (imageUrl) {
        setAvatar(imageUrl);
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      setIsSaving(true);

      // Prepare update data - only include fields with values
      const updateData: any = {
        name: name.trim(),
      };

      // Only add optional fields if they have values
      if (bio.trim()) updateData.bio = bio.trim();
      if (gender.trim()) updateData.gender = gender.trim();
      if (age) updateData.age = parseInt(age);
      if (country.trim()) updateData.country = country.trim();
      if (hobbies.trim()) updateData.hobbies = hobbies.trim();

      // Update profile via API
      const response = await userService.updateProfile(updateData);

      // Update avatar separately if changed
      if (avatar !== user?.avatar && avatar) {
        await userService.updateAvatar(avatar);
      }

      // Refresh user data from backend
      await refreshUser();

      Alert.alert('Success!', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
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
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handleChangeAvatar} disabled={isUploading}>
              {avatar ? (
                <View>
                  <Image
                    source={{ uri: avatar }}
                    style={[styles.avatarImage, { borderRadius: 60 }]}
                  />
                  {isUploading && (
                    <View style={styles.avatarOverlay}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
                    </View>
                  )}
                </View>
              ) : (
                <LinearGradient
                  colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.avatarGradient, { borderRadius: 60 }]}
                >
                  <Text style={styles.avatarText}>
                    {name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || '?'}
                  </Text>
                </LinearGradient>
              )}
              <View
                style={[
                  styles.editIcon,
                  {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.background,
                  },
                ]}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            {isUploading && (
              <Text style={[styles.uploadingText, { color: theme.colors.primary, marginTop: theme.spacing.sm }]}>
                Uploading...
              </Text>
            )}
          </View>

          {/* Form Fields */}
          <View style={[styles.field, { marginTop: theme.spacing.xl }]}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Username</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Username"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.lg,
                  marginTop: theme.spacing.sm,
                },
              ]}
            />
          </View>

          <View style={[styles.field, { marginTop: theme.spacing.lg }]}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Love to meet new people and explore different cultures! 🌍"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={200}
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.lg,
                  marginTop: theme.spacing.sm,
                  textAlignVertical: 'top',
                },
              ]}
            />
            <Text style={[styles.charCount, { color: theme.colors.textMuted, marginTop: theme.spacing.xs }]}>
              {bio.length}/200
            </Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginTop: theme.spacing.lg }]}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>Gender</Text>
              <TextInput
                value={gender}
                onChangeText={setGender}
                placeholder="Male"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.lg,
                    marginTop: theme.spacing.sm,
                  },
                ]}
              />
            </View>

            <View style={[styles.field, { flex: 1, marginTop: theme.spacing.lg, marginLeft: theme.spacing.md }]}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>Age</Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                placeholder="25"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="number-pad"
                maxLength={3}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.lg,
                    marginTop: theme.spacing.sm,
                  },
                ]}
              />
            </View>
          </View>

          <View style={[styles.field, { marginTop: theme.spacing.lg }]}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Country</Text>
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder="Ethiopia"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.lg,
                  marginTop: theme.spacing.sm,
                },
              ]}
            />
          </View>

          <View style={[styles.field, { marginTop: theme.spacing.lg }]}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>
              Hobbies (comma separated)
            </Text>
            <TextInput
              value={hobbies}
              onChangeText={setHobbies}
              placeholder="Travel, Music, Photography, Gaming"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.lg,
                  marginTop: theme.spacing.sm,
                },
              ]}
            />
          </View>

          {/* Save Button */}
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={isSaving}
            disabled={isUploading}
            gradient
            fullWidth
            style={{ marginTop: theme.spacing.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarImage: {
    width: 120,
    height: 120,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGradient: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  field: {},
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
  },
});