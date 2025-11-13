import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { successResponse } from '../../shared/utils/response';
import { UserService } from './users.service';
import { z } from 'zod';
import { ValidationError } from '../../shared/errors/AppError';
import { getPaginationParams } from '../../shared/utils/pagination';

const userService = new UserService();

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
  canCreateLeads: z.boolean().default(true),
  canEditLeads: z.boolean().default(true),
  canDeleteLeads: z.boolean().default(false),
  canMoveLeads: z.boolean().default(true),
  viewAllLeads: z.boolean().default(true),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  canCreateLeads: z.boolean().optional(),
  canEditLeads: z.boolean().optional(),
  canDeleteLeads: z.boolean().optional(),
  canMoveLeads: z.boolean().optional(),
  viewAllLeads: z.boolean().optional(),
});

export class UserController {
  async list(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.tenantId) {
      throw new ValidationError('Tenant ID not found');
    }

    const { page, limit } = req.query;
    const { search } = req.query;

    const pagination = getPaginationParams(page, limit);

    const result = await userService.list(req.tenantId, pagination, {
      search: search as string,
    });

    return successResponse(res, result);
  }

  async getById(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    if (!req.tenantId) {
      throw new ValidationError('Tenant ID not found');
    }

    const user = await userService.getById(id, req.tenantId);
    return successResponse(res, user);
  }

  async invite(req: AuthRequest, res: Response): Promise<Response> {
    const validation = inviteUserSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const result = await userService.invite(
      req.tenantId,
      validation.data,
      req.user.id
    );

    return successResponse(res, result, 201);
  }

  async update(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const validation = updateUserSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const user = await userService.update(
      id,
      req.tenantId,
      validation.data,
      req.user.id
    );

    return successResponse(res, user);
  }

  async delete(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    await userService.delete(id, req.tenantId, req.user.id);
    return successResponse(res, { message: 'User deleted successfully' });
  }

  async resendInvite(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    await userService.resendInvite(id, req.tenantId);
    return successResponse(res, { message: 'Invite resent successfully' });
  }
}
