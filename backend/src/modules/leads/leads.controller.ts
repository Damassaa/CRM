import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { successResponse } from '../../shared/utils/response';
import { LeadService } from './leads.service';
import { z } from 'zod';
import { ValidationError } from '../../shared/errors/AppError';
import { getPaginationParams } from '../../shared/utils/pagination';

const leadService = new LeadService();

const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  estimatedValue: z.number().optional(),
  columnId: z.string().uuid('Invalid column ID'),
  responsibleId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  source: z.string().optional(),
  customFields: z.record(z.any()).optional(),
});

const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  estimatedValue: z.number().optional(),
  responsibleId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

const moveLeadSchema = z.object({
  columnId: z.string().uuid('Invalid column ID'),
  position: z.number().int().optional(),
});

const addActivitySchema = z.object({
  type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING', 'SYSTEM']).default('NOTE'),
  content: z.string().min(1, 'Content is required'),
});

export class LeadController {
  async list(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const { page, limit } = req.query;
    const { columnId, responsibleId, search, tags } = req.query;

    const pagination = getPaginationParams(page, limit);

    const result = await leadService.list(req.tenantId, req.user, pagination, {
      columnId: columnId as string,
      responsibleId: responsibleId as string,
      search: search as string,
      tags: tags ? (tags as string).split(',') : undefined,
    });

    return successResponse(res, result);
  }

  async getById(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const lead = await leadService.getById(id, req.tenantId, req.user);
    return successResponse(res, lead);
  }

  async create(req: AuthRequest, res: Response): Promise<Response> {
    const validation = createLeadSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const lead = await leadService.create(
      req.tenantId,
      req.user,
      validation.data,
      req.ip
    );

    return successResponse(res, lead, 201);
  }

  async update(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const validation = updateLeadSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const lead = await leadService.update(
      id,
      req.tenantId,
      req.user,
      validation.data,
      req.ip
    );

    return successResponse(res, lead);
  }

  async delete(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    await leadService.delete(id, req.tenantId, req.user, req.ip);
    return successResponse(res, { message: 'Lead deleted successfully' });
  }

  async move(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const validation = moveLeadSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const lead = await leadService.move(
      id,
      req.tenantId,
      req.user,
      validation.data.columnId,
      validation.data.position,
      req.ip
    );

    return successResponse(res, lead);
  }

  async getActivities(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { page, limit } = req.query;

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const pagination = getPaginationParams(page, limit);
    const result = await leadService.getActivities(id, req.tenantId, req.user, pagination);

    return successResponse(res, result);
  }

  async addActivity(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const validation = addActivitySchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const activity = await leadService.addActivity(
      id,
      req.tenantId,
      req.user,
      validation.data
    );

    return successResponse(res, activity, 201);
  }

  async getHistory(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { page, limit } = req.query;

    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const pagination = getPaginationParams(page, limit);
    const result = await leadService.getHistory(id, req.tenantId, req.user, pagination);

    return successResponse(res, result);
  }

  async getKanbanBoard(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.tenantId || !req.user) {
      throw new ValidationError('Tenant ID or User not found');
    }

    const board = await leadService.getKanbanBoard(req.tenantId, req.user);
    return successResponse(res, board);
  }
}
