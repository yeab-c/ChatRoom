export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatar: string;
  bio?: string;
  gender?: string;
  age?: number;
  country?: string;
  hobbies?: string;
  isOnline: boolean;
  isSearching: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedId: string;
  blockedUser: User;
  createdAt: Date;
}