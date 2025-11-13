import { Response } from 'express';
import { SuperAdminRequest } from '../../shared/types';
import { successResponse } from '../../shared/utils/response';
import { TenantService } from './tenants.service';
import { z } from 'zod';
import { ValidationError } from '../../shared/errors/AppError';
import { getPaginationParams } from '../../shared/utils/pagination';

const tenantService = new TenantService();

const createTenantSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).default('BASIC'),
  status: z.enum(['TRIAL', 'ACTIVE']).default('TRIAL'),
  maxUsers: z.number().int().positive().default(5),
  maxLeads: z.number().int().positive().default(1000),
  maxPipelines: z.number().int().positive().default(5),
  primaryColor: z.string().optional(),
  logoUrl: z.string().url().optional(),
  adminName: z.string().min(2, 'Admin name is required'),
  adminEmail: z.string().email('Invalid admin email format'),
});

const updateTenantSchema = z.object({
  companyName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).optional(),
  status: z.enum(['TRIAL', 'ACTIVE', 'PAUSED', 'CANCELED']).optional(),
  maxUsers: z.number().int().positive().optional(),
  maxLeads: z.number().int().positive().optional(),
  maxPipelines: z.number().int().positive().optional(),
  primaryColor: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

export class TenantController {
  async list(req: SuperAdminRequest, res: Response): Promise<Response> {
    const { page, limit } = req.query;
    const { status, plan, search } = req.query;

    const pagination = getPaginationParams(page, limit);

    const result = await tenantService.list(pagination, {
      status: status as string,
      plan: plan as string,
      search: search as string,
    });

    return successResponse(res, result);
  }

  async getById(req: SuperAdminRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const tenant = await tenantService.getById(id);
    return successResponse(res, tenant);
  }

  async create(req: SuperAdminRequest, res: Response): Promise<Response> {
    const validation = createTenantSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    const tenant = await tenantService.create(validation.data);
    return successResponse(res, tenant, 201);
  }

  async update(req: SuperAdminRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const validation = updateTenantSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    const tenant = await tenantService.update(id, validation.data);
    return successResponse(res, tenant);
  }

  async delete(req: SuperAdminRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    await tenantService.delete(id);
    return successResponse(res, { message: 'Tenant deleted successfully' });
  }

  async getStats(req: SuperAdminRequest, res: Response): Promise<Response> {
    const stats = await tenantService.getStats();
    return successResponse(res, stats);
  }

  async getTenantMetrics(req: SuperAdminRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const metrics = await tenantService.getTenantMetrics(id);
    return successResponse(res, metrics);
  }
}
