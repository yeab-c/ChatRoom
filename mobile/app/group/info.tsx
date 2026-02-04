import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Avatar } from '../../src/components/common/Avatar';
import { Button } from '../../src/components/common/Button';

export default function GroupInfoScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { groupId } = useLocalSearchParams();

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock group data
  const [groupMembers, setGroupMembers] = useState([
    { id: '1', name: 'You', avatar: '', isOnline: true },
    { id: '2', name: 'Alex Chen', avatar: '', isOnline: true },
    { id: '3', name: 'Sarah Johnson', avatar: '', isOnline: false },
    { id: '4', name: 'Mike Rodriguez', avatar: '', isOnline: true },
    { id: '5', name: 'Emma Wilson', avatar: '', isOnline: false },
  ]);

  // Mock available users to add (users not in the group)
  const availableUsers = [
    { id: '6', name: 'John Smith', avatar: '', isOnline: true },
    { id: '7', name: 'Lisa Anderson', avatar: '', isOnline: false },
    { id: '8', name: 'David Brown', avatar: '', isOnline: true },
    { id: '9', name: 'Maria Garcia', avatar: '', isOnline: true },
    { id: '10', name: 'James Taylor', avatar: '', isOnline: false },
  ];

  const group = {
    id: groupId as string,
    name: 'Weekend Hangout',
    avatar: '',
    creatorId: '1',
    members: groupMembers,
  };

  const isCreator = group.creatorId === user?.id;

  const filteredAvailableUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !groupMembers.some((member) => member.id === user.id)
  );

  const handleAddMembers = () => {
    setShowAddMemberModal(true);
  };

  const handleAddMember = (userId: string, userName: string) => {
    const userToAdd = availableUsers.find((u) => u.id === userId);
    if (userToAdd) {
      setGroupMembers([...groupMembers, userToAdd]);
      Alert.alert('Member Added', `${userName} has been added to the group.`);
      setSearchQuery('');
    }
  };

  const handleStartChat = (memberId: string, memberName: string) => {
    // Can't chat with yourself
    if (memberId === user?.id) {
      Alert.alert('Cannot Start Chat', 'You cannot start a chat with yourself.');
      return;
    }

    Alert.alert('Start Chat', `Start a chat with ${memberName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start Chat',
        onPress: () => {
          router.push({
            pathname: '/chat/[id]',
            params: { id: `chat_${memberId}` },
          });
        },
      },
    ]);
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setGroupMembers(groupMembers.filter((member) => member.id !== memberId));
            Alert.alert('Removed', `${memberName} has been removed from the group.`);
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
        onPress: () => {
          Alert.alert('Left Group', 'You have left the group.');
          router.replace('/(tabs)/chats');
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
          onPress: () => {
            Alert.alert('Deleted', 'Group has been deleted.');
            router.replace('/(tabs)/chats');
          },
        },
      ]
    );
  };

  const renderMember = ({ item }: { item: any }) => {
    const isCurrentUser = item.id === user?.id;

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
        onPress={() => !isCurrentUser && handleStartChat(item.id, item.name)}
        disabled={isCurrentUser}
        activeOpacity={isCurrentUser ? 1 : 0.7}
      >
        <Avatar uri={item.avatar} name={item.name} size="medium" online={item.isOnline} />
        <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
          <Text style={[styles.memberName, { color: theme.colors.text }]}>
            {item.name} {item.id === group.creatorId && '(Admin)'}
          </Text>
          <Text style={[styles.memberStatus, { color: theme.colors.textMuted }]}>
            {item.isOnline ? 'Online' : 'Offline'}
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
                handleRemoveMember(item.id, item.name);
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
          {group.members.length} members
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