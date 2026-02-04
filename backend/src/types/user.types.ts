import { User as PrismaUser } from '@prisma/client';

// User type from Prisma
export type User = PrismaUser;

// Public user profile (safe to expose)
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string | null;
  gender: string | null;
  age: number | null;
  country: string | null;
  hobbies: string | null;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
}

// User profile update data
export interface UpdateUserProfileData {
  name?: string;
  avatar?: string;
  bio?: string;
  gender?: string;
  age?: number;
  country?: string;
  hobbies?: string;
}

// User search result
export interface UserSearchResult {
  id: string;
  name: string;
  avatar: string;
  bio: string | null;
  isOnline: boolean;
}

// User authentication data
export interface UserAuthData {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  isBanned: boolean;
}

// User statistics
export interface UserStats {
  savedChats: number;
  groups: number;
  blockedUsers: number;
}

