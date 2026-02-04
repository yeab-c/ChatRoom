import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Avatar } from '../../src/components/common/Avatar';
import { Button } from '../../src/components/common/Button';
import { chatService, groupService } from '../../src/services/api';

interface Connection {
  id: string;
  name: string;
  avatar: string;
}

export default function CreateGroupScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Fetch user's connections (saved chats)
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await chatService.getChats(1, 100);
        console.log('Fetched chats:', response);
        
        if (!response.chats || response.chats.length === 0) {
          console.log('No saved chats found');
          setConnections([]);
          return;
        }
        
        const uniqueUsers = response.chats.map((chat) => ({
          id: chat.otherUser.id,
          name: chat.otherUser.name,
          avatar: chat.otherUser.avatar || '',
        }));
        setConnections(uniqueUsers);
        console.log('Connections loaded:', uniqueUsers.length);
      } catch (error: any) {
        console.error('Failed to load connections:', error);
        console.error('Error message:', error.message);
        console.error('Error response:', error.response);
        console.error('Error data:', error.response?.data);
        
        const errorMessage = error.response?.data?.message 
          || error.message 
          || 'Failed to load connections. Please try again.';
        
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  const filteredConnections = connections.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      if (selectedUsers.length >= 9) {
        alert('Maximum 10 members (including you) allowed');
        return;
      }
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one person');
      return;
    }

    try {
      setCreating(true);
      const group = await groupService.createGroup({
        name: groupName.trim(),
        memberIds: selectedUsers,
      });

      Alert.alert('Success', 'Group created successfully');
      router.replace({
        pathname: '/group/[id]',
        params: { id: group.id },
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Connection }) => {
    const isSelected = selectedUsers.includes(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          {
            backgroundColor: theme.colors.surface,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.sm,
          },
        ]}
        onPress={() => toggleUser(item.id)}
      >
        <Avatar uri={item.avatar} name={item.name} size="medium" />
        <Text style={[styles.userName, { color: theme.colors.text, marginLeft: theme.spacing.md, flex: 1 }]}>
          {item.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    );
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
        <Text style={[styles.title, { color: theme.colors.text }]}>Create Group</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Group Name Input */}
      <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        <Text style={[styles.label, { color: theme.colors.textMuted, marginBottom: theme.spacing.sm }]}>
          Group Name
        </Text>
        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Enter group name..."
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.lg,
            },
          ]}
        />
      </View>

      {/* Selected Count */}
      <Text style={[styles.selectedCount, { color: theme.colors.textMuted, paddingHorizontal: theme.spacing.lg }]}>
        Selected: {selectedUsers.length} / 10
      </Text>

      {/* Search */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            marginHorizontal: theme.spacing.lg,
            marginVertical: theme.spacing.lg,
          },
        ]}
      >
        <Ionicons name="search" size={20} color={theme.colors.textMuted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search connections..."
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.searchInput, { color: theme.colors.text, marginLeft: theme.spacing.sm }]}
        />
      </View>

      {/* Connections List */}
      <Text style={[styles.sectionTitle, { color: theme.colors.textMuted, paddingHorizontal: theme.spacing.lg }]}>
        Your Connections
      </Text>
      <FlatList
        data={filteredConnections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { paddingVertical: 60 }]}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.text, marginTop: theme.spacing.lg }]}>
              {searchQuery ? 'No connections found' : 'No connections yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textMuted, marginTop: theme.spacing.sm, textAlign: 'center', paddingHorizontal: 40 }]}>
              {searchQuery 
                ? 'Try a different search term' 
                : 'Match with users and save chats to add them as connections'}
            </Text>
          </View>
        }
      />

      {/* Create Button */}
      <View style={{ padding: theme.spacing.lg }}>
        <Button
          title={creating ? 'Creating...' : `Create Group (${selectedUsers.length})`}
          onPress={handleCreate}
          gradient
          fullWidth
          disabled={selectedUsers.length === 0 || creating}
        />
      </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    fontSize: 16,
  },
  selectedCount: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
  },
});