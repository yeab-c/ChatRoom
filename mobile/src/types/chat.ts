export type ChatType = 'temporary' | 'permanent' | 'group';
export type MessageType = 'text' | 'image';
import { User } from './user';

export interface Chat {
  chatId: string;
  participants: string[]; // User IDs
  type: ChatType;
  isTemporary: boolean;
  expiresAt?: Date;
  savedBy: string[];
  isSaved: boolean;
  groupId?: string;
  lastMessage?: Message;
  lastMessageAt?: Date;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Populated fields (from backend)
  participantDetails?: User[];
  groupDetails?: Group;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content: string;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Populated
  sender?: User;
}

export interface Group {
  id: string;
  name: string;
  avatar?: string;
  creatorId: string;
  memberCount?: number;
  members?: GroupMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  user?: User;
  joinedAt: Date;
}

export interface ChatListItem extends Chat {
  otherUser?: User; // For 1-on-1 chats
  displayName: string;
  displayAvatar: string;
  lastMessageText: string;
  lastMessageTime: string;
  isTyping?: boolean;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
}