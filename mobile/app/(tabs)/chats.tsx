import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useSocket } from '../../src/context/SocketContext';
import { useChatListContext } from '../../src/context/ChatListContext';
import { ChatListItem } from '../../src/components/chat/ChatListItem';

export default function ChatsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);

  // Use shared chat list context
  const {
    chats,
    loading,
    refreshing,
    hasMore,
    refresh,
    loadMore,
    deleteChat,
    updateUserOnlineStatus,
  } = useChatListContext();

  const { 
    onNewMessage, 
    onUserOnline, 
    onUserOffline 
  } = useSocket();

  // Reset active chat and refresh when screen comes into focus
  // Useref to prevent multiple rapid refreshes
  const lastRefreshTime = React.useRef<number>(0);
  
  useFocusEffect(
    React.useCallback(() => {
      console.log('Chats screen focused');
      setActiveChat(null);
      
      // Only refresh if it's been more than 10 seconds since last refresh
      const now = Date.now();
      if (now - lastRefreshTime.current > 10000) {
        console.log('Refreshing chat list');
        lastRefreshTime.current = now;
        refresh();
      } else {
        console.log('⏭Skipping refresh (too soon)');
      }
    }, [])
  );

  // Filter chats based on search
  const filteredChats = searchQuery.trim() === ''
    ? chats
    : chats.filter((chat) =>
        chat.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );


  const handleCreateGroup = () => {
    router.push('/group/create');
  };

  const handleChatPress = (chatId: string, otherUser: any, isGroup?: boolean, groupId?: string) => {
    console.log('Opening chat:', chatId, 'isGroup:', isGroup);
    
    if (isGroup && groupId) {
      // Navigate to group chat
      router.push({
        pathname: '/group/[id]',
        params: { id: groupId },
      });
    } else {
      // Navigate to one-on-one chat
      setActiveChat(chatId);
      router.push({
        pathname: '/chat/[id]',
        params: { id: chatId, otherUser: JSON.stringify(otherUser) },
      });
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat(chatId);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const renderChatItem = ({ item }: { item: any }) => {
    const isGroup = !item.otherUser;
    return (
      <ChatListItem 
        chat={item}
        onPress={() => handleChatPress(
          item.chatId, 
          item.otherUser, 
          isGroup,
          isGroup ? item.id : undefined
        )}
        onDelete={() => handleDeleteChat(item.chatId)}
      />
    );
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
      {loading && chats.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
            Loading chats...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.chatId}
          renderItem={renderChatItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
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
          }
          ListFooterComponent={
            hasMore && !loading ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});