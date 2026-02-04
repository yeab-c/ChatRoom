// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Authentication
  UNAUTHORIZED: 'Unauthorized. Please log in.',
  INVALID_TOKEN: 'Invalid or expired token.',
  INVALID_EMAIL_DOMAIN: 'Email must be from @bitscollege.edu.et domain.',

  // User
  USER_NOT_FOUND: 'User not found.',
  USER_BANNED: 'User account has been banned.',
  USER_BLOCKED: 'You have blocked this user.',

  // Chat
  CHAT_NOT_FOUND: 'Chat not found.',
  CHAT_EXPIRED: 'Chat has expired.',
  CHAT_ALREADY_SAVED: 'Chat is already saved.',
  BOTH_USERS_MUST_SAVE: 'Both users must save the chat for it to become permanent.',

  // Group
  GROUP_NOT_FOUND: 'Group not found.',
  GROUP_FULL: 'Group has reached maximum members (10).',
  NOT_GROUP_CREATOR: 'Only group creator can perform this action.',
  USER_NOT_IN_GROUP: 'User is not a member of this group.',
  USER_ALREADY_IN_GROUP: 'User is already in the group.',
  CANNOT_ADD_UNSAVED_USER: 'Can only add users from saved chats.',

  // Match
  ALREADY_SEARCHING: 'You are already searching for a match.',
  NO_MATCH_FOUND: 'No available users to match with.',
  MATCH_TIMEOUT: 'Match search timed out.',
  CANNOT_MATCH_BLOCKED_USER: 'Cannot match with blocked users.',
  CANNOT_MATCH_SELF: 'Cannot match with yourself.',

  // Message
  MESSAGE_NOT_FOUND: 'Message not found.',
  MESSAGE_TOO_LONG: 'Message exceeds maximum length.',
  INVALID_MESSAGE_TYPE: 'Invalid message type.',

  // Upload
  FILE_TOO_LARGE: 'File size exceeds maximum limit (5MB).',
  INVALID_FILE_TYPE: 'Invalid file type. Only images are allowed.',
  UPLOAD_FAILED: 'File upload failed.',

  // Rate limit
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',

  // Validation
  VALIDATION_ERROR: 'Validation error.',
  INVALID_INPUT: 'Invalid input provided.',

  // Server
  INTERNAL_SERVER_ERROR: 'Internal server error.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  CHAT_SAVED: 'Chat saved successfully.',
  CHAT_CREATED: 'Chat created successfully.',
  CHAT_DELETED: 'Chat deleted successfully.',
  MESSAGE_SENT: 'Message sent successfully.',
  GROUP_CREATED: 'Group created successfully.',
  GROUP_UPDATED: 'Group updated successfully.',
  GROUP_DELETED: 'Group deleted successfully.',
  MEMBER_ADDED: 'Member added successfully.',
  MEMBER_REMOVED: 'Member removed successfully.',
  USER_BLOCKED: 'User blocked successfully.',
  USER_UNBLOCKED: 'User unblocked successfully.',
  USER_REPORTED: 'User reported successfully.',
  MATCH_FOUND: 'Match found!',
  MATCH_CANCELLED: 'Match search cancelled.',
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  BLOCKED_USERS: (userId: string) => `user:${userId}:blocked`,
  ONLINE_USERS: 'users:online',
} as const;

// Cache TTL (seconds)
export const CACHE_TTL = {
  USER_PROFILE: 3600, // 1 hour
  ONLINE_USERS: 300, // 5 minutes
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;