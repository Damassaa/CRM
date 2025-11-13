import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { successResponse } from '../../shared/utils/response';
import { ColumnService } from './columns.service';
import { z } from 'zod';
import { ValidationError } from '../../shared/errors/AppError';

const columnService = new ColumnService();

const createColumnSchema = z.object({
  name: z.string().min(1, 'Column name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#6B7280'),
  icon: z.string().optional(),
  position: z.number().int().optional(),
  isWinColumn: z.boolean().default(false),
  isLostColumn: z.boolean().default(false),
});

const updateColumnSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().optional(),
  isWinColumn: z.boolean().optional(),
  isLostColumn: z.boolean().optional(),
});

const reorderColumnsSchema = z.object({
  columnIds: z.array(z.string()).min(1, 'At least one column is required'),
});

export class ColumnController {
  async list(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.tenantId) {
      throw new ValidationError('Tenant ID not found');
    }

    const columns = await columnService.list(req.tenantId);
    return successResponse(res, columns);
  }

  async getById(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    if (!req.tenantId) {
      throw new ValidationError('Tenant ID not found');
    }

    const column = await columnService.getById(id, req.tenantId);
    return successResponse(res, column);
  }

  async create(req: AuthRequest, res: Response): Promise<Response> {
    const validation = createColumnSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const column = await columnService.create(
      req.tenantId,
      validation.data,
      req.user.id
    );

    return successResponse(res, column, 201);
  }

  async update(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const validation = updateColumnSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const column = await columnService.update(
      id,
      req.tenantId,
      validation.data,
      req.user.id
    );

    return successResponse(res, column);
  }

  async delete(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    await columnService.delete(id, req.tenantId, req.user.id);
    return successResponse(res, { message: 'Column deleted successfully' });
  }

  async reorder(req: AuthRequest, res: Response): Promise<Response> {
    const validation = reorderColumnsSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    await columnService.reorder(
      req.tenantId,
      validation.data.columnIds,
      req.user.id
    );

    return successResponse(res, { message: 'Columns reordered successfully' });
  }
}
