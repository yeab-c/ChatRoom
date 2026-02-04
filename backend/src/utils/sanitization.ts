import validator from 'validator';

// Sanitize string input to prevent XSS
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Escape HTML
  sanitized = validator.escape(sanitized);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized;
};

// Sanitize email
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';
  return validator.normalizeEmail(email.trim().toLowerCase()) || '';
};

// Sanitize object recursively
export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

// Sanitize user content (keeps basic formatting)
export const sanitizeUserContent = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  // Only escape dangerous characters but keep newlines
  sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Limit consecutive newlines
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  
  return sanitized;
};

// Remove all HTML tags
export const stripHtml = (input: string): string => {
  if (typeof input !== 'string') return '';
  return validator.stripLow(input.replace(/<[^>]*>/g, ''));
};

// Sanitize filename
export const sanitizeFilename = (filename: string): string => {
  if (typeof filename !== 'string') return '';
  
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  
  // Remove special characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, maxLength - (ext ? ext.length + 1 : 0));
    sanitized = ext ? `${name}.${ext}` : name;
  }
  
  return sanitized;
};

// Check for SQL injection patterns
export const containsSqlInjection = (input: string): boolean => {
  if (typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|#|\/\*|\*\/|;)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
  ];
  
  return sqlPatterns.some((pattern) => pattern.test(input));
};

// Check for XSS patterns
export const containsXss = (input: string): boolean => {
  if (typeof input !== 'string') return false;
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];
  
  return xssPatterns.some((pattern) => pattern.test(input));
};
