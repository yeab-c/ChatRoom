import mongoose, { Schema, type Document } from "mongoose";


// CHAT MODEL (One-on-One)

export interface IChat extends Document {
  chatId: string;
  participants: string[]; // PostgreSQL User IDs (exactly 2)
  type: 'temporary' | 'permanent';
  
  // Temporary chat fields
  isTemporary: boolean;
  expiresAt?: Date;
  savedBy: string[]; // User IDs who clicked save
  isSaved: boolean; // True when both users save
  
  // Chat metadata
  lastMessageId?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  
  // Tracking
  createdBy: string; // User who initiated (random match)
  
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  participants: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length === 2;
      },
      message: 'One-on-one chat must have exactly 2 participants'
    }
  },
  type: {
    type: String,
    enum: ['temporary', 'permanent'],
    default: 'temporary',
    required: true
  },
  isTemporary: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }
  },
  savedBy: {
    type: [String],
    default: []
  },
  isSaved: {
    type: Boolean,
    default: false
  },
  lastMessageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  lastMessagePreview: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    required: true
  }
}, { 
  timestamps: true 
});

// Indexes
ChatSchema.index({ participants: 1 });
ChatSchema.index({ type: 1 });
ChatSchema.index({ isTemporary: 1, expiresAt: 1 });
ChatSchema.index({ isSaved: 1 });
// Note: chatId already has unique: true, no need for separate index

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);


// GROUP CHAT MODEL

export interface IGroupChat extends Document {
  groupId: string;
  postgresGroupId: string; // PostgreSQL Group UUID
  
  // Group metadata (cached from PostgreSQL)
  name: string;
  avatar?: string;
  memberIds: string[]; // Cache of member IDs
  
  // Chat metadata
  lastMessageId?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const GroupChatSchema: Schema = new Schema({
  groupId: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  postgresGroupId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  memberIds: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length >= 2 && v.length <= 10;
      },
      message: 'Group must have between 2 and 10 members'
    }
  },
  lastMessageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  lastMessagePreview: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

// Indexes
GroupChatSchema.index({ memberIds: 1 });
// postgresGroupId and groupId already have unique: true, no need for separate indexes

export const GroupChat = mongoose.model<IGroupChat>('GroupChat', GroupChatSchema);



// MESSAGE MODEL

export interface IMessage extends Document {
  chatId: string; // Chat.chatId or GroupChat.groupId
  chatType: 'one-on-one' | 'group';
  senderId: string; // PostgreSQL User ID
  
  type: 'text' | 'image';
  content: string;
  
  // Image fields
  imageUrl?: string;
  imageThumbnail?: string;
  
  // Read receipts (for one-on-one)
  readBy: string[];
  deliveredTo: string[];
  
  // Reply support
  replyTo?: mongoose.Types.ObjectId;
  
  // Deletion
  isDeleted: boolean;
  deletedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
  chatId: {
    type: String,
    required: true,
    index: true
  },
  chatType: {
    type: String,
    enum: ['one-on-one', 'group'],
    required: true
  },
  senderId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image'],
    default: 'text',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  imageThumbnail: {
    type: String,
    default: null
  },
  readBy: {
    type: [String],
    default: []
  },
  deliveredTo: {
    type: [String],
    default: []
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true 
});

// Indexes
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ chatId: 1, chatType: 1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ isDeleted: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);



// MATCH QUEUE MODEL
export interface IMatchQueue extends Document {
  userId: string; // PostgreSQL User ID
  status: 'searching' | 'matched' | 'expired' | 'cancelled';
  matchedWith?: string; // User ID of matched user
  chatId?: string; // Created chat ID after match
  
  // Blocked users
  blockedUserIds: string[];
  
  searchStartedAt: Date;
  expiresAt: Date; // 5 minutes
  
  createdAt: Date;
  updatedAt: Date;
}

const MatchQueueSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true // Only one search per user at a time
  },
  status: {
    type: String,
    enum: ['searching', 'matched', 'expired', 'cancelled'],
    default: 'searching',
    required: true
  },
  matchedWith: {
    type: String,
    default: null
  },
  chatId: {
    type: String,
    default: null
  },
  blockedUserIds: {
    type: [String],
    default: []
  },
  searchStartedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  }
}, { 
  timestamps: true 
});

// Indexes
MatchQueueSchema.index({ status: 1, searchStartedAt: 1 });
MatchQueueSchema.index({ expiresAt: 1 });
// userId already has unique: true, no need for separate index

export const MatchQueue = mongoose.model<IMatchQueue>('MatchQueue', MatchQueueSchema);


// REPORT MODEL

export interface IReport extends Document {
  reporterId: string; // PostgreSQL User ID who reported
  reportedUserId: string; // PostgreSQL User ID being reported
  reason: string;
  chatId?: string; // Optional: chat where the issue occurred
  status: 'pending' | 'reviewed' | 'dismissed';
  
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
  reporterId: {
    type: String,
    required: true
  },
  reportedUserId: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  chatId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed'],
    default: 'pending',
    required: true
  }
}, { 
  timestamps: true 
});

// Indexes
ReportSchema.index({ reportedUserId: 1 });
ReportSchema.index({ reporterId: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);



// LOCAL STORAGE SCHEMA (For Mobile App)
// This is a reference for the mobile app's SQLite database
export const LOCAL_STORAGE_SCHEMA = `
-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chatId TEXT NOT NULL,
  senderId TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('text', 'image')),
  content TEXT NOT NULL,
  imageUrl TEXT,
  readBy TEXT DEFAULT '[]',
  deliveredTo TEXT DEFAULT '[]',
  isSynced INTEGER DEFAULT 0,
  isDeleted INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  chatId TEXT NOT NULL UNIQUE,
  participants TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('temporary', 'permanent', 'group')),
  lastMessageAt TEXT,
  lastMessagePreview TEXT,
  unreadCount INTEGER DEFAULT 0,
  isSynced INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  chatId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  userAvatar TEXT,
  isOnline INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE
);

-- Read receipts table
CREATE TABLE IF NOT EXISTS read_receipts (
  id TEXT PRIMARY KEY,
  messageId TEXT NOT NULL,
  userId TEXT NOT NULL,
  readAt TEXT NOT NULL,
  isSynced INTEGER DEFAULT 0,
  FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE
);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  messageId TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnailUrl TEXT,
  localPath TEXT,
  size INTEGER,
  isSynced INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_chatId ON messages(chatId);
CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_messages_isSynced ON messages(isSynced);
CREATE INDEX IF NOT EXISTS idx_chats_type ON chats(type);
CREATE INDEX IF NOT EXISTS idx_chats_lastMessageAt ON chats(lastMessageAt DESC);
CREATE INDEX IF NOT EXISTS idx_participants_chatId ON participants(chatId);
CREATE INDEX IF NOT EXISTS idx_participants_userId ON participants(userId);
CREATE INDEX IF NOT EXISTS idx_read_receipts_messageId ON read_receipts(messageId);
CREATE INDEX IF NOT EXISTS idx_attachments_messageId ON attachments(messageId);
`;

// Export interface for local storage types
export interface LocalMessage {
  id: string;
  chatId: string;
  senderId: string;
  type: 'text' | 'image';
  content: string;
  imageUrl?: string;
  readBy: string; // JSON string array
  deliveredTo: string; // JSON string array
  isSynced: 0 | 1;
  isDeleted: 0 | 1;
  createdAt: string;
  updatedAt: string;
}

export interface LocalChat {
  id: string;
  chatId: string;
  participants: string; // JSON string array
  type: 'temporary' | 'permanent' | 'group';
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
  isSynced: 0 | 1;
  createdAt: string;
  updatedAt: string;
}

export interface LocalParticipant {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isOnline: 0 | 1;
  createdAt: string;
}

export interface LocalReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  readAt: string;
  isSynced: 0 | 1;
}

export interface LocalAttachment {
  id: string;
  messageId: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  localPath?: string;
  size?: number;
  isSynced: 0 | 1;
  createdAt: string;
}