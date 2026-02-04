import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Avatar } from '../../src/components/common/Avatar';
import { Button } from '../../src/components/common/Button';

interface Connection {
  id: string;
  name: string;
  avatar: string;
}

const MOCK_CONNECTIONS: Connection[] = [
  { id: '2', name: 'Alex Chen', avatar: '' },
  { id: '3', name: 'Sarah Johnson', avatar: '' },
  { id: '4', name: 'Mike Rodriguez', avatar: '' },
  { id: '5', name: 'Emma Wilson', avatar: '' },
  { id: '6', name: 'David Kim', avatar: '' },
];

export default function CreateGroupScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConnections = MOCK_CONNECTIONS.filter((c) =>
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

  const handleCreate = () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    if (selectedUsers.length === 0) {
      alert('Please select at least one person');
      return;
    }

    // TODO: Create group API call
    router.back();
  };

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
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}
      />

      {/* Create Button */}
      <View style={{ padding: theme.spacing.lg }}>
        <Button
          title={`Create Group (${selectedUsers.length})`}
          onPress={handleCreate}
          gradient
          fullWidth
          disabled={selectedUsers.length === 0}
        />
      </View>
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
});