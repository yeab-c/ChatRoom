import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { HobbyChip } from './HobbyChip';
import { User } from '../../types';

interface ProfileCardProps {
  user: User;
  showHobbies?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, showHobbies = true }) => {
  const { theme } = useTheme();
  const hobbies = user.hobbies?.split(',') || [];

  return (
    <View style={[styles.container, { padding: theme.spacing.xl }]}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {user.avatar ? (
          <Avatar uri={user.avatar} name={user.name} size="xlarge" online={user.isOnline} />
        ) : (
          <LinearGradient
            colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.avatarGradient, { borderRadius: 60 }]}
          >
            <Text style={styles.avatarText}>
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </Text>
          </LinearGradient>
        )}
      </View>

      {/* Name & Bio */}
      <Text
        style={[
          styles.name,
          { color: theme.colors.text, marginTop: theme.spacing.lg },
          theme.typography.heading,
        ]}
      >
        {user.name}
      </Text>

      {user.bio && (
        <Text
          style={[
            styles.bio,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
            theme.typography.body,
          ]}
        >
          {user.bio}
        </Text>
      )}

      {/* Details */}
      <View style={[styles.detailsRow, { marginTop: theme.spacing.lg }]}>
        {user.gender && (
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Gender</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{user.gender}</Text>
          </View>
        )}
        {user.age && (
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Age</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{user.age}</Text>
          </View>
        )}
      </View>

      {user.country && (
        <View style={[styles.detailItem, { marginTop: theme.spacing.md }]}>
          <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Country</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{user.country}</Text>
        </View>
      )}

      {/* Hobbies */}
      {showHobbies && hobbies.length > 0 && (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Text style={[styles.detailLabel, { color: theme.colors.textMuted, marginBottom: theme.spacing.sm }]}>
            Hobbies
          </Text>
          <View style={styles.hobbiesContainer}>
            {hobbies.map((hobby, index) => (
              <HobbyChip key={index} hobby={hobby.trim()} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarGradient: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  hobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});