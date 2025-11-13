import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { successResponse } from '../../shared/utils/response';
import { AuthService } from './auth.service';
import { z } from 'zod';
import { ValidationError } from '../../shared/errors/AppError';

const authService = new AuthService();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const setPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export class AuthController {
  async login(req: AuthRequest, res: Response): Promise<Response> {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    const { email, password } = validation.data;
    const result = await authService.login(email, password, req.ip);

    return successResponse(res, result);
  }

  async refreshToken(req: AuthRequest, res: Response): Promise<Response> {
    const validation = refreshSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    const { refreshToken } = validation.data;
    const result = await authService.refreshToken(refreshToken);

    return successResponse(res, result);
  }

  async logout(req: AuthRequest, res: Response): Promise<Response> {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success (client should delete tokens)
    return successResponse(res, { message: 'Logged out successfully' });
  }

  async me(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const user = await authService.getUserProfile(req.user.id);
    return successResponse(res, user);
  }

  async requestPasswordReset(req: AuthRequest, res: Response): Promise<Response> {
    const validation = resetPasswordRequestSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    const { email } = validation.data;
    await authService.requestPasswordReset(email);

    return successResponse(res, {
      message: 'If the email exists, a password reset link has been sent',
    });
  }

  async resetPassword(req: AuthRequest, res: Response): Promise<Response> {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    const { token, newPassword } = validation.data;
    await authService.resetPassword(token, newPassword);

    return successResponse(res, { message: 'Password reset successfully' });
  }

  async setPassword(req: AuthRequest, res: Response): Promise<Response> {
    const validation = setPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    const { token, password } = validation.data;
    const result = await authService.setPasswordWithInvite(token, password);

    return successResponse(res, result);
  }

  // Super Admin Auth
  async superAdminLogin(req: AuthRequest, res: Response): Promise<Response> {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    const { email, password } = validation.data;
    const result = await authService.superAdminLogin(email, password);

    return successResponse(res, result);
  }
}
