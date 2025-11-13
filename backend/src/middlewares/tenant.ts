import { Response, NextFunction } from 'express';
import { AuthRequest } from '../shared/types';
import { AuthorizationError, NotFoundError } from '../shared/errors/AppError';
import prisma from '../config/database';

/**
 * Middleware to verify tenant access and set tenantId in request
 * Use this after authentication middleware
 */
export const verifyTenantAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    // Tenant ID is already set from authentication
    const tenantId = req.user.tenantId;

    // Verify tenant exists and is active
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        status: true,
        plan: true,
        maxUsers: true,
        maxLeads: true,
        maxPipelines: true,
      },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    if (tenant.status === 'PAUSED') {
      throw new AuthorizationError('Tenant account is paused');
    }

    if (tenant.status === 'CANCELED') {
      throw new AuthorizationError('Tenant account is canceled');
    }

    // Attach tenant info to request for limit checks
    (req as any).tenant = tenant;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if tenant has reached a specific limit
 */
export const checkTenantLimit = (limitType: 'users' | 'leads' | 'pipelines') => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenant = (req as any).tenant;

      if (!tenant) {
        throw new AuthorizationError('Tenant not found in request');
      }

      let count = 0;
      let limit = 0;

      switch (limitType) {
        case 'users':
          count = await prisma.user.count({
            where: { tenantId: tenant.id },
          });
          limit = tenant.maxUsers;
          break;

        case 'leads':
          count = await prisma.lead.count({
            where: { tenantId: tenant.id },
          });
          limit = tenant.maxLeads;
          break;

        case 'pipelines':
          count = await prisma.column.count({
            where: { tenantId: tenant.id },
          });
          limit = tenant.maxPipelines;
          break;
      }

      if (count >= limit) {
        throw new AuthorizationError(
          `Tenant limit reached for ${limitType}. Current: ${count}, Limit: ${limit}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
