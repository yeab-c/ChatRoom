import React, { useState, useEffect } from 'react';
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
import { ChatListItem } from '../../src/components/chat/ChatListItem';
import { ChatListItem as ChatListItemType } from '../../src/types';
import { formatDistanceToNow } from 'date-fns';

// Mock data
const MOCK_CHATS: ChatListItemType[] = [
  {
    chatId: 'group1',
    participants: ['1', '2', '3', '4', '5'],
    type: 'group',
    isTemporary: false,
    savedBy: [],
    isSaved: true,
    displayName: 'Weekend Hangout',
    displayAvatar: '',
    lastMessageText: 'Emma: See you all this Saturday!',
    lastMessageTime: '5m ago',
    unreadCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    chatId: 'group2',
    participants: ['1', '6', '7', '8'],
    type: 'group',
    isTemporary: false,
    savedBy: [],
    isSaved: true,
    displayName: 'Tech Talk',
    displayAvatar: '',
    lastMessageText: 'Mike: Check out this new framework',
    lastMessageTime: '1h ago',
    unreadCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    chatId: 'chat1',
    participants: ['1', '2'],
    type: 'permanent',
    isTemporary: false,
    savedBy: ['1', '2'],
    isSaved: true,
    displayName: 'Alex Chen',
    displayAvatar: '',
    lastMessageText: "That sounds great! Let's do it 🎉",
    lastMessageTime: '2m ago',
    unreadCount: 2,
    otherUser: {
      id: '2',
      clerkId: 'clerk_2',
      email: 'alex@bitscollege.edu.et',
      name: 'Alex Chen',
      avatar: '',
      isOnline: true,
      isSearching: false,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    chatId: 'chat2',
    participants: ['1', '3'],
    type: 'permanent',
    isTemporary: false,
    savedBy: ['1', '3'],
    isSaved: true,
    displayName: 'Sarah Johnson',
    displayAvatar: '',
    lastMessageText: 'See you tomorrow!',
    lastMessageTime: '1h ago',
    unreadCount: 0,
    otherUser: {
      id: '3',
      clerkId: 'clerk_3',
      email: 'sarah@bitscollege.edu.et',
      name: 'Sarah Johnson',
      avatar: '',
      isOnline: false,
      isSearching: false,
      lastSeen: new Date(Date.now() - 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function ChatsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatListItemType[]>(MOCK_CHATS);
  const [filteredChats, setFilteredChats] = useState<ChatListItemType[]>(MOCK_CHATS);

  // Filter chats when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter((chat) =>
        chat.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats]);

  const groupChats = filteredChats.filter((chat) => chat.type === 'group');
  const directChats = filteredChats.filter((chat) => chat.type !== 'group');

  const handleCreateGroup = () => {
    router.push('/group/create');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            paddingTop: 60,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.colors.text }, theme.typography.title]}>
            Chats
          </Text>
          <TouchableOpacity
            onPress={handleCreateGroup}
            style={[
              styles.createButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.md,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.sm,
              },
            ]}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={[styles.createButtonText, { marginLeft: theme.spacing.xs }]}>
              Group
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius.md,
              paddingHorizontal: theme.spacing.lg,
              marginTop: theme.spacing.lg,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search chats..."
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.searchInput,
              { color: theme.colors.text, marginLeft: theme.spacing.sm },
            ]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chat List */}
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {/* Groups Section */}
            {groupChats.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: theme.colors.textMuted,
                      paddingHorizontal: theme.spacing.lg,
                      paddingTop: theme.spacing.lg,
                      paddingBottom: theme.spacing.sm,
                    },
                  ]}
                >
                  GROUPS
                </Text>
                {groupChats.map((chat) => (
                  <ChatListItem key={chat.chatId} chat={chat} />
                ))}
              </>
            )}

            {/* Direct Messages Section */}
            {directChats.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: theme.colors.textMuted,
                      paddingHorizontal: theme.spacing.lg,
                      paddingTop: theme.spacing.lg,
                      paddingBottom: theme.spacing.sm,
                    },
                  ]}
                >
                  DIRECT MESSAGES
                </Text>
                {directChats.map((chat) => (
                  <ChatListItem key={chat.chatId} chat={chat} />
                ))}
              </>
            )}

            {/* Empty State */}
            {filteredChats.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textMuted} />
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary, marginTop: theme.spacing.lg },
                  ]}
                >
                  {searchQuery ? 'No chats found' : 'No chats yet'}
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: theme.colors.textMuted, marginTop: theme.spacing.sm }]}
                >
                  {searchQuery ? 'Try a different search' : 'Start a random match to begin chatting!'}
                </Text>
              </View>
            )}
          </>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
  },
});