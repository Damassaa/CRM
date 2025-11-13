import prisma from '../../config/database';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError';
import { PaginationParams, PaginatedResponse } from '../../shared/types';
import { createPaginatedResponse } from '../../shared/utils/pagination';
import { hashPassword, generateToken } from '../../shared/utils/crypto';
import { Tenant, TenantStatus, TenantPlan } from '@prisma/client';

interface CreateTenantData {
  companyName: string;
  email: string;
  phone?: string;
  plan: TenantPlan;
  status: TenantStatus;
  maxUsers: number;
  maxLeads: number;
  maxPipelines: number;
  primaryColor?: string;
  logoUrl?: string;
  adminName: string;
  adminEmail: string;
}

interface UpdateTenantData {
  companyName?: string;
  email?: string;
  phone?: string;
  plan?: TenantPlan;
  status?: TenantStatus;
  maxUsers?: number;
  maxLeads?: number;
  maxPipelines?: number;
  primaryColor?: string;
  logoUrl?: string;
}

interface TenantFilters {
  status?: string;
  plan?: string;
  search?: string;
}

export class TenantService {
  async list(
    pagination: PaginationParams,
    filters: TenantFilters
  ): Promise<PaginatedResponse<Tenant>> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.plan) {
      where.plan = filters.plan;
    }

    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    return createPaginatedResponse(tenants, total, pagination);
  }

  async getById(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            apiKeys: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    return tenant;
  }

  async create(data: CreateTenantData) {
    // Check if email already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { email: data.email },
    });

    if (existingTenant) {
      throw new ConflictError('A tenant with this email already exists');
    }

    // Generate unique schema name
    const schemaName = `tenant_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        plan: data.plan,
        status: data.status,
        maxUsers: data.maxUsers,
        maxLeads: data.maxLeads,
        maxPipelines: data.maxPipelines,
        primaryColor: data.primaryColor,
        logoUrl: data.logoUrl,
        schemaName,
      },
    });

    // Create default admin user
    const inviteToken = generateToken();
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: data.adminEmail,
        name: data.adminName,
        role: 'ADMIN',
        inviteToken,
        inviteExpiresAt,
        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: true,
        canMoveLeads: true,
        viewAllLeads: true,
      },
    });

    // Create default columns for the tenant
    const defaultColumns = [
      { name: 'Novo Lead', color: '#3B82F6', icon: '📋', position: 0 },
      { name: 'Contato Realizado', color: '#8B5CF6', icon: '📞', position: 1 },
      { name: 'Proposta Enviada', color: '#EC4899', icon: '📄', position: 2 },
      { name: 'Negociação', color: '#F59E0B', icon: '💬', position: 3 },
      { name: 'Ganho', color: '#10B981', icon: '✅', position: 4, isWinColumn: true },
      { name: 'Perdido', color: '#EF4444', icon: '❌', position: 5, isLostColumn: true },
    ];

    await prisma.column.createMany({
      data: defaultColumns.map((col) => ({
        ...col,
        tenantId: tenant.id,
      })),
    });

    // TODO: Send invite email to admin
    console.log(`Invite token for ${data.adminEmail}: ${inviteToken}`);
    console.log(
      `Invite link: ${process.env.FRONTEND_URL}/invite/accept?token=${inviteToken}`
    );

    return {
      ...tenant,
      inviteLink: `${process.env.FRONTEND_URL}/invite/accept?token=${inviteToken}`,
    };
  }

  async update(id: string, data: UpdateTenantData) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    // Check for email conflict if email is being updated
    if (data.email && data.email !== tenant.email) {
      const existingTenant = await prisma.tenant.findUnique({
        where: { email: data.email },
      });

      if (existingTenant) {
        throw new ConflictError('A tenant with this email already exists');
      }
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data,
    });

    return updatedTenant;
  }

  async delete(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    // Cascade delete will handle all related records
    await prisma.tenant.delete({
      where: { id },
    });
  }

  async getStats() {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      pausedTenants,
      totalUsers,
      recentTenants,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.tenant.count({ where: { status: 'TRIAL' } }),
      prisma.tenant.count({ where: { status: 'PAUSED' } }),
      prisma.user.count(),
      prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          companyName: true,
          email: true,
          status: true,
          plan: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      pausedTenants,
      totalUsers,
      recentTenants,
    };
  }

  async getTenantMetrics(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    const [totalUsers, totalLeads, totalColumns, totalActivities] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.lead.count({ where: { tenantId } }),
      prisma.column.count({ where: { tenantId } }),
      prisma.activity.count({ where: { tenantId } }),
    ]);

    return {
      tenant: {
        id: tenant.id,
        companyName: tenant.companyName,
        status: tenant.status,
        plan: tenant.plan,
      },
      metrics: {
        users: {
          current: totalUsers,
          limit: tenant.maxUsers,
          percentage: (totalUsers / tenant.maxUsers) * 100,
        },
        leads: {
          current: totalLeads,
          limit: tenant.maxLeads,
          percentage: (totalLeads / tenant.maxLeads) * 100,
        },
        pipelines: {
          current: totalColumns,
          limit: tenant.maxPipelines,
          percentage: (totalColumns / tenant.maxPipelines) * 100,
        },
        totalActivities,
      },
    };
  }
}
