import { Response, NextFunction } from 'express';
import { ApiKeyRequest } from '../shared/types';
import { AuthenticationError } from '../shared/errors/AppError';
import { hashApiKey } from '../shared/utils/crypto';
import prisma from '../config/database';

export const authenticateApiKey = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AuthenticationError('No API key provided');
    }

    // Hash the provided key
    const hashedKey = hashApiKey(apiKey);

    // Find the API key
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      include: {
        tenant: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!keyRecord) {
      throw new AuthenticationError('Invalid API key');
    }

    // Check if tenant is active
    if (keyRecord.tenant.status !== 'ACTIVE') {
      throw new AuthenticationError('Tenant account is not active');
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: {
        lastUsedAt: new Date(),
        lastUsedIp: req.ip,
      },
    });

    req.apiKey = {
      tenantId: keyRecord.tenantId,
      keyId: keyRecord.id,
    };

    req.tenantId = keyRecord.tenantId;

    next();
  } catch (error) {
    next(new AuthenticationError((error as Error).message));
  }
};
