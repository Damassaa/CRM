import prisma from '../../config/database';
import {
  NotFoundError,
  ConflictError,
  AuthorizationError,
  ValidationError,
} from '../../shared/errors/AppError';
import { PaginationParams, PaginatedResponse } from '../../shared/types';
import { createPaginatedResponse } from '../../shared/utils/pagination';
import { generateToken } from '../../shared/utils/crypto';
import { UserRole } from '@prisma/client';

interface InviteUserData {
  email: string;
  name: string;
  role: UserRole;
  canCreateLeads: boolean;
  canEditLeads: boolean;
  canDeleteLeads: boolean;
  canMoveLeads: boolean;
  viewAllLeads: boolean;
}

interface UpdateUserData {
  name?: string;
  role?: UserRole;
  canCreateLeads?: boolean;
  canEditLeads?: boolean;
  canDeleteLeads?: boolean;
  canMoveLeads?: boolean;
  viewAllLeads?: boolean;
}

interface UserFilters {
  search?: string;
}

export class UserService {
  async list(
    tenantId: string,
    pagination: PaginationParams,
    filters: UserFilters
  ): Promise<PaginatedResponse<any>> {
    const where: any = { tenantId };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          canCreateLeads: true,
          canEditLeads: true,
          canDeleteLeads: true,
          canMoveLeads: true,
          viewAllLeads: true,
          lastLoginAt: true,
          createdAt: true,
          password: false, // Exclude password
        },
      }),
      prisma.user.count({ where }),
    ]);

    return createPaginatedResponse(users, total, pagination);
  }

  async getById(id: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: true,
        canMoveLeads: true,
        viewAllLeads: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  async invite(tenantId: string, data: InviteUserData, invitedBy: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId,
        email: data.email,
      },
    });

    if (existingUser) {
      throw new ConflictError('A user with this email already exists in your organization');
    }

    // Generate invite token
    const inviteToken = generateToken();
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const user = await prisma.user.create({
      data: {
        tenantId,
        email: data.email,
        name: data.name,
        role: data.role,
        canCreateLeads: data.canCreateLeads,
        canEditLeads: data.canEditLeads,
        canDeleteLeads: data.canDeleteLeads,
        canMoveLeads: data.canMoveLeads,
        viewAllLeads: data.viewAllLeads,
        inviteToken,
        inviteExpiresAt,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: invitedBy,
        action: 'CREATE',
        resource: 'user',
        resourceId: user.id,
        metadata: { userName: user.name, userEmail: user.email },
      },
    });

    // TODO: Send invite email
    console.log(`Invite token for ${data.email}: ${inviteToken}`);
    console.log(
      `Invite link: ${process.env.FRONTEND_URL}/invite/accept?token=${inviteToken}`
    );

    return {
      ...user,
      inviteLink: `${process.env.FRONTEND_URL}/invite/accept?token=${inviteToken}`,
    };
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateUserData,
    updatedBy: string
  ) {
    const user = await prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Cannot change own role
    if (id === updatedBy && data.role) {
      throw new ValidationError('You cannot change your own role');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: true,
        canMoveLeads: true,
        viewAllLeads: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: updatedBy,
        action: 'UPDATE',
        resource: 'user',
        resourceId: id,
        metadata: { changes: data },
      },
    });

    return updatedUser;
  }

  async delete(id: string, tenantId: string, deletedBy: string) {
    const user = await prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Cannot delete yourself
    if (id === deletedBy) {
      throw new ValidationError('You cannot delete your own account');
    }

    // Check if user has assigned leads
    const leadsCount = await prisma.lead.count({
      where: {
        tenantId,
        responsibleId: id,
      },
    });

    if (leadsCount > 0) {
      throw new ValidationError(
        `Cannot delete user with ${leadsCount} assigned leads. Please reassign leads first.`
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: deletedBy,
        action: 'DELETE',
        resource: 'user',
        resourceId: id,
        metadata: { userName: user.name },
      },
    });
  }

  async resendInvite(id: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.password) {
      throw new ValidationError('User has already accepted the invite');
    }

    // Generate new invite token
    const inviteToken = generateToken();
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.user.update({
      where: { id },
      data: {
        inviteToken,
        inviteExpiresAt,
      },
    });

    // TODO: Send invite email
    console.log(`New invite token for ${user.email}: ${inviteToken}`);
  }
}
