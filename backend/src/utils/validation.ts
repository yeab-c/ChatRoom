import validator from 'validator';

// Email validation
export const isValidEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

// Email domain validation
export const isAllowedEmailDomain = (email: string, domain: string): boolean => {
  const emailDomain = email.split('@')[1];
  return emailDomain === domain;
};

// UUID validation
export const isValidUUID = (id: string): boolean => {
  return validator.isUUID(id);
};

// Name validation
export const isValidName = (name: string): boolean => {
  return name.length > 0 && name.length <= 100;
};

// Message content validation
export const isValidMessageContent = (content: string): boolean => {
  return content.trim().length > 0 && content.length <= 5000;
};

// Group name validation
export const isValidGroupName = (name: string): boolean => {
  return name.trim().length > 0 && name.length <= 100;
};

// Group size validation
export const isValidGroupSize = (size: number): boolean => {
  return size >= 2 && size <= 10;
};

// File size validation
export const isValidFileSize = (size: number, maxSizeBytes: number): boolean => {
  return size <= maxSizeBytes;
};

// File type validation
export const isValidImageType = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype);
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
  });
};

// MongoDB ObjectId validation
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Pagination validation
export const validatePagination = (page?: number, limit?: number): {
  page: number;
  limit: number;
  skip: number;
} => {
  const validPage = page && page > 0 ? page : 1;
  const validLimit = limit && limit > 0 && limit <= 100 ? limit : 20;
  const skip = (validPage - 1) * validLimit;
  
  return { page: validPage, limit: validLimit, skip };
};