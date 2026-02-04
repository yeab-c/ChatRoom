import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Avatar } from '../../src/components/common/Avatar';
import { Button } from '../../src/components/common/Button';
import { ImageViewer } from '../../src/components/common/ImageViewer';
import { userService, chatService } from '../../src/services/api';

export default function ChatInfoScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { chatId, otherUser: otherUserParam, fromGroup } = useLocalSearchParams();

  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const isFromGroup = fromGroup === 'true';

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Parse from params to get user ID
      if (otherUserParam) {
        const parsed = JSON.parse(otherUserParam as string);
        
        // Fetch full user details from backend
        try {
          const fullUserData = await userService.getUserById(parsed.id);
          setOtherUser(fullUserData);
        } catch (error) {
          console.error('Failed to fetch full user data, using params:', error);
          // Fallback to params data if API fails
          setOtherUser(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      Alert.alert('Error', 'Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${otherUser?.name}? You won't be able to message each other.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              setBlocking(true);
              await userService.blockUser(otherUser.id);
              Alert.alert('Blocked', `${otherUser.name} has been blocked.`);
              router.back();
            } catch (error) {
              console.error('Failed to block user:', error);
              Alert.alert('Error', 'Failed to block user');
            } finally {
              setBlocking(false);
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.prompt(
      'Report User',
      `Why are you reporting ${otherUser?.name}? Please provide details (minimum 10 characters).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason?.trim() || reason.trim().length < 10) {
              Alert.alert('Error', 'Please provide a reason with at least 10 characters');
              return;
            }
            
            try {
              await userService.reportUser(otherUser.id, reason.trim(), chatId as string);
              Alert.alert(
                'Reported', 
                'Thank you for reporting. We will review this user. If they receive 5 reports, they will be automatically banned for 24 hours.'
              );
              router.back();
            } catch (error: any) {
              console.error('Failed to report user:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to report user');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const handleDeleteChat = async () => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await chatService.deleteChat(chatId as string);
              Alert.alert('Deleted', 'Chat has been deleted.');
              router.replace('/(tabs)/chats');
            } catch (error) {
              console.error('Failed to delete chat:', error);
              Alert.alert('Error', 'Failed to delete chat');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleStartChat = async () => {
    try {
      setStartingChat(true);
      
      // Create or get existing chat with this group member
      const result = await chatService.createGroupMemberChat({
        otherUserId: otherUser.id,
        groupId: chatId as string,
      });
      
      // Navigate to the chat
      router.replace({
        pathname: '/chat/[id]',
        params: { id: result.chatId },
      });
    } catch (error: any) {
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 'Failed to start chat';
      Alert.alert('Cannot Start Chat', errorMessage);
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
          Loading user info...
        </Text>
      </View>
    );
  }

  if (!otherUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.text }}>User not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="outline"
          style={{ marginTop: theme.spacing.lg }}
        />
      </View>
    );
  }

  const hobbies = otherUser.hobbies?.split(',').filter(Boolean) || [];

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
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Contact Info</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={[styles.profileSection, { padding: theme.spacing.xl }]}>
          <Avatar 
            uri={otherUser.avatar} 
            name={otherUser.name} 
            size="xlarge" 
            online={otherUser.isOnline}
            onPress={() => otherUser.avatar && setSelectedImage(otherUser.avatar)}
          />
          <Text
            style={[
              styles.name,
              { color: theme.colors.text, marginTop: theme.spacing.lg },
              theme.typography.heading,
            ]}
          >
            {otherUser.name}
          </Text>
          <Text style={[styles.email, { color: theme.colors.textMuted, marginTop: theme.spacing.xs }]}>
            {otherUser.email}
          </Text>
          {otherUser.bio && (
            <Text
              style={[
                styles.bio,
                { color: theme.colors.textSecondary, marginTop: theme.spacing.md },
              ]}
            >
              {otherUser.bio}
            </Text>
          )}
        </View>

        {/* Details */}
        <View style={[styles.section, { marginTop: theme.spacing.lg }]}>
          {otherUser.gender && (
            <View
              style={[
                styles.detailItem,
                {
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.lg,
                  marginHorizontal: theme.spacing.lg,
                  marginBottom: theme.spacing.sm,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
            >
              <Ionicons name="person-outline" size={20} color={theme.colors.textMuted} />
              <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Gender</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{otherUser.gender}</Text>
              </View>
            </View>
          )}

          {otherUser.age && (
            <View
              style={[
                styles.detailItem,
                {
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.lg,
                  marginHorizontal: theme.spacing.lg,
                  marginBottom: theme.spacing.sm,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} />
              <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Age</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{otherUser.age}</Text>
              </View>
            </View>
          )}

          {otherUser.country && (
            <View
              style={[
                styles.detailItem,
                {
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.lg,
                  marginHorizontal: theme.spacing.lg,
                  marginBottom: theme.spacing.sm,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
            >
              <Ionicons name="location-outline" size={20} color={theme.colors.textMuted} />
              <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Country</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{otherUser.country}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Hobbies */}
        {hobbies.length > 0 && (
          <View style={[styles.section, { marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.lg }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted, marginBottom: theme.spacing.sm }]}>
              HOBBIES
            </Text>
            <View style={styles.hobbiesContainer}>
              {hobbies.map((hobby: string, index: number) => (
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
                  <Text style={[styles.hobbyText, { color: theme.colors.primary }]}>{hobby.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={[styles.actions, { padding: theme.spacing.lg, marginTop: theme.spacing.xl }]}>
          {isFromGroup && (
            <Button
              title="Start Chat"
              onPress={handleStartChat}
              variant="primary"
              fullWidth
              disabled={startingChat}
              style={{ marginBottom: theme.spacing.md }}
            />
          )}
          <Button
            title="Block User"
            onPress={handleBlock}
            variant="outline"
            fullWidth
            disabled={blocking}
            style={{ marginBottom: theme.spacing.md }}
          />
          <Button
            title="Report User"
            onPress={handleReport}
            variant="outline"
            fullWidth
            style={{ marginBottom: theme.spacing.md }}
          />
          {!isFromGroup && (
            <Button
              title="Delete Chat"
              onPress={handleDeleteChat}
              variant="outline"
              fullWidth
              disabled={deleting}
              style={{ borderColor: theme.colors.error }}
              textStyle={{ color: theme.colors.error }}
            />
          )}
        </View>
      </ScrollView>

      {/* Image Viewer */}
      {selectedImage && (
        <ImageViewer
          visible={!!selectedImage}
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
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
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
  },
  profileSection: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  email: {
    fontSize: 14,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  section: {},
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
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
  actions: {},
});