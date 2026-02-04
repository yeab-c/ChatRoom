import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../src/context/ThemeContext';
import { Avatar } from '../../src/components/common/Avatar';
import { Button } from '../../src/components/common/Button';

interface BlockedUser {
  id: string;
  name: string;
  avatar: string;
  blockedAt: Date;
}

const MOCK_BLOCKED: BlockedUser[] = [
  {
    id: '1',
    name: 'SpamUser123',
    avatar: '',
    blockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    name: 'RudeUser',
    avatar: '',
    blockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

export default function BlockedUsersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(MOCK_BLOCKED);

  const handleUnblock = (userId: string, userName: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: () => {
            setBlockedUsers(blockedUsers.filter((u) => u.id !== userId));
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View
      style={[
        styles.userItem,
        {
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.lg,
          marginHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.md,
          borderRadius: theme.borderRadius.md,
        },
      ]}
    >
      <Avatar uri={item.avatar} name={item.name} size="medium" />
      <View style={[styles.userInfo, { marginLeft: theme.spacing.md, flex: 1 }]}>
        <Text style={[styles.userName, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.blockedTime, { color: theme.colors.textMuted }]}>
          Blocked {formatDistanceToNow(item.blockedAt, { addSuffix: true })}
        </Text>
      </View>
      <Button
        title="Unblock"
        onPress={() => handleUnblock(item.id, item.name)}
        variant="outline"
        size="small"
      />
    </View>
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
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Blocked Users</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* List */}
      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: theme.spacing.lg }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: theme.spacing.lg }]}>
              No blocked users
            </Text>
          </View>
        }
      />
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {},
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  blockedTime: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
  },
});