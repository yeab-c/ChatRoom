// Pagination query
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

// API response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
}

// Error detail
export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

// Match queue entry
export interface MatchQueueEntry {
  userId: string;
  status: 'searching' | 'matched' | 'expired' | 'cancelled';
  matchedWith?: string;
  chatId?: string;
  blockedUserIds: string[];
  searchStartedAt: Date;
  expiresAt: Date;
}

// Match result
export interface MatchResult {
  success: boolean;
  chatId?: string;
  otherUser?: {
    id: string;
    name: string;
    avatar: string;
  };
  message?: string;
}

// Blocked user
export interface BlockedUser {
  id: string;
  blockedUser: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
}

// Report
export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  reportedUser: {
    id: string;
    name: string;
    email: string;
  };
}

// Uploaded file
export interface UploadedFile {
  url: string;
  publicId: string;
  thumbnail?: string;
  size: number;
  format: string;
}

// Admin statistics
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalChats: number;
  totalGroups: number;
  totalMessages: number;
  pendingReports: number;
  bannedUsers: number;
}
