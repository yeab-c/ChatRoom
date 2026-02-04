export * from './user';
export * from './chat';
export * from './navigation';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}