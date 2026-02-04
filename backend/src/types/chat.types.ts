import { Types } from 'mongoose';

// Chat type
export type ChatType = 'temporary' | 'permanent';

// Chat interface
export interface IChat {
  _id: Types.ObjectId;
  chatId: string;
  participants: string[]; // User IDs
  type: ChatType;
  isTemporary: boolean;
  expiresAt?: Date;
  savedBy: string[];
  isSaved: boolean;
  lastMessageId?: Types.ObjectId;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chat creation data
export interface CreateChatData {
  participants: [string, string]; // Exactly 2 participants
  createdBy: string;
  isTemporary: boolean;
}

// Chat list item
export interface ChatListItem {
  id: string;
  chatId: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage?: {
    content: string;
    type: 'text' | 'image';
    senderId: string;
    createdAt: Date;
  };
  unreadCount: number;
  type: ChatType;
  updatedAt: Date;
}

// Chat details
export interface ChatDetails {
  id: string;
  chatId: string;
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  }>;
  type: ChatType;
  isSaved: boolean;
  savedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Chat save status
export interface ChatSaveStatus {
  chatId: string;
  isSaved: boolean;
  savedBy: string[];
  requiresBothUsers: boolean;
}