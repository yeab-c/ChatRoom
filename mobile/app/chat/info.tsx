import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Avatar } from '../../src/components/common/Avatar';
import { Button } from '../../src/components/common/Button';

export default function ChatInfoScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { chatId } = useLocalSearchParams();

  // Mock other user data - replace with actual data from API
  const otherUser = {
    id: '2',
    name: 'Alex Chen',
    email: 'alex@bitscollege.edu.et',
    avatar: '',
    bio: 'Love to meet new people and explore different cultures!',
    gender: 'Male',
    age: 25,
    country: 'Ethiopia',
    hobbies: 'Travel,Music,Photography',
    isOnline: true,
  };

  const hobbies = otherUser.hobbies.split(',');

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${otherUser.name}? You won't be able to message each other.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            // TODO: Call API to block user
            Alert.alert('Blocked', `${otherUser.name} has been blocked.`);
            router.back();
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.prompt(
      'Report User',
      `Why are you reporting ${otherUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: (reason: string | null | undefined) => {
            if (reason?.trim()) {
              // TODO: Call API to report user
              Alert.alert('Reported', 'Thank you for reporting. We will review this user.');
              router.back();
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const handleDeleteChat = () => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Call API to delete chat
            Alert.alert('Deleted', 'Chat has been deleted.');
            router.replace('/(tabs)/chats');
          },
        },
      ]
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
          <Avatar uri={otherUser.avatar} name={otherUser.name} size="xlarge" online={otherUser.isOnline} />
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
              {hobbies.map((hobby, index) => (
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
          <Button
            title="Block User"
            onPress={handleBlock}
            variant="outline"
            fullWidth
            style={{ marginBottom: theme.spacing.md }}
          />
          <Button
            title="Report User"
            onPress={handleReport}
            variant="outline"
            fullWidth
            style={{ marginBottom: theme.spacing.md }}
          />
          <Button
            title="Delete Chat"
            onPress={handleDeleteChat}
            variant="outline"
            fullWidth
            style={{ borderColor: theme.colors.error }}
            textStyle={{ color: theme.colors.error }}
          />
        </View>
      </ScrollView>
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