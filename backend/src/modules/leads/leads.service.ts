import prisma from '../../config/database';
import {
  NotFoundError,
  AuthorizationError,
  ValidationError,
} from '../../shared/errors/AppError';
import { PaginationParams, PaginatedResponse } from '../../shared/types';
import { createPaginatedResponse } from '../../shared/utils/pagination';
import { ActivityType } from '@prisma/client';

interface CreateLeadData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  estimatedValue?: number;
  columnId: string;
  responsibleId?: string;
  tags?: string[];
  source?: string;
  customFields?: Record<string, any>;
}

interface UpdateLeadData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  estimatedValue?: number;
  responsibleId?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

interface LeadFilters {
  columnId?: string;
  responsibleId?: string;
  search?: string;
  tags?: string[];
}

interface UserContext {
  id: string;
  role: 'ADMIN' | 'USER';
  tenantId: string;
}

export class LeadService {
  private async checkLeadAccess(leadId: string, tenantId: string, user: UserContext) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      select: {
        id: true,
        responsibleId: true,
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead');
    }

    // Check permissions
    const userPerms = await prisma.user.findUnique({
      where: { id: user.id },
      select: { viewAllLeads: true },
    });

    if (
      user.role !== 'ADMIN' &&
      !userPerms?.viewAllLeads &&
      lead.responsibleId !== user.id
    ) {
      throw new AuthorizationError('You do not have access to this lead');
    }

    return lead;
  }

  async list(
    tenantId: string,
    user: UserContext,
    pagination: PaginationParams,
    filters: LeadFilters
  ): Promise<PaginatedResponse<any>> {
    const where: any = { tenantId };

    // Check if user can view all leads
    const userPerms = await prisma.user.findUnique({
      where: { id: user.id },
      select: { viewAllLeads: true },
    });

    if (user.role !== 'ADMIN' && !userPerms?.viewAllLeads) {
      where.responsibleId = user.id;
    }

    if (filters.columnId) {
      where.columnId = filters.columnId;
    }

    if (filters.responsibleId) {
      where.responsibleId = filters.responsibleId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy: [{ columnId: 'asc' }, { positionInColumn: 'asc' }],
        include: {
          column: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          responsible: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return createPaginatedResponse(leads, total, pagination);
  }

  async getById(id: string, tenantId: string, user: UserContext) {
    await this.checkLeadAccess(id, tenantId, user);

    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        column: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        responsible: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return lead;
  }

  async create(
    tenantId: string,
    user: UserContext,
    data: CreateLeadData,
    ipAddress?: string
  ) {
    // Check permissions
    const userPerms = await prisma.user.findUnique({
      where: { id: user.id },
      select: { canCreateLeads: true },
    });

    if (user.role !== 'ADMIN' && !userPerms?.canCreateLeads) {
      throw new AuthorizationError('You do not have permission to create leads');
    }

    // Verify column exists and belongs to tenant
    const column = await prisma.column.findFirst({
      where: { id: data.columnId, tenantId },
    });

    if (!column) {
      throw new ValidationError('Invalid column');
    }

    // Get max position in column
    const maxPositionLead = await prisma.lead.findFirst({
      where: { columnId: data.columnId, tenantId },
      orderBy: { positionInColumn: 'desc' },
      select: { positionInColumn: true },
    });

    const positionInColumn = maxPositionLead ? maxPositionLead.positionInColumn + 1 : 0;

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        position: data.position,
        estimatedValue: data.estimatedValue,
        columnId: data.columnId,
        positionInColumn,
        responsibleId: data.responsibleId || user.id,
        tags: data.tags || [],
        source: data.source || 'manual',
        customFields: data.customFields || {},
        createdBy: user.id,
        enteredCurrentColumnAt: new Date(),
      },
      include: {
        column: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        responsible: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        tenantId,
        leadId: lead.id,
        userId: user.id,
        type: 'SYSTEM',
        content: `Lead criado`,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'CREATE',
        resource: 'lead',
        resourceId: lead.id,
        ipAddress,
        metadata: { leadName: lead.name },
      },
    });

    return lead;
  }

  async update(
    id: string,
    tenantId: string,
    user: UserContext,
    data: UpdateLeadData,
    ipAddress?: string
  ) {
    await this.checkLeadAccess(id, tenantId, user);

    // Check permissions
    const userPerms = await prisma.user.findUnique({
      where: { id: user.id },
      select: { canEditLeads: true },
    });

    if (user.role !== 'ADMIN' && !userPerms?.canEditLeads) {
      throw new AuthorizationError('You do not have permission to edit leads');
    }

    // Get old data for history
    const oldLead = await prisma.lead.findUnique({
      where: { id },
    });

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        updatedBy: user.id,
      },
      include: {
        column: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        responsible: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create history entry
    await prisma.leadHistory.create({
      data: {
        tenantId,
        leadId: id,
        action: 'updated',
        fromData: oldLead,
        toData: lead,
        userId: user.id,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        tenantId,
        leadId: id,
        userId: user.id,
        type: 'SYSTEM',
        content: `Lead atualizado`,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'UPDATE',
        resource: 'lead',
        resourceId: id,
        ipAddress,
        metadata: { changes: data },
      },
    });

    return lead;
  }

  async delete(id: string, tenantId: string, user: UserContext, ipAddress?: string) {
    await this.checkLeadAccess(id, tenantId, user);

    // Check permissions
    const userPerms = await prisma.user.findUnique({
      where: { id: user.id },
      select: { canDeleteLeads: true },
    });

    if (user.role !== 'ADMIN' && !userPerms?.canDeleteLeads) {
      throw new AuthorizationError('You do not have permission to delete leads');
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { name: true },
    });

    await prisma.lead.delete({
      where: { id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'DELETE',
        resource: 'lead',
        resourceId: id,
        ipAddress,
        metadata: { leadName: lead?.name },
      },
    });
  }

  async move(
    id: string,
    tenantId: string,
    user: UserContext,
    newColumnId: string,
    position?: number,
    ipAddress?: string
  ) {
    await this.checkLeadAccess(id, tenantId, user);

    // Check permissions
    const userPerms = await prisma.user.findUnique({
      where: { id: user.id },
      select: { canMoveLeads: true },
    });

    if (user.role !== 'ADMIN' && !userPerms?.canMoveLeads) {
      throw new AuthorizationError('You do not have permission to move leads');
    }

    // Verify new column exists
    const newColumn = await prisma.column.findFirst({
      where: { id: newColumnId, tenantId },
    });

    if (!newColumn) {
      throw new ValidationError('Invalid column');
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        column: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead');
    }

    const oldColumnId = lead.columnId;

    // Calculate new position
    let newPosition = position;
    if (newPosition === undefined) {
      const maxPositionLead = await prisma.lead.findFirst({
        where: { columnId: newColumnId, tenantId },
        orderBy: { positionInColumn: 'desc' },
        select: { positionInColumn: true },
      });
      newPosition = maxPositionLead ? maxPositionLead.positionInColumn + 1 : 0;
    }

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        columnId: newColumnId,
        positionInColumn: newPosition,
        enteredCurrentColumnAt: new Date(),
        updatedBy: user.id,
      },
      include: {
        column: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        responsible: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create history
    await prisma.leadHistory.create({
      data: {
        tenantId,
        leadId: id,
        action: 'moved',
        fromData: { columnId: oldColumnId, columnName: lead.column.name },
        toData: { columnId: newColumnId, columnName: newColumn.name },
        userId: user.id,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        tenantId,
        leadId: id,
        userId: user.id,
        type: 'SYSTEM',
        content: `Lead movido de "${lead.column.name}" para "${newColumn.name}"`,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'MOVE',
        resource: 'lead',
        resourceId: id,
        ipAddress,
        metadata: {
          from: lead.column.name,
          to: newColumn.name,
        },
      },
    });

    return updatedLead;
  }

  async getActivities(
    leadId: string,
    tenantId: string,
    user: UserContext,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    await this.checkLeadAccess(leadId, tenantId, user);

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { leadId, tenantId },
        skip: pagination.offset,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.activity.count({ where: { leadId, tenantId } }),
    ]);

    return createPaginatedResponse(activities, total, pagination);
  }

  async addActivity(
    leadId: string,
    tenantId: string,
    user: UserContext,
    data: { type: ActivityType; content: string }
  ) {
    await this.checkLeadAccess(leadId, tenantId, user);

    const activity = await prisma.activity.create({
      data: {
        tenantId,
        leadId,
        userId: user.id,
        type: data.type,
        content: data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return activity;
  }

  async getHistory(
    leadId: string,
    tenantId: string,
    user: UserContext,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    await this.checkLeadAccess(leadId, tenantId, user);

    const [history, total] = await Promise.all([
      prisma.leadHistory.findMany({
        where: { leadId, tenantId },
        skip: pagination.offset,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leadHistory.count({ where: { leadId, tenantId } }),
    ]);

    return createPaginatedResponse(history, total, pagination);
  }

  async getKanbanBoard(tenantId: string, user: UserContext) {
    // Get all columns with leads
    const columns = await prisma.column.findMany({
      where: { tenantId },
      orderBy: { position: 'asc' },
      include: {
        leads: {
          where: await this.getLeadWhereClause(tenantId, user),
          orderBy: { positionInColumn: 'asc' },
          include: {
            responsible: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return columns;
  }

  private async getLeadWhereClause(tenantId: string, user: UserContext) {
    const where: any = { tenantId };

    // Check if user can view all leads
    const userPerms = await prisma.user.findUnique({
      where: { id: user.id },
      select: { viewAllLeads: true },
    });

    if (user.role !== 'ADMIN' && !userPerms?.viewAllLeads) {
      where.responsibleId = user.id;
    }

    return where;
  }
}
