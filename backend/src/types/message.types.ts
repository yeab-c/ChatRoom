import { Types } from 'mongoose';

// Message type
export type MessageType = 'text' | 'image';

// Chat type for messages
export type MessageChatType = 'one-on-one' | 'group';

// Message interface
export interface IMessage {
  _id: Types.ObjectId;
  chatId: string;
  chatType: MessageChatType;
  senderId: string;
  type: MessageType;
  content: string;
  imageUrl?: string;
  imageThumbnail?: string;
  readBy: string[];
  deliveredTo: string[];
  replyTo?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Message creation data
export interface CreateMessageData {
  chatId: string;
  chatType: MessageChatType;
  senderId: string;
  type: MessageType;
  content: string;
  imageUrl?: string;
  imageThumbnail?: string;
  replyTo?: string;
}

// Message with sender info
export interface MessageWithSender {
  id: string;
  chatId: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  type: MessageType;
  content: string;
  imageUrl?: string;
  imageThumbnail?: string;
  readBy: string[];
  deliveredTo: string[];
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
    };
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Message pagination query
export interface MessagePaginationQuery {
  chatId: string;
  page: number;
  limit: number;
  before?: Date;
}

// Message read receipt
export interface MessageReadReceipt {
  messageId: string;
  userId: string;
  readAt: Date;
}

// Message delivery status
export interface MessageDeliveryStatus {
  messageId: string;
  delivered: boolean;
  deliveredTo: string[];
  read: boolean;
  readBy: string[];
}
