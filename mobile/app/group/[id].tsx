import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Avatar } from '../../src/components/common/Avatar';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { MessageInput } from '../../src/components/chat/MessageInput';
import { TypingIndicator } from '../../src/components/chat/TypingIndicator';
import { ImageViewer } from '../../src/components/common/ImageViewer';
import { useGroup } from '../../src/hooks/useGroup';

export default function GroupChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    group,
    messages,
    loading,
    sending,
    isTyping,
    flatListRef,
    sendTextMessage,
    sendImageMessage,
  } = useGroup(id as string);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  const handleBack = () => {
    router.push('/(tabs)/chats');
  };

  const handleViewInfo = () => {
    router.push({
      pathname: '/group/info',
      params: { id },
    });
  };

  const handleViewProfile = (senderId: string, senderName: string) => {
    // Find the sender in group members to get full user data
    if (!group) return;
    
    const member = group.members.find((m: any) => m.userId === senderId);
    if (member) {
      router.push({
        pathname: '/chat/info',
        params: {
          chatId: group.mongoGroupId,
          otherUser: JSON.stringify(member.user),
          fromGroup: 'true',
        },
      });
    }
  };

  if (loading || !group) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            paddingTop: 50,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerCenter} onPress={handleViewInfo}>
          <Avatar uri={group.avatar} name={group.name} size="small" />
          <View style={{ marginLeft: theme.spacing.md }}>
            <Text style={[styles.headerName, { color: theme.colors.text }]}>
              {group.name}
            </Text>
            <Text style={[styles.headerStatus, { color: theme.colors.textMuted }]}>
              {group.members?.length || 0} members
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleViewInfo} style={styles.optionsButton}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwnMessage={item.sender.id === user?.id}
            onImagePress={(uri) => setSelectedImage(uri)}
            showSenderInfo={true}
            onSenderPress={handleViewProfile}
          />
        )}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
        }}
        ListFooterComponent={isTyping ? <TypingIndicator userName="Someone" /> : null}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <MessageInput
        onSendText={sendTextMessage}
        onSendImage={sendImageMessage}
        disabled={sending}
      />

      {/* Image Viewer */}
      {selectedImage && (
        <ImageViewer
          visible={!!selectedImage}
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </KeyboardAvoidingView>
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
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  optionsButton: {
    padding: 4,
  },
});