import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../src/context/ThemeContext';
import { Avatar } from '../../src/components/common/Avatar';
import { Button } from '../../src/components/common/Button';
import { userService } from '../../src/services/api';

interface BlockedUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  blockedAt: Date;
}

export default function BlockedUsersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getBlockedUsers();
      
      // Backend returns array directly with structure: { id, name, avatar, blockedAt }
      const formattedUsers = response.map((blocked: any) => ({
        id: blocked.id,
        name: blocked.name,
        email: '', // Email not returned by backend
        avatar: blocked.avatar || '',
        blockedAt: new Date(blocked.blockedAt),
      }));
      
      setBlockedUsers(formattedUsers);
    } catch (error: any) {
      console.error('Failed to load blocked users:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBlockedUsers();
    setRefreshing(false);
  };

  const handleUnblock = (userId: string, userName: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await userService.unblockUser(userId);
              
              // Remove from local state
              setBlockedUsers(blockedUsers.filter((u) => u.id !== userId));
              
              Alert.alert('Success', `${userName} has been unblocked`);
            } catch (error: any) {
              console.error('Failed to unblock user:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to unblock user');
            }
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
        <Text style={[styles.blockedTime, { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }]}>
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

  if (loading) {
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

        {/* Loading */}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
            Loading blocked users...
          </Text>
        </View>
      </View>
    );
  }

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
        contentContainerStyle={{ paddingTop: theme.spacing.lg, paddingBottom: 20 }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: theme.spacing.lg }]}>
              No blocked users
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textMuted, marginTop: theme.spacing.sm }]}>
              Users you block will appear here
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
  userEmail: {
    fontSize: 12,
  },
  blockedTime: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});