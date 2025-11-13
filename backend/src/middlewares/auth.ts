import { Response, NextFunction } from 'express';
import { AuthRequest, SuperAdminRequest } from '../shared/types';
import { AuthenticationError, AuthorizationError } from '../shared/errors/AppError';
import { verifyAccessToken } from '../shared/utils/jwt';
import prisma from '../config/database';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    req.tenantId = user.tenantId;

    next();
  } catch (error) {
    next(new AuthenticationError((error as Error).message));
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AuthenticationError('Not authenticated'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new AuthorizationError('Admin access required'));
  }

  next();
};

export const authenticateSuperAdmin = async (
  req: SuperAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Verify super admin exists
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
      },
    });

    if (!superAdmin) {
      throw new AuthenticationError('Super admin not found');
    }

    req.superAdmin = {
      id: superAdmin.id,
      email: superAdmin.email,
    };

    next();
  } catch (error) {
    next(new AuthenticationError((error as Error).message));
  }
};
