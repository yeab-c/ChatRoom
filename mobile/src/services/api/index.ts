export { default as apiClient } from './client';
export { default as authService } from './auth';
export { default as userService } from './user';
export { default as chatService } from './chat';
export { default as matchingService } from './matching';
export { default as groupService } from './group';

// Re-export types
export type { User } from './auth';
export type { UpdateProfileData, UserStats, BlockedUser } from './user';
export type { MatchResult, MatchStatus, SaveChatResponse } from './matching';
export type { ChatListItem, Message, SendMessageData } from './chat';
export type { Group, GroupMember, CreateGroupData, UpdateGroupData } from './group';