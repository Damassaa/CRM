import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: 'ADMIN' | 'USER';
  };
  tenantId?: string;
}

export interface SuperAdminRequest extends Request {
  superAdmin?: {
    id: string;
    email: string;
  };
}

export interface ApiKeyRequest extends Request {
  apiKey?: {
    tenantId: string;
    keyId: string;
  };
  tenantId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
