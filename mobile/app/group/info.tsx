import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Avatar } from '../../src/components/common/Avatar';
import { Button } from '../../src/components/common/Button';
import { chatService } from '../../src/services/api';
import groupService from '../../src/services/api/group';

export default function GroupInfoScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Fetch group details
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const data = await groupService.getGroupById(id as string);
        setGroup(data);
      } catch (error: any) {
        Alert.alert('Error', 'Failed to load group details');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [id]);

  // Fetch available users when modal opens
  useEffect(() => {
    if (showAddMemberModal) {
      const fetchAvailableUsers = async () => {
        try {
          // Get user's connections (saved chats)
          const response = await chatService.getChats(1, 100);
          const connections = response.chats.map((chat) => ({
            id: chat.otherUser.id,
            name: chat.otherUser.name,
            avatar: chat.otherUser.avatar || '',
            isOnline: chat.otherUser.isOnline || false,
          }));

          // Filter out users already in the group
          const memberIds = group?.members.map((m: any) => m.userId) || [];
          const available = connections.filter((c) => !memberIds.includes(c.id));
          setAvailableUsers(available);
        } catch (error) {
          console.error('Failed to load available users:', error);
          Alert.alert('Error', 'Failed to load available users');
        }
      };

      fetchAvailableUsers();
    }
  }, [showAddMemberModal, group]);

  if (loading || !group) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isCreator = group.creatorId === user?.id;

  const filteredAvailableUsers = availableUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMembers = () => {
    if (group.memberCount >= 10) {
      Alert.alert('Limit Reached', 'Groups can have a maximum of 10 members');
      return;
    }
    setShowAddMemberModal(true);
  };

  const handleAddMember = async (userId: string, userName: string) => {
    try {
      await groupService.addMember(group.id, userId);
      Alert.alert('Success', `${userName} has been added to the group`);
      
      // Refresh group data
      const updatedGroup = await groupService.getGroupById(group.id);
      setGroup(updatedGroup);
      setSearchQuery('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleStartChat = async (memberId: string, memberName: string) => {
    if (memberId === user?.id) {
      Alert.alert('Cannot Start Chat', 'You cannot start a chat with yourself');
      return;
    }

    try {
      const result = await chatService.createGroupMemberChat({
        otherUserId: memberId,
        groupId: group.id,
      });

      router.push({
        pathname: '/chat/[id]',
        params: {
          id: result.chatId,
          otherUser: JSON.stringify(result.otherUser),
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to start chat');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.removeMember(group.id, memberId);
              Alert.alert('Success', `${memberName} has been removed`);
              
              // Refresh group data
              const updatedGroup = await groupService.getGroupById(group.id);
              setGroup(updatedGroup);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await groupService.leaveGroup(group.id, user!.id);
            Alert.alert('Success', 'You have left the group');
            router.replace('/(tabs)/chats');
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to leave group');
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.deleteGroup(group.id);
              Alert.alert('Success', 'Group has been deleted');
              router.replace('/(tabs)/chats');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }: { item: any }) => {
    const isCurrentUser = item.userId === user?.id;
    const memberUser = item.user;

    return (
      <TouchableOpacity
        style={[
          styles.memberItem,
          {
            backgroundColor: theme.colors.surface,
            padding: theme.spacing.lg,
            marginHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.sm,
            borderRadius: theme.borderRadius.md,
          },
        ]}
        onPress={() => !isCurrentUser && handleStartChat(item.userId, memberUser.name)}
        disabled={isCurrentUser}
        activeOpacity={isCurrentUser ? 1 : 0.7}
      >
        <Avatar uri={memberUser.avatar} name={memberUser.name} size="medium" online={memberUser.isOnline} />
        <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
          <Text style={[styles.memberName, { color: theme.colors.text }]}>
            {memberUser.name} {item.role === 'admin' && '(Admin)'}
          </Text>
          <Text style={[styles.memberStatus, { color: theme.colors.textMuted }]}>
            {memberUser.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {!isCurrentUser && (
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={theme.colors.primary}
              style={{ marginRight: 12 }}
            />
          )}
          {isCreator && !isCurrentUser && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveMember(item.userId, memberUser.name);
              }}
            >
              <Ionicons name="remove-circle-outline" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAvailableUser = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.memberItem,
        {
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.lg,
          marginHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
          borderRadius: theme.borderRadius.md,
        },
      ]}
      onPress={() => handleAddMember(item.id, item.name)}
    >
      <Avatar uri={item.avatar} name={item.name} size="medium" online={item.isOnline} />
      <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
        <Text style={[styles.memberName, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.memberStatus, { color: theme.colors.textMuted }]}>
          {item.isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
      <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
    </TouchableOpacity>
  );

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Group Info</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Group Info */}
      <View style={[styles.groupSection, { padding: theme.spacing.xl }]}>
        <Avatar uri={group.avatar} name={group.name} size="xlarge" />
        <Text
          style={[
            styles.groupName,
            { color: theme.colors.text, marginTop: theme.spacing.lg },
            theme.typography.heading,
          ]}
        >
          {group.name}
        </Text>
        <Text
          style={[
            styles.memberCount,
            { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
          ]}
        >
          {group.memberCount} members
        </Text>

        {isCreator && (
          <Button
            title="Add Members"
            onPress={handleAddMembers}
            variant="outline"
            size="small"
            style={{ marginTop: theme.spacing.lg }}
          />
        )}
      </View>

      {/* Members List */}
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.textMuted,
              paddingHorizontal: theme.spacing.lg,
              marginTop: theme.spacing.lg,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          MEMBERS • Tap to start chat
        </Text>
        <FlatList
          data={group.members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Actions */}
      <View style={[styles.actions, { padding: theme.spacing.lg }]}>
        {!isCreator ? (
          <Button
            title="Leave Group"
            onPress={handleLeaveGroup}
            variant="outline"
            fullWidth
            style={{ borderColor: theme.colors.error }}
            textStyle={{ color: theme.colors.error }}
          />
        ) : (
          <Button
            title="Delete Group"
            onPress={handleDeleteGroup}
            variant="outline"
            fullWidth
            style={{ borderColor: theme.colors.error }}
            textStyle={{ color: theme.colors.error }}
          />
        )}
      </View>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor: theme.colors.border,
                  paddingBottom: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Members</Text>
              <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              <Ionicons name="search" size={20} color={theme.colors.textMuted} />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: theme.colors.text, marginLeft: theme.spacing.sm },
                ]}
                placeholder="Search users..."
                placeholderTextColor={theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Available Users List */}
            <FlatList
              data={filteredAvailableUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderAvailableUser}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                    {searchQuery ? 'No users found' : 'No available users to add'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  groupSection: {
    alignItems: 'center',
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
  },
  memberCount: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '80%',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
});